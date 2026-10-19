create table if not exists demand_pricing_settings (
  canteen_id text primary key references canteens (id) on delete cascade,
  moderate_demand_percent integer not null default 30 check (moderate_demand_percent between 1 and 1000),
  moderate_price_percent integer not null default 5 check (moderate_price_percent between 0 and 20),
  high_demand_percent integer not null default 50 check (high_demand_percent between 2 and 1000),
  high_price_percent integer not null default 10 check (high_price_percent between 0 and 20),
  last_evaluated_at timestamptz,
  updated_at timestamptz not null default now(),
  check (high_demand_percent > moderate_demand_percent),
  check (high_price_percent >= moderate_price_percent)
);

insert into demand_pricing_settings (canteen_id)
select id from canteens
on conflict (canteen_id) do nothing;

create table if not exists item_demand_prices (
  item_id text primary key references items (id) on delete cascade,
  canteen_id text not null references canteens (id) on delete cascade,
  demand_growth_percent integer not null default 0 check (demand_growth_percent >= 0),
  applied_price_increase_percent integer not null default 0 check (applied_price_increase_percent between 0 and 20),
  pending_price_increase_percent integer check (pending_price_increase_percent between 0 and 20),
  pending_since timestamptz,
  admin_override boolean not null default false,
  updated_at timestamptz not null default now(),
  check ((pending_price_increase_percent is null) = (pending_since is null))
);

create index if not exists item_demand_prices_canteen_idx on item_demand_prices (canteen_id);
