-- =============================================================================
-- BIZI MVP — Negotiation RPCs (apply third)
-- These wrap the multi-table state transitions in transactions with locking,
-- so the client can call a single RPC and the server enforces invariants.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Send first proposal: creates negotiation + proposal v1 + system message,
-- and marks the interest as converted.
-- -----------------------------------------------------------------------------
create or replace function public.send_first_proposal(
  p_interest_id   uuid,
  p_owner_gives   text,
  p_seeker_gives  text,
  p_timeline_days int,
  p_notes         text
) returns table(negotiation_id uuid, proposal_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_caller        uuid := auth.uid();
  v_interest      record;
  v_negotiation   uuid;
  v_proposal      uuid;
begin
  if v_caller is null then raise exception 'unauthenticated'; end if;

  select i.*, o.owner_id as opp_owner_id
  into v_interest
  from public.interests i
  join public.opportunities o on o.id = i.opportunity_id
  where i.id = p_interest_id
  for update;

  if not found then raise exception 'interest not found'; end if;
  if v_interest.opp_owner_id <> v_caller then raise exception 'only opportunity owner can send a proposal'; end if;
  if v_interest.status not in ('pending','seen') then raise exception 'interest is not actionable (status=%)', v_interest.status; end if;

  insert into public.negotiations (
    opportunity_id, interest_id, owner_id, seeker_id,
    status, current_proposal_version, last_action_by, last_action_at, expires_at
  ) values (
    v_interest.opportunity_id, v_interest.id, v_caller, v_interest.seeker_id,
    'proposal_sent', 1, v_caller, now(), now() + interval '21 days'
  )
  returning id into v_negotiation;

  insert into public.proposals (
    negotiation_id, proposed_by, version,
    owner_gives, seeker_gives, timeline_days, notes, status
  ) values (
    v_negotiation, v_caller, 1,
    p_owner_gives, p_seeker_gives, p_timeline_days, p_notes, 'pending'
  )
  returning id into v_proposal;

  insert into public.messages (negotiation_id, sender_id, content, type, proposal_id)
  values (v_negotiation, v_caller, 'sent the first proposal', 'system', v_proposal);

  update public.interests set status = 'converted' where id = p_interest_id;

  insert into public.notifications (user_id, type, reference_id, body)
  values (v_interest.seeker_id, 'proposal_sent', v_negotiation, 'You received a proposal');

  return query select v_negotiation, v_proposal;
end $$;

-- -----------------------------------------------------------------------------
-- Submit a counter-offer. Optimistic lock on current_proposal_version.
-- -----------------------------------------------------------------------------
create or replace function public.submit_counter_proposal(
  p_negotiation_id   uuid,
  p_expected_version int,
  p_owner_gives      text,
  p_seeker_gives     text,
  p_timeline_days    int,
  p_notes            text
) returns table(proposal_id uuid, version int)
language plpgsql security definer set search_path = public as $$
declare
  v_caller   uuid := auth.uid();
  v_neg      record;
  v_new_ver  int;
  v_proposal uuid;
  v_other    uuid;
begin
  if v_caller is null then raise exception 'unauthenticated'; end if;

  select * into v_neg from public.negotiations where id = p_negotiation_id for update;
  if not found then raise exception 'negotiation not found'; end if;
  if v_caller not in (v_neg.owner_id, v_neg.seeker_id) then raise exception 'not a participant'; end if;
  if v_neg.last_action_by = v_caller then raise exception 'cannot counter your own last proposal'; end if;
  if v_neg.status not in ('proposal_sent','counter_sent') then raise exception 'negotiation is not in a counter-able state (status=%)', v_neg.status; end if;
  if v_neg.current_proposal_version <> p_expected_version then
    raise exception 'version conflict: server has v%, client expected v%', v_neg.current_proposal_version, p_expected_version;
  end if;

  v_new_ver := v_neg.current_proposal_version + 1;

  update public.proposals set status = 'countered', responded_at = now()
   where negotiation_id = p_negotiation_id and version = v_neg.current_proposal_version;

  insert into public.proposals (negotiation_id, proposed_by, version, owner_gives, seeker_gives, timeline_days, notes, status)
  values (p_negotiation_id, v_caller, v_new_ver, p_owner_gives, p_seeker_gives, p_timeline_days, p_notes, 'pending')
  returning id into v_proposal;

  update public.negotiations
     set status = 'counter_sent',
         current_proposal_version = v_new_ver,
         last_action_by = v_caller,
         last_action_at = now()
   where id = p_negotiation_id;

  insert into public.messages (negotiation_id, sender_id, content, type, proposal_id)
  values (p_negotiation_id, v_caller, 'sent a counter-offer', 'system', v_proposal);

  v_other := case when v_caller = v_neg.owner_id then v_neg.seeker_id else v_neg.owner_id end;
  insert into public.notifications (user_id, type, reference_id, body)
  values (v_other, 'counter_sent', p_negotiation_id, 'You received a counter-offer');

  return query select v_proposal, v_new_ver;
end $$;

-- -----------------------------------------------------------------------------
-- Accept a proposal. Caller must NOT be the proposer. Creates the trade record.
-- -----------------------------------------------------------------------------
create or replace function public.accept_proposal(
  p_negotiation_id uuid,
  p_proposal_id    uuid
) returns table(trade_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_neg    record;
  v_prop   record;
  v_trade  uuid;
begin
  if v_caller is null then raise exception 'unauthenticated'; end if;

  select * into v_neg from public.negotiations where id = p_negotiation_id for update;
  if not found then raise exception 'negotiation not found'; end if;
  if v_caller not in (v_neg.owner_id, v_neg.seeker_id) then raise exception 'not a participant'; end if;

  select * into v_prop from public.proposals where id = p_proposal_id and negotiation_id = p_negotiation_id;
  if not found then raise exception 'proposal not found'; end if;
  if v_prop.version <> v_neg.current_proposal_version then raise exception 'proposal is no longer current'; end if;
  if v_prop.proposed_by = v_caller then raise exception 'cannot accept your own proposal'; end if;

  update public.proposals set status = 'accepted', responded_at = now() where id = p_proposal_id;

  update public.negotiations
     set status = 'in_progress',
         last_action_by = v_caller,
         last_action_at = now()
   where id = p_negotiation_id;

  insert into public.trades (negotiation_id, final_proposal_id, owner_id, seeker_id, status)
  values (p_negotiation_id, p_proposal_id, v_neg.owner_id, v_neg.seeker_id, 'in_progress')
  returning id into v_trade;

  insert into public.messages (negotiation_id, sender_id, content, type, proposal_id)
  values (p_negotiation_id, v_caller, 'accepted the deal — trade is now in progress', 'system', p_proposal_id);

  insert into public.notifications (user_id, type, reference_id, body) values
    (v_neg.owner_id,  'both_accepted', v_trade, 'Trade accepted — in progress'),
    (v_neg.seeker_id, 'both_accepted', v_trade, 'Trade accepted — in progress');

  return query select v_trade;
end $$;

-- -----------------------------------------------------------------------------
-- Mark a trade complete from one side. When both sides have marked it, the
-- trade transitions to 'completed' and notifications are sent.
-- -----------------------------------------------------------------------------
create or replace function public.mark_trade_complete(p_trade_id uuid)
returns table(status text)
language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_trade  record;
  v_new    text;
begin
  if v_caller is null then raise exception 'unauthenticated'; end if;

  select * into v_trade from public.trades where id = p_trade_id for update;
  if not found then raise exception 'trade not found'; end if;
  if v_caller not in (v_trade.owner_id, v_trade.seeker_id) then raise exception 'not a participant'; end if;
  if v_trade.status not in ('in_progress','completed_by_owner','completed_by_seeker') then
    raise exception 'trade is not completable (status=%)', v_trade.status;
  end if;

  if v_caller = v_trade.owner_id then
    if v_trade.owner_completed_at is not null then raise exception 'already marked complete'; end if;
    update public.trades set owner_completed_at = now() where id = p_trade_id;
  else
    if v_trade.seeker_completed_at is not null then raise exception 'already marked complete'; end if;
    update public.trades set seeker_completed_at = now() where id = p_trade_id;
  end if;

  -- recompute status
  select * into v_trade from public.trades where id = p_trade_id;
  if v_trade.owner_completed_at is not null and v_trade.seeker_completed_at is not null then
    v_new := 'completed';
    update public.trades set status = 'completed', completed_at = now() where id = p_trade_id;
    update public.negotiations set status = 'completed' where id = v_trade.negotiation_id;
    insert into public.notifications (user_id, type, reference_id, body) values
      (v_trade.owner_id,  'trade_completed', p_trade_id, 'Trade completed — leave a review'),
      (v_trade.seeker_id, 'trade_completed', p_trade_id, 'Trade completed — leave a review');
  elsif v_trade.owner_completed_at is not null then
    v_new := 'completed_by_owner';
    update public.trades set status = 'completed_by_owner' where id = p_trade_id;
    insert into public.notifications (user_id, type, reference_id, body)
    values (v_trade.seeker_id, 'trade_completed', p_trade_id, 'Owner marked complete — confirm on your side');
  else
    v_new := 'completed_by_seeker';
    update public.trades set status = 'completed_by_seeker' where id = p_trade_id;
    insert into public.notifications (user_id, type, reference_id, body)
    values (v_trade.owner_id, 'trade_completed', p_trade_id, 'Seeker marked complete — confirm on your side');
  end if;

  return query select v_new;
end $$;
