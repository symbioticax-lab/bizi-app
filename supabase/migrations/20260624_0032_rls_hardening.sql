-- =============================================================================
-- BIZI MVP — RLS hardening (security audit follow-up)
--
-- Fixes three issues found in the security audit, all caused by UPDATE policies
-- that were permissive enough to allow more than their intended action:
--
--   1/2. messages & dm_messages — a participant could UPDATE *any* row in their
--        thread, including rewriting the OTHER party's `content` / `sender_id`.
--        The only legitimate update is stamping `read_at`. RLS can't restrict
--        which columns an UPDATE touches, so we add a BEFORE UPDATE trigger that
--        rejects changes to every column except `read_at`. The existing
--        read-marking code (sets read_at only) keeps working unchanged.
--
--   3.   connections — the UPDATE policy allowed requester OR recipient, letting
--        a requester set their own request to 'accepted' without the other party
--        agreeing (which is the gate for starting DMs). Restrict UPDATE to the
--        recipient; the requester can still cancel via DELETE.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. messages — only read_at may change on UPDATE.
-- -----------------------------------------------------------------------------
create or replace function public.guard_message_immutable()
returns trigger language plpgsql as $$
begin
  if new.id             is distinct from old.id
     or new.negotiation_id is distinct from old.negotiation_id
     or new.sender_id   is distinct from old.sender_id
     or new.content     is distinct from old.content
     or new.type        is distinct from old.type
     or new.proposal_id is distinct from old.proposal_id
     or new.created_at  is distinct from old.created_at then
    raise exception 'messages: only read_at may be updated';
  end if;
  return new;
end $$;

drop trigger if exists messages_guard_immutable on public.messages;
create trigger messages_guard_immutable
  before update on public.messages
  for each row execute function public.guard_message_immutable();

-- -----------------------------------------------------------------------------
-- 2. dm_messages — only read_at may change on UPDATE.
-- -----------------------------------------------------------------------------
create or replace function public.guard_dm_message_immutable()
returns trigger language plpgsql as $$
begin
  if new.id         is distinct from old.id
     or new.thread_id is distinct from old.thread_id
     or new.sender_id is distinct from old.sender_id
     or new.content   is distinct from old.content
     or new.created_at is distinct from old.created_at then
    raise exception 'dm_messages: only read_at may be updated';
  end if;
  return new;
end $$;

drop trigger if exists dm_messages_guard_immutable on public.dm_messages;
create trigger dm_messages_guard_immutable
  before update on public.dm_messages
  for each row execute function public.guard_dm_message_immutable();

-- -----------------------------------------------------------------------------
-- 3. connections — only the recipient may accept/decline. The requester keeps
--    DELETE (cancel) via the existing connections_delete policy.
-- -----------------------------------------------------------------------------
drop policy if exists "connections_update" on public.connections;
create policy "connections_update" on public.connections
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
