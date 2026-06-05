-- Fingerball initial schema
-- Run this whole file in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists members (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text unique not null,
  created_at   timestamptz not null default now()
);

create table if not exists people (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  image_url         text,
  added_by          uuid not null references members(id) on delete cascade,
  happy_to_see_us   smallint check (happy_to_see_us between 1 and 3),   -- 1 😀 thrilled, 2 😐 meh, 3 😬 not happy
  opinion_change    smallint check (opinion_change between 1 and 3),    -- 1 📈 better, 2 ➡️ same, 3 📉 worse
  interesting_facts text,
  merged_into       uuid references people(id) on delete set null,      -- set when this card is merged away
  created_at        timestamptz not null default now()
);
create index if not exists people_active_idx on people (created_at desc) where merged_into is null;

create table if not exists superlatives (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references people(id) on delete cascade,
  text         text not null,
  suggested_by uuid not null references members(id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index if not exists superlatives_person_idx on superlatives (person_id);

create table if not exists votes (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references people(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (person_id, member_id)
);
create index if not exists votes_person_idx on votes (person_id);

create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,           -- 'person_added' | 'superlative_added' | 'voted' | 'merged'
  actor      uuid not null references members(id) on delete cascade,
  person_id  uuid references people(id) on delete set null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_feed_idx on events (created_at desc);

-- =========================================================
-- MERGE FUNCTION  (any logged-in member can merge two cards)
-- =========================================================
create or replace function merge_person(from_id uuid, into_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be logged in';
  end if;
  if from_id = into_id then
    raise exception 'cannot merge a person into itself';
  end if;

  -- move superlatives
  update superlatives set person_id = into_id where person_id = from_id;

  -- move votes, but skip members who already voted on the target (avoid unique clash)
  update votes set person_id = into_id
    where person_id = from_id
      and member_id not in (select member_id from votes where person_id = into_id);
  delete from votes where person_id = from_id;

  -- repoint feed events
  update events set person_id = into_id where person_id = from_id;

  -- mark the old card as merged away
  update people set merged_into = into_id where id = from_id;

  -- log it
  insert into events (type, actor, person_id, payload)
  values ('merged', auth.uid(), into_id,
          jsonb_build_object('from', from_id, 'into', into_id));
end;
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- Everyone logged in can READ everything (it's a shared friend feed).
-- You can only WRITE rows attributed to yourself.
-- =========================================================
alter table members     enable row level security;
alter table people      enable row level security;
alter table superlatives enable row level security;
alter table votes       enable row level security;
alter table events      enable row level security;

-- members
create policy members_read   on members for select to authenticated using (true);
create policy members_insert on members for insert to authenticated with check (id = auth.uid());
create policy members_update on members for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- people
create policy people_read   on people for select to authenticated using (true);
create policy people_insert on people for insert to authenticated with check (added_by = auth.uid());
create policy people_update on people for update to authenticated using (true) with check (true); -- any member may edit/merge

-- superlatives
create policy superlatives_read   on superlatives for select to authenticated using (true);
create policy superlatives_insert on superlatives for insert to authenticated with check (suggested_by = auth.uid());

-- votes
create policy votes_read   on votes for select to authenticated using (true);
create policy votes_insert on votes for insert to authenticated with check (member_id = auth.uid());
create policy votes_update on votes for update to authenticated using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy votes_delete on votes for delete to authenticated using (member_id = auth.uid());

-- events
create policy events_read   on events for select to authenticated using (true);
create policy events_insert on events for insert to authenticated with check (actor = auth.uid());

-- =========================================================
-- REALTIME  (so the feed updates live)
-- =========================================================
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table people;

-- =========================================================
-- STORAGE  (bucket for optional person photos)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('people-photos', 'people-photos', true)
on conflict (id) do nothing;

create policy "people_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'people-photos');

create policy "people_photos_auth_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'people-photos');
