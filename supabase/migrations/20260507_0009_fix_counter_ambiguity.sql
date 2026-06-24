-- =============================================================================
-- BIZI MVP — Fix: column reference "version" was ambiguous in submit_counter_proposal
-- The OUT parameter `version` (from RETURNS TABLE) collided with the
-- `proposals.version` column. Qualifying the column references resolves it.
-- Apply after 0008. CREATE OR REPLACE — safe to re-run.
-- =============================================================================

create or replace function public.submit_counter_proposal(
  p_negotiation_id   uuid,
  p_expected_version int,
  p_owner_gives      text,
  p_seeker_gives     text,
  p_timeline_days    int,
  p_notes            text
) returns table(proposal_id uuid, version int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_caller    uuid := auth.uid();
  v_neg       record;
  v_opp_neg   boolean;
  v_new_ver   int;
  v_proposal  uuid;
  v_other     uuid;
begin
  if v_caller is null then raise exception 'unauthenticated'; end if;

  select * into v_neg from public.negotiations n where n.id = p_negotiation_id for update;
  if not found then raise exception 'negotiation not found'; end if;
  if v_caller not in (v_neg.owner_id, v_neg.seeker_id) then raise exception 'not a participant'; end if;
  if v_neg.last_action_by = v_caller then raise exception 'cannot counter your own last proposal'; end if;
  if v_neg.status not in ('proposal_sent','counter_sent') then
    raise exception 'negotiation is not in a counter-able state (status=%)', v_neg.status;
  end if;
  if v_neg.current_proposal_version <> p_expected_version then
    raise exception 'version conflict: server has v%, client expected v%', v_neg.current_proposal_version, p_expected_version;
  end if;

  select o.negotiable into v_opp_neg from public.opportunities o where o.id = v_neg.opportunity_id;
  if v_opp_neg = false then
    raise exception 'this listing is not open to counter-offers';
  end if;

  v_new_ver := v_neg.current_proposal_version + 1;

  update public.proposals p
     set status = 'countered',
         responded_at = now()
   where p.negotiation_id = p_negotiation_id
     and p.version = v_neg.current_proposal_version;

  insert into public.proposals (
    negotiation_id, proposed_by, version, owner_gives, seeker_gives, timeline_days, notes, status
  ) values (
    p_negotiation_id, v_caller, v_new_ver, p_owner_gives, p_seeker_gives, p_timeline_days, p_notes, 'pending'
  )
  returning id into v_proposal;

  update public.negotiations n
     set status = 'counter_sent',
         current_proposal_version = v_new_ver,
         last_action_by = v_caller,
         last_action_at = now()
   where n.id = p_negotiation_id;

  insert into public.messages (negotiation_id, sender_id, content, type, proposal_id)
  values (p_negotiation_id, v_caller, 'sent a counter-offer', 'system', v_proposal);

  v_other := case when v_caller = v_neg.owner_id then v_neg.seeker_id else v_neg.owner_id end;
  insert into public.notifications (user_id, actor_id, type, reference_id, body)
  values (v_other, v_caller, 'counter_sent', p_negotiation_id, 'sent a counter-offer');

  return query select v_proposal, v_new_ver;
end $$;
