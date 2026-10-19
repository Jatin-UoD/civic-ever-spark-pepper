create table if not exists analytics_recommendations (
  id text primary key,
  canteen_id text not null references canteens (id) on delete cascade,
  kind text not null check (kind in ('top_sellers', 'promotion_idea', 'low_sales_review', 'combo_suggestion')),
  title text not null,
  body text not null,
  item_ids jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  fingerprint text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  decided_by text references "user" (id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists analytics_user_context (
  user_id text primary key references "user" (id) on delete cascade,
  canteen_id text not null references canteens (id) on delete cascade,
  updated_at timestamptz not null default now()
);

create unique index if not exists analytics_recommendations_pending_fingerprint_idx
  on analytics_recommendations (canteen_id, fingerprint)
  where status = 'pending';

create index if not exists analytics_recommendations_canteen_created_idx
  on analytics_recommendations (canteen_id, created_at desc);
