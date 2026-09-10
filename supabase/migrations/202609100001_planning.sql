create extension if not exists pgcrypto;

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null default '',
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  transaction_date timestamptz not null default now(),
  status text not null default 'completed' check (status in ('completed', 'planned')),
  source text not null default 'manual' check (source in ('manual', 'recurring')),
  recurring_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  month_start date not null check (extract(day from month_start) = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('expense', 'income')),
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_run_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'income' or category_id is not null)
);

alter table public.incomes drop constraint if exists incomes_recurring_id_fkey;
alter table public.incomes
  add constraint incomes_recurring_id_fkey
  foreign key (recurring_id) references public.recurring_transactions(id) on delete set null;

alter table public.expenses add column if not exists recurring_id uuid;
alter table public.expenses drop constraint if exists expenses_recurring_id_fkey;
alter table public.expenses
  add constraint expenses_recurring_id_fkey
  foreign key (recurring_id) references public.recurring_transactions(id) on delete set null;

create index if not exists incomes_user_date_idx on public.incomes(user_id, transaction_date desc);
create index if not exists budgets_user_month_idx on public.budgets(user_id, month_start desc);
create index if not exists recurring_user_next_idx on public.recurring_transactions(user_id, next_run_date);
create unique index if not exists budgets_user_category_month_unique
  on public.budgets(user_id, category_id, month_start) where category_id is not null;
create unique index if not exists budgets_user_global_month_unique
  on public.budgets(user_id, month_start) where category_id is null;
create unique index if not exists expenses_recurring_date_unique
  on public.expenses(recurring_id, transaction_date) where recurring_id is not null;
create unique index if not exists incomes_recurring_date_unique
  on public.incomes(recurring_id, transaction_date) where recurring_id is not null;

alter table public.incomes enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;

revoke all on public.incomes, public.budgets, public.recurring_transactions from anon;
grant select, insert, update, delete on public.incomes, public.budgets, public.recurring_transactions to authenticated;

drop policy if exists "Users manage own incomes" on public.incomes;
create policy "Users manage own incomes" on public.incomes
  for all to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
drop policy if exists "Users manage own budgets" on public.budgets;
create policy "Users manage own budgets" on public.budgets
  for all to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
drop policy if exists "Users manage own recurring transactions" on public.recurring_transactions;
create policy "Users manage own recurring transactions" on public.recurring_transactions
  for all to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
