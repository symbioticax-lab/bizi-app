-- =============================================================================
-- BIZI MVP — Row Level Security policies (apply fourth)
-- Default-deny: enable RLS on every table, then add explicit allow rules.
-- =============================================================================

alter table public.profiles      enable row level security;
alter table public.offerings     enable row level security;
alter table public.wants         enable row level security;
alter table public.opportunities enable row level security;
alter table public.interests     enable row level security;
alter table public.negotiations  enable row level security;
alter table public.proposals     enable row level security;
alter table public.messages      enable row level security;
alter table public.trades        enable row level security;
alter table public.reviews       enable row level security;
alter table public.notifications enable row level security;

-- -----------------------------------------------------------------------------
-- profiles: anyone can read; only the owner can update.
-- INSERT is handled by the on_auth_user_created trigger (security definer).
-- -----------------------------------------------------------------------------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- offerings: anyone reads active rows; owner can read all of theirs and CRUD.
-- -----------------------------------------------------------------------------
drop policy if exists offerings_read on public.offerings;
create policy offerings_read on public.offerings for select
  using (status = 'active' or auth.uid() = user_id);

drop policy if exists offerings_write_self on public.offerings;
create policy offerings_write_self on public.offerings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- wants: same shape as offerings.
-- -----------------------------------------------------------------------------
drop policy if exists wants_read on public.wants;
create policy wants_read on public.wants for select
  using (status = 'active' or auth.uid() = user_id);

drop policy if exists wants_write_self on public.wants;
create policy wants_write_self on public.wants for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- opportunities: anyone reads active/paused; owner reads all of theirs and CRUD.
-- -----------------------------------------------------------------------------
drop policy if exists opportunities_read on public.opportunities;
create policy opportunities_read on public.opportunities for select
  using (status in ('active','paused','closed','completed') or auth.uid() = owner_id);

drop policy if exists opportunities_write_self on public.opportunities;
create policy opportunities_write_self on public.opportunities for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- -----------------------------------------------------------------------------
-- interests: visible to seeker (their own) and to opportunity owner.
-- -----------------------------------------------------------------------------
drop policy if exists interests_read on public.interests;
create policy interests_read on public.interests for select
  using (
    auth.uid() = seeker_id
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.owner_id = auth.uid())
  );

drop policy if exists interests_insert_seeker on public.interests;
create policy interests_insert_seeker on public.interests for insert
  with check (auth.uid() = seeker_id);

drop policy if exists interests_update on public.interests;
create policy interests_update on public.interests for update
  using (
    auth.uid() = seeker_id
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.owner_id = auth.uid())
  );

drop policy if exists interests_delete_seeker on public.interests;
create policy interests_delete_seeker on public.interests for delete
  using (auth.uid() = seeker_id);

-- -----------------------------------------------------------------------------
-- negotiations: visible only to participants. Mutations go through RPCs
-- (security definer), so direct INSERT/UPDATE policies are intentionally absent.
-- -----------------------------------------------------------------------------
drop policy if exists negotiations_read on public.negotiations;
create policy negotiations_read on public.negotiations for select
  using (auth.uid() in (owner_id, seeker_id));

-- -----------------------------------------------------------------------------
-- proposals: visible to negotiation participants only. Writes via RPC.
-- -----------------------------------------------------------------------------
drop policy if exists proposals_read on public.proposals;
create policy proposals_read on public.proposals for select
  using (
    exists (select 1 from public.negotiations n
             where n.id = negotiation_id
               and auth.uid() in (n.owner_id, n.seeker_id))
  );

-- -----------------------------------------------------------------------------
-- messages: participants can read; sender can insert into their own thread.
-- -----------------------------------------------------------------------------
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select
  using (
    exists (select 1 from public.negotiations n
             where n.id = negotiation_id
               and auth.uid() in (n.owner_id, n.seeker_id))
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (select 1 from public.negotiations n
                 where n.id = negotiation_id
                   and auth.uid() in (n.owner_id, n.seeker_id))
  );

drop policy if exists messages_update_read on public.messages;
create policy messages_update_read on public.messages for update
  using (
    exists (select 1 from public.negotiations n
             where n.id = negotiation_id
               and auth.uid() in (n.owner_id, n.seeker_id))
  );

-- -----------------------------------------------------------------------------
-- trades: visible to participants only. Mutations via RPC.
-- -----------------------------------------------------------------------------
drop policy if exists trades_read on public.trades;
create policy trades_read on public.trades for select
  using (auth.uid() in (owner_id, seeker_id));

-- -----------------------------------------------------------------------------
-- reviews: anyone can read (public reputation). Only participants can write,
-- and only one per side per trade (UNIQUE constraint enforces this).
-- -----------------------------------------------------------------------------
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using (true);

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.trades t
       where t.id = trade_id
         and t.status = 'completed'
         and auth.uid() in (t.owner_id, t.seeker_id)
         and reviewee_id = case when auth.uid() = t.owner_id then t.seeker_id else t.owner_id end
    )
  );

-- -----------------------------------------------------------------------------
-- notifications: each user reads/writes their own only.
-- -----------------------------------------------------------------------------
drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
  using (auth.uid() = user_id);
