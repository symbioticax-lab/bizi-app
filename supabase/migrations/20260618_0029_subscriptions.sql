-- Subscription tiers: free | pro | elite
-- subscription_tier is cached on profiles for fast reads (webhook keeps it in sync)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'elite'));

-- Main subscriptions table — one row per user, updated by Stripe webhook
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier                   text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'elite')),
  status                 text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'incomplete')),
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  trial_ends_at          timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);

-- Monthly usage counters reset each billing period
CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period_start          date NOT NULL DEFAULT date_trunc('month', now())::date,
  connection_requests   integer NOT NULL DEFAULT 0,
  boosts_used           integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_usage_user_period_idx
  ON public.subscription_usage (user_id, period_start);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS subscriptions_touch_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_touch_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS subscription_usage_touch_updated_at ON public.subscription_usage;
CREATE TRIGGER subscription_usage_touch_updated_at
  BEFORE UPDATE ON public.subscription_usage
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- When subscriptions.tier changes, mirror it to profiles.subscription_tier
CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.profiles
  SET subscription_tier = NEW.tier
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_sync_tier ON public.subscriptions;
CREATE TRIGGER subscriptions_sync_tier
  AFTER INSERT OR UPDATE OF tier ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_tier();

-- RLS: users can read their own subscription; webhook (service role) writes
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own subscription" ON public.subscriptions;
CREATE POLICY "users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can read own usage" ON public.subscription_usage;
CREATE POLICY "users can read own usage"
  ON public.subscription_usage FOR SELECT
  USING (auth.uid() = user_id);

-- RPC: atomically upsert usage row and increment a counter
-- Called server-side from subscription/server.ts after gate checks pass
CREATE OR REPLACE FUNCTION increment_subscription_usage(
  p_user_id  uuid,
  p_field    text,
  p_period   date
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.subscription_usage (user_id, period_start, connection_requests, boosts_used)
  VALUES (p_user_id, p_period, 0, 0)
  ON CONFLICT (user_id, period_start) DO NOTHING;

  IF p_field = 'connection_requests' THEN
    UPDATE public.subscription_usage
    SET connection_requests = connection_requests + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = p_period;
  ELSIF p_field = 'boosts_used' THEN
    UPDATE public.subscription_usage
    SET boosts_used = boosts_used + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = p_period;
  END IF;
END;
$$;

-- Seed a free subscription row for every existing profile that doesn't have one
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT id, 'free', 'active'
FROM public.profiles
ON CONFLICT DO NOTHING;
