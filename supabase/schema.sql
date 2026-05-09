create table if not exists public.goals (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  why_it_matters text default '',
  target_date date not null,
  status text not null check (status in ('not_started', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  goal_id text not null references public.goals(id) on delete cascade,
  title text not null,
  description text default '',
  due_date date not null,
  completed boolean not null default false,
  success_criteria text[] not null default '{}',
  blockers text[] not null default '{}',
  next_step text default '',
  notes text
);

create table if not exists public.weekly_actions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  goal_id text not null references public.goals(id) on delete cascade,
  milestone_id text not null references public.milestones(id) on delete cascade,
  title text not null,
  description text default '',
  week_start_date date not null,
  completed boolean not null default false,
  estimated_time text default '30 minutes',
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  energy_level text default 'medium' check (energy_level in ('low', 'medium', 'high')),
  notes text,
  active_week boolean not null default false,
  week_locked boolean not null default false
);

create table if not exists public.execution_logs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  completed_action_ids text[] not null default '{}',
  completed_count integer not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);

alter table public.goals add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.milestones add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.weekly_actions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.execution_logs add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.execution_logs drop constraint if exists execution_logs_date_key;
create unique index if not exists execution_logs_user_date_key on public.execution_logs(user_id, date);

alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.weekly_actions enable row level security;
alter table public.execution_logs enable row level security;

drop policy if exists "Allow public goal reads" on public.goals;
drop policy if exists "Allow public goal writes" on public.goals;
drop policy if exists "Allow public milestone reads" on public.milestones;
drop policy if exists "Allow public milestone writes" on public.milestones;
drop policy if exists "Allow public weekly action reads" on public.weekly_actions;
drop policy if exists "Allow public weekly action writes" on public.weekly_actions;
drop policy if exists "Allow public execution log reads" on public.execution_logs;
drop policy if exists "Allow public execution log writes" on public.execution_logs;

drop policy if exists "Users can read own goals" on public.goals;
drop policy if exists "Users can create own goals" on public.goals;
drop policy if exists "Users can update own goals" on public.goals;
drop policy if exists "Users can delete own goals" on public.goals;

create policy "Users can read own goals" on public.goals
  for select using (auth.uid() = user_id);
create policy "Users can create own goals" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals
  for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own milestones" on public.milestones;
drop policy if exists "Users can create own milestones" on public.milestones;
drop policy if exists "Users can update own milestones" on public.milestones;
drop policy if exists "Users can delete own milestones" on public.milestones;

create policy "Users can read own milestones" on public.milestones
  for select using (auth.uid() = user_id);
create policy "Users can create own milestones" on public.milestones
  for insert with check (auth.uid() = user_id);
create policy "Users can update own milestones" on public.milestones
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own milestones" on public.milestones
  for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own weekly actions" on public.weekly_actions;
drop policy if exists "Users can create own weekly actions" on public.weekly_actions;
drop policy if exists "Users can update own weekly actions" on public.weekly_actions;
drop policy if exists "Users can delete own weekly actions" on public.weekly_actions;

create policy "Users can read own weekly actions" on public.weekly_actions
  for select using (auth.uid() = user_id);
create policy "Users can create own weekly actions" on public.weekly_actions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own weekly actions" on public.weekly_actions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own weekly actions" on public.weekly_actions
  for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own execution logs" on public.execution_logs;
drop policy if exists "Users can create own execution logs" on public.execution_logs;
drop policy if exists "Users can update own execution logs" on public.execution_logs;
drop policy if exists "Users can delete own execution logs" on public.execution_logs;

create policy "Users can read own execution logs" on public.execution_logs
  for select using (auth.uid() = user_id);
create policy "Users can create own execution logs" on public.execution_logs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own execution logs" on public.execution_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own execution logs" on public.execution_logs
  for delete using (auth.uid() = user_id);
