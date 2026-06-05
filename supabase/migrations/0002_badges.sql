-- Fingerball badges: persistent FINGERBALLER (5+ upvotes) and FINGERBALLED
-- (5+ downvotes) stamps. Once earned, a badge is sticky — it never comes off,
-- even if votes are later removed.
--
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run

alter table people
  add column if not exists is_fingerballer boolean not null default false,
  add column if not exists is_fingerballed boolean not null default false;

-- Recompute the affected person's badges whenever votes change. Badges only
-- ever flip to true (sticky), via OR-ing the existing value.
create or replace function fingerball_update_badges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
  ups int;
  downs int;
begin
  pid := coalesce(new.person_id, old.person_id);
  select
    count(*) filter (where value = 1),
    count(*) filter (where value = -1)
  into ups, downs
  from votes
  where person_id = pid;

  update people
  set is_fingerballer = is_fingerballer or (ups >= 5),
      is_fingerballed = is_fingerballed or (downs >= 5)
  where id = pid;

  return null;
end;
$$;

drop trigger if exists trg_fingerball_badges on votes;
create trigger trg_fingerball_badges
after insert or update or delete on votes
for each row
execute function fingerball_update_badges();

-- Backfill badges for anyone who already crossed a threshold.
update people p
set is_fingerballer = (select count(*) from votes v where v.person_id = p.id and v.value = 1) >= 5,
    is_fingerballed = (select count(*) from votes v where v.person_id = p.id and v.value = -1) >= 5;
