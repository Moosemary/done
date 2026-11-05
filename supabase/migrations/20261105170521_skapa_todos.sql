-- Punkter och projekt i samma tabell. Underpunkter pekar på sitt projekt.
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('item', 'project')),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  parent_id uuid references public.todos (id) on delete cascade,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  -- Ett projekt kan inte ha en förälder.
  constraint todos_project_utan_foralder check (kind = 'item' or parent_id is null)
);

create index todos_parent_id_created_at_idx
  on public.todos (parent_id, created_at desc);

-- Row Level Security på, utan policyer: anon-nyckeln släpps inte in alls.
-- Backenden använder den hemliga nyckeln, som går förbi RLS.
alter table public.todos enable row level security;
