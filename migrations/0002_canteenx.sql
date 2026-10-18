-- CanteenX tenant hierarchy, menu, orders, payments, and audit trail.
-- Money is integer paise. Item prices are snapshotted onto order lines.

create table if not exists institutions (
  id text primary key,
  name text not null,
  slug text not null unique,
  kind text not null,
  city text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists campuses (
  id text primary key,
  institution_id text not null references institutions (id),
  name text not null,
  slug text not null,
  unique (institution_id, slug)
);

create table if not exists canteens (
  id text primary key,
  institution_id text not null references institutions (id),
  campus_id text not null references campuses (id),
  name text not null,
  slug text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'PAUSED')),
  description text not null default '',
  prep_capacity int not null default 4 check (prep_capacity > 0),
  is_demo boolean not null default false,
  catalog_version int not null default 1,
  created_at timestamptz not null default now(),
  unique (campus_id, slug)
);

create table if not exists counters (
  id text primary key,
  canteen_id text not null references canteens (id),
  name text not null,
  lane text not null check (lane in ('SNACKS', 'MAIN', 'BEVERAGES')),
  active boolean not null default true,
  sort int not null default 0
);

create table if not exists categories (
  id text primary key,
  canteen_id text not null references canteens (id),
  name text not null,
  slug text not null,
  lane text not null check (lane in ('SNACKS', 'MAIN', 'BEVERAGES')),
  sort int not null default 0,
  image_url text,
  unique (canteen_id, slug)
);

create table if not exists items (
  id text primary key,
  canteen_id text not null references canteens (id),
  category_id text not null references categories (id),
  name text not null,
  description text not null default '',
  image_url text,
  base_price_paise int check (base_price_paise is null or base_price_paise >= 0),
  mrp_paise int,
  discount_paise int not null default 0 check (discount_paise >= 0),
  is_veg boolean not null default true,
  diet text not null default 'veg' check (diet in ('veg', 'egg', 'nonveg')),
  prep_minutes int not null default 8 check (prep_minutes > 0 and prep_minutes <= 180),
  availability text not null default 'AVAILABLE' check (availability in ('AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT', 'HIDDEN')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_canteen_idx on items (canteen_id, availability);
create index if not exists items_category_idx on items (category_id);

create table if not exists variants (
  id text primary key,
  item_id text not null references items (id) on delete cascade,
  name text not null,
  price_delta_paise int not null default 0,
  available boolean not null default true,
  sort int not null default 0
);

create table if not exists addons (
  id text primary key,
  canteen_id text not null references canteens (id),
  name text not null,
  price_paise int not null check (price_paise >= 0),
  available boolean not null default true
);

create table if not exists item_addons (
  item_id text not null references items (id) on delete cascade,
  addon_id text not null references addons (id) on delete cascade,
  primary key (item_id, addon_id)
);

create table if not exists combos (
  id text primary key,
  canteen_id text not null references canteens (id),
  name text not null,
  description text not null default '',
  image_url text,
  price_paise int not null check (price_paise >= 0),
  prep_minutes int not null default 12,
  availability text not null default 'AVAILABLE' check (availability in ('AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT', 'HIDDEN')),
  is_demo boolean not null default false
);

create table if not exists combo_items (
  combo_id text not null references combos (id) on delete cascade,
  item_id text not null references items (id),
  qty int not null default 1 check (qty > 0),
  primary key (combo_id, item_id)
);

create table if not exists coupons (
  id text primary key,
  institution_id text not null references institutions (id),
  code text not null,
  kind text not null check (kind in ('PERCENT', 'FLAT')),
  value int not null check (value >= 0),
  min_paise int not null default 0,
  active boolean not null default true,
  unique (institution_id, code)
);

create table if not exists memberships (
  id text primary key,
  user_id text not null references "user" (id) on delete cascade,
  role text not null check (role in ('CUSTOMER', 'STAFF', 'CANTEEN_ADMIN', 'INSTITUTION_ADMIN', 'SUPER_ADMIN')),
  institution_id text references institutions (id),
  canteen_id text references canteens (id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists memberships_user_idx on memberships (user_id);

create table if not exists carts (
  user_id text not null references "user" (id) on delete cascade,
  canteen_id text not null references canteens (id),
  lines jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, canteen_id)
);

create table if not exists token_seq (
  canteen_id text primary key references canteens (id),
  next_n int not null
);

create table if not exists orders (
  id text primary key,
  token text not null,
  institution_id text not null references institutions (id),
  campus_id text not null references campuses (id),
  canteen_id text not null references canteens (id),
  institution_name text not null,
  campus_name text not null,
  canteen_name text not null,
  customer_user_id text not null references "user" (id),
  counter_id text references counters (id),
  counter_name text,
  status text not null,
  payment_status text not null,
  subtotal_paise int not null,
  charges_paise int not null,
  discount_paise int not null,
  total_paise int not null,
  coupon_code text,
  instructions text,
  eta_minutes int not null,
  orders_ahead int not null,
  prep_seconds int,
  idempotency_key text not null,
  request_hash text not null,
  pickup_code text not null,
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  picked_up_at timestamptz,
  cancel_reason text,
  unique (customer_user_id, idempotency_key)
);

create index if not exists orders_canteen_status_idx on orders (canteen_id, status, placed_at);
create index if not exists orders_customer_idx on orders (customer_user_id, placed_at desc);
create index if not exists orders_token_idx on orders (token);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders (id) on delete cascade,
  item_id text,
  combo_id text,
  name text not null,
  variant_name text,
  qty int not null,
  unit_paise int not null,
  addons_json jsonb not null default '[]'::jsonb,
  line_paise int not null,
  prep_minutes int not null,
  instructions text
);

create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists payments (
  id text primary key,
  order_id text not null references orders (id),
  provider text not null,
  status text not null check (status in ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED')),
  amount_paise int not null,
  idempotency_key text not null unique,
  gateway_order_id text,
  gateway_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_idx on payments (order_id);

create table if not exists payment_events (
  id text primary key,
  payment_id text references payments (id),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null references "user" (id) on delete cascade,
  order_id text,
  kind text not null,
  title text not null,
  body text not null,
  dedupe_key text not null unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

create table if not exists reviews (
  id text primary key,
  order_id text not null unique references orders (id),
  user_id text not null references "user" (id),
  canteen_id text not null references canteens (id),
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists status_history (
  id text primary key,
  order_id text not null references orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists status_history_order_idx on status_history (order_id, created_at);

create table if not exists audit_logs (
  id text primary key,
  actor_user_id text,
  institution_id text,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_inst_idx on audit_logs (institution_id, created_at desc);

create table if not exists subscriptions (
  id text primary key,
  institution_id text not null unique references institutions (id),
  plan text not null,
  status text not null,
  seats int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists partner_leads (
  id text primary key,
  user_id text not null references "user" (id),
  org_name text not null,
  campus_name text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
