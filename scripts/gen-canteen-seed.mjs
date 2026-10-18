import { writeFileSync } from "node:fs";

const HASH =
  "a76ab56445df1eb1d1c63457e21640df:2b139fc4cc089640a2a89ed8f2cb51a26baaa0ba55839cd8cb400b161136464700c1984f1b02f3414c459415379fa3ef736e5cf119a0c5093b6153cf99924f0d";

const q = (v) => `'${String(v).replaceAll("'", "''")}'`;

const users = [
  ["user_demo_customer", "Asha Menon", "customer@canteenx.dev", "acc_demo_customer"],
  ["user_demo_staff", "Rohan Iyer", "staff@canteenx.dev", "acc_demo_staff"],
  ["user_demo_canteen", "Neha Kapoor", "canteen@canteenx.dev", "acc_demo_canteen"],
  ["user_demo_institution", "Vikram Shah", "institution@canteenx.dev", "acc_demo_institution"],
  ["user_demo_super", "Platform Admin", "super@canteenx.dev", "acc_demo_super"],
  ["user_demo_night", "Meera Das", "night@canteenx.dev", "acc_demo_night"],
];

const cats = [
  ["cat_sandwich", "Sandwich Mania", "sandwich", "MAIN", 1, "/menu/sandwich.jpg"],
  ["cat_north", "North Indian & Tandoori", "north", "MAIN", 2, "/menu/parantha.jpg"],
  ["cat_thali", "Mini Thali", "thali", "MAIN", 3, "/menu/kulcha.jpg"],
  ["cat_chinese", "Chinese", "chinese", "MAIN", 4, "/menu/noodles.jpg"],
  ["cat_csnack", "Chinese snacks", "chinese-snacks", "SNACKS", 5, "/menu/fries.jpg"],
  ["cat_momos", "Momos", "momos", "SNACKS", 6, "/menu/momos.jpg"],
  ["cat_snacks", "Snacks", "snacks", "SNACKS", 7, "/menu/samosa.jpg"],
  ["cat_hot", "Hot drinks & soups", "hot", "BEVERAGES", 8, "/menu/chai.jpg"],
  ["cat_coffee", "Coffee", "coffee", "BEVERAGES", 9, "/menu/coffee.jpg"],
  ["cat_cold", "Cold drinks", "cold", "BEVERAGES", 10, "/menu/chai.jpg"],
  ["cat_dessert", "Dessert", "dessert", "BEVERAGES", 11, "/menu/coffee.jpg"],
];

const image = Object.fromEntries(cats.map((c) => [c[0], c[5]]));

/** [id, category, name, rupees|null, discountRupees, diet, prep, blurb] */
const dishes = [
  ["itm_veg_sandwich", "cat_sandwich", "Veg Sandwich", 30, 0, "veg", 8, "Cucumber, tomato and mint chutney on toasted bread."],
  ["itm_grilled_veg", "cat_sandwich", "Grilled Veg Sandwich", 40, 0, "veg", 9, "Grilled peppers, onion and cabbage with cheese."],
  ["itm_grilled_cheese", "cat_sandwich", "Grilled Cheese Sandwich", 49, 0, "veg", 8, "Thick cheese melt on buttered bread."],
  ["itm_pizza_cheese", "cat_sandwich", "Grilled Pizza Cheese Sandwich", 69, 0, "veg", 10, "Pizza spices, peppers and a double cheese layer."],
  ["itm_egg_sandwich", "cat_sandwich", "Grilled Egg Sandwich", 59, 0, "egg", 10, "Masala omelette and cheese in grilled bread."],
  ["itm_aloo", "cat_north", "Aloo Prantha", 59, 0, "veg", 12, "Spiced potato stuffed parantha, served with curd."],
  ["itm_pyaz", "cat_north", "Pyaz Prantha", 59, 0, "veg", 12, "Onion stuffing, cooked on the tawa with butter."],
  ["itm_gobhi", "cat_north", "Gobhi Prantha", 59, 0, "veg", 12, "Cauliflower masala stuffing, served hot."],
  ["itm_paneer_p", "cat_north", "Paneer Prantha", 69, 0, "veg", 13, "Crumbled paneer and chilli stuffed parantha."],
  ["itm_mix_p", "cat_north", "Mix Prantha", 69, 0, "veg", 13, "Potato, onion and paneer mixed stuffing."],
  ["itm_rajma", "cat_north", "Rajma Chawal", 64, 0, "veg", 10, "Red kidney beans with steamed rice."],
  ["itm_choley", "cat_north", "Choley Chawal (Pindi)", 64, 0, "veg", 10, "Pindi choley with jeera rice."],
  ["itm_kadhi", "cat_north", "Kadhi Chawal", 64, 0, "veg", 10, "Punjabi kadhi with steamed rice."],
  ["itm_kulcha", "cat_thali", "Amritsari Kulcha Tandoori", 79, 0, "veg", 14, "Tandoor kulcha with choley."],
  ["itm_dal", "cat_thali", "Dal Makhani-Laccha Parantha Tandoori", 79, 0, "veg", 14, "Slow dal makhani with laccha parantha."],
  ["itm_hakka", "cat_chinese", "Hakka Noodles", 69, 0, "veg", 10, "Wok-tossed noodles with cabbage and spring onion."],
  ["itm_garlic_noodles", "cat_chinese", "Chilli Garlic Noodles", 69, 0, "veg", 10, "Garlic, chilli and a dark soy finish."],
  ["itm_fried_rice", "cat_chinese", "Veg Fried Rice", 59, 0, "veg", 10, "Basmati fried rice with mixed vegetables."],
  ["itm_manchurian", "cat_chinese", "Manchurian Gravy", 30, 0, "veg", 8, "Vegetable manchurian in a peppery gravy."],
  ["itm_chilli_paneer", "cat_chinese", "Chilli Paneer Gravy", 30, 0, "veg", 8, "Paneer cubes in chilli gravy."],
  ["itm_spring", "cat_csnack", "Veg Spring Rolls", 45, 0, "veg", 8, "Crisp rolls with a vegetable filling."],
  ["itm_kurkure_spring", "cat_csnack", "Veg Kurkure Spring Rolls", 59, 0, "veg", 9, "Crushed-kurkure crust on a veg roll."],
  ["itm_fries", "cat_csnack", "French Fries", 45, 0, "veg", 7, "Salted fries, fried to order."],
  ["itm_peri", "cat_csnack", "Peri Peri Fries", 49, 0, "veg", 7, "Fries tossed in peri peri spice."],
  ["itm_cheesy_fries", "cat_csnack", "Cheesy Fries", 64, 5, "veg", 8, "Fries under a cheese drizzle. Demo discount applied."],
  ["itm_chilli_potato", "cat_csnack", "Chilli Potato", 59, 0, "veg", 9, "Crisp potato fingers in chilli garlic sauce."],
  ["itm_honey_potato", "cat_csnack", "Honey Potato", 69, 0, "veg", 9, "Honey chilli potatoes."],
  ["itm_bread_pakoda", "cat_snacks", "Bread Pakoda", 20, 0, "veg", 6, "Potato-stuffed bread, gram-flour fried."],
  ["itm_paneer_pakoda", "cat_snacks", "Paneer Bread Pakoda", 30, 0, "veg", 7, "Paneer slice inside a bread pakoda."],
  ["itm_samosa", "cat_snacks", "Aloo/Matar Samosa", 20, 0, "veg", 6, "Classic pea and potato samosa."],
  ["itm_pizza_samosa", "cat_snacks", "Pizza Samosa", 30, 0, "veg", 7, "Samosa with a pizza-spice filling."],
  ["itm_samosa_chaat", "cat_snacks", "Samosa Chaat", 45, 0, "veg", 7, "Crushed samosa, dahi, chutney and sev."],
  ["itm_dahi_sholey", "cat_snacks", "Dahi Ke Sholey", 49, 0, "veg", 8, "Dahi-soaked dumplings with chutney."],
  ["itm_chai", "cat_hot", "Masala Adraki Chai", 20, 0, "veg", 4, "Ginger masala chai."],
  ["itm_kulhad", "cat_hot", "Kulhad Chai", 25, 0, "veg", 5, "Chai served in a clay kulhad."],
  ["itm_tomato_soup", "cat_hot", "Tomato Soup", 30, 0, "veg", 6, "Smooth tomato soup."],
  ["itm_hot_sour", "cat_hot", "Hot & Sour Soup", 30, 0, "veg", 6, "Peppery hot and sour soup."],
  ["itm_sweet_corn", "cat_hot", "Sweet Corn Soup", 30, 0, "veg", 6, "Sweet corn and pepper soup."],
  ["itm_manchow", "cat_hot", "Manchow Soup", 40, 0, "veg", 7, "Crisp noodles on a dark manchow broth."],
  ["itm_americano", "cat_coffee", "Americano", 25, 0, "veg", 4, "Espresso lengthened with hot water."],
  ["itm_latte", "cat_coffee", "Latte", 34, 0, "veg", 5, "Espresso with steamed milk."],
  ["itm_cappuccino", "cat_coffee", "Cappuccino", 40, 0, "veg", 5, "Espresso, milk and a thick foam cap."],
  ["itm_cold_coffee", "cat_cold", "Cold Coffee", 49, 0, "veg", 5, "Blended cold coffee with ice."],
  ["itm_lassi", "cat_cold", "Cold Punjabi Lassi Kulhad", 59, 0, "veg", 5, "Sweet lassi in a kulhad."],
  ["itm_ice", "cat_dessert", "Amul Ice Creams", null, 0, "veg", 2, "MRP item. An admin must set a selling price before it can be ordered."],
];

const momos = [
  ["itm_momo_steam_veg", "Steamed Veg", 35, 59],
  ["itm_momo_fried_veg", "Fried Veg", 45, 65],
  ["itm_momo_gravy_veg", "Gravy Veg", 55, 75],
  ["itm_momo_kurkure_veg", "Kurkure Veg", 65, 85],
  ["itm_momo_tandoori_veg", "Tandoori Veg", 70, 89],
  ["itm_momo_steam_paneer", "Steamed Paneer", 45, 69],
  ["itm_momo_fried_paneer", "Fried Paneer", 55, 75],
  ["itm_momo_gravy_paneer", "Gravy Paneer", 65, 85],
  ["itm_momo_kurkure_paneer", "Kurkure Paneer", 75, 95],
];

const lines = [];
const push = (s) => lines.push(s);

push("-- Demo data for CanteenX. Labelled demo tenants, not a single hardcoded university.");
push("insert into \"user\" (\"id\", \"name\", \"email\", \"emailVerified\", \"createdAt\", \"updatedAt\") values");
push(
  users
    .map(([id, name, email]) => `(${q(id)}, ${q(name)}, ${q(email)}, true, now(), now())`)
    .join(",\n") + " on conflict (\"id\") do nothing;",
);
push("insert into \"account\" (\"id\", \"accountId\", \"providerId\", \"userId\", \"password\", \"createdAt\", \"updatedAt\") values");
push(
  users
    .map(
      ([id, , , acc]) =>
        `(${q(acc)}, ${q(id)}, 'credential', ${q(id)}, ${q(HASH)}, now(), now())`,
    )
    .join(",\n") + " on conflict (\"id\") do nothing;",
);

push(`insert into institutions (id, name, slug, kind, city, is_demo) values
('inst_demo', 'Demo University', 'demo-university', 'university', 'Chandigarh', true),
('inst_harbour', 'Harbour House Hostel', 'harbour-house', 'hostel', 'Panchkula', true)
on conflict (id) do nothing;`);

push(`insert into campuses (id, institution_id, name, slug) values
('campus_main', 'inst_demo', 'Main Campus', 'main'),
('campus_harbour', 'inst_harbour', 'City House', 'city-house')
on conflict (id) do nothing;`);

push(`insert into canteens (id, institution_id, campus_id, name, slug, status, description, prep_capacity, is_demo) values
('canteen_central', 'inst_demo', 'campus_main', 'Central Canteen', 'central', 'OPEN', 'The main campus kitchen. Order ahead and pick up at the counter named on your token.', 4, true),
('canteen_night', 'inst_harbour', 'campus_harbour', 'Night Mess', 'night', 'OPEN', 'Late window for hostel residents. A second tenant, used to prove isolation.', 2, true)
on conflict (id) do nothing;`);

push(`insert into counters (id, canteen_id, name, lane, active, sort) values
('ctr_snacks', 'canteen_central', 'Snacks', 'SNACKS', true, 1),
('ctr_main', 'canteen_central', 'Main Food', 'MAIN', true, 2),
('ctr_bev', 'canteen_central', 'Beverages', 'BEVERAGES', true, 3),
('ctr_night', 'canteen_night', 'Night window', 'MAIN', true, 1)
on conflict (id) do nothing;`);

push("insert into categories (id, canteen_id, name, slug, lane, sort, image_url) values");
push(
  cats
    .map(
      ([id, name, slug, lane, sort, img]) =>
        `(${q(id)}, 'canteen_central', ${q(name)}, ${q(slug)}, ${q(lane)}, ${sort}, ${q(img)})`,
    )
    .join(",\n") + ",\n('cat_night', 'canteen_night', 'Night plates', 'night', 'MAIN', 1, '/menu/noodles.jpg') on conflict (id) do nothing;",
);

function itemRow(id, canteen, cat, name, rupees, discount, diet, prep, blurb) {
  const price = rupees == null ? "null" : String(rupees * 100);
  const veg = diet === "veg" ? "true" : "false";
  return `(${q(id)}, ${q(canteen)}, ${q(cat)}, ${q(name)}, ${q(blurb)}, ${q(image[cat] ?? "/menu/noodles.jpg")}, ${price}, null, ${discount * 100}, ${veg}, ${q(diet)}, ${prep}, 'AVAILABLE', true)`;
}

push(
  "insert into items (id, canteen_id, category_id, name, description, image_url, base_price_paise, mrp_paise, discount_paise, is_veg, diet, prep_minutes, availability, is_demo) values",
);
const itemSql = dishes.map((d) => itemRow(d[0], "canteen_central", d[1], d[2], d[3], d[4], d[5], d[6], d[7]));
for (const [id, name, p4, p8] of momos) {
  itemSql.push(
    itemRow(id, "canteen_central", "cat_momos", `${name} momos`, p4, 0, "veg", 8, `${name} momos. Choose 4 or 8 pieces.`),
  );
  void p8;
}
itemSql.push(
  itemRow("itm_night_maggi", "canteen_night", "cat_night", "Masala Maggi", 40, 0, "veg", 6, "Hostel Maggi with mixed vegetables."),
);
itemSql.push(
  itemRow("itm_night_tea", "canteen_night", "cat_night", "Night Tea", 15, 0, "veg", 3, "Cutting chai for the late sitting."),
);
push(itemSql.join(",\n") + " on conflict (id) do nothing;");

const variantRows = [];
for (const [id, name, p4, p8] of momos) {
  variantRows.push(`('${id}_4', '${id}', '4 pc', 0, true, 1)`);
  variantRows.push(`('${id}_8', '${id}', '8 pc', ${(p8 - p4) * 100}, true, 2)`);
  void name;
}
push(
  "insert into variants (id, item_id, name, price_delta_paise, available, sort) values\n" +
    variantRows.join(",\n") +
    " on conflict (id) do nothing;",
);

push(`insert into addons (id, canteen_id, name, price_paise, available) values
('add_cheese', 'canteen_central', 'Extra cheese', 1500, true),
('add_butter', 'canteen_central', 'Butter', 1000, true),
('add_gravy', 'canteen_central', 'Extra gravy', 2000, true),
('add_sev', 'canteen_central', 'Extra sev', 1000, true)
on conflict (id) do nothing;`);

const cheese = ["itm_veg_sandwich", "itm_grilled_veg", "itm_grilled_cheese", "itm_pizza_cheese", "itm_egg_sandwich", "itm_fries", "itm_peri", "itm_cheesy_fries"];
const butter = ["itm_aloo", "itm_pyaz", "itm_gobhi", "itm_paneer_p", "itm_mix_p"];
const gravy = ["itm_hakka", "itm_garlic_noodles", "itm_fried_rice", "itm_manchurian", "itm_chilli_paneer", ...momos.map((m) => m[0])];
const sev = ["itm_samosa_chaat", "itm_dahi_sholey"];
const links = [
  ...cheese.map((id) => `('${id}', 'add_cheese')`),
  ...butter.map((id) => `('${id}', 'add_butter')`),
  ...gravy.map((id) => `('${id}', 'add_gravy')`),
  ...sev.map((id) => `('${id}', 'add_sev')`),
];
push("insert into item_addons (item_id, addon_id) values\n" + links.join(",\n") + " on conflict do nothing;");

push(`insert into combos (id, canteen_id, name, description, image_url, price_paise, prep_minutes, availability, is_demo) values
('combo_kulcha', 'canteen_central', 'Kulcha & Lassi', 'Amritsari kulcha with a kulhad lassi. Demo combo.', '/menu/kulcha.jpg', 12900, 14, 'AVAILABLE', true),
('combo_noodle', 'canteen_central', 'Noodle & Manchurian', 'Hakka noodles with manchurian gravy. Demo combo.', '/menu/noodles.jpg', 8900, 12, 'AVAILABLE', true)
on conflict (id) do nothing;`);

push(`insert into combo_items (combo_id, item_id, qty) values
('combo_kulcha', 'itm_kulcha', 1),
('combo_kulcha', 'itm_lassi', 1),
('combo_noodle', 'itm_hakka', 1),
('combo_noodle', 'itm_manchurian', 1)
on conflict do nothing;`);

push(`insert into coupons (id, institution_id, code, kind, value, min_paise, active) values
('cpn_welcome', 'inst_demo', 'WELCOME10', 'PERCENT', 10, 10000, true)
on conflict (id) do nothing;`);

push(`insert into memberships (id, user_id, role, institution_id, canteen_id, active) values
('mem_customer', 'user_demo_customer', 'CUSTOMER', 'inst_demo', null, true),
('mem_staff', 'user_demo_staff', 'STAFF', 'inst_demo', 'canteen_central', true),
('mem_canteen', 'user_demo_canteen', 'CANTEEN_ADMIN', 'inst_demo', 'canteen_central', true),
('mem_inst', 'user_demo_institution', 'INSTITUTION_ADMIN', 'inst_demo', null, true),
('mem_super', 'user_demo_super', 'SUPER_ADMIN', null, null, true),
('mem_night', 'user_demo_night', 'STAFF', 'inst_harbour', 'canteen_night', true)
on conflict (id) do nothing;`);

push(`insert into token_seq (canteen_id, next_n) values
('canteen_central', 1023),
('canteen_night', 200)
on conflict (canteen_id) do nothing;`);

push(`insert into subscriptions (id, institution_id, plan, status, seats) values
('sub_demo', 'inst_demo', 'Campus', 'ACTIVE', 4),
('sub_harbour', 'inst_harbour', 'Hostel', 'ACTIVE', 1)
on conflict (id) do nothing;`);

push(`insert into audit_logs (id, actor_user_id, institution_id, action, entity, entity_id, detail) values
('aud_seed', 'user_demo_super', 'inst_demo', 'SEED', 'institution', 'inst_demo', '{"demo":true}'::jsonb)
on conflict (id) do nothing;`);

const hist = [
  ["ord_hist_1", "C1010", "itm_veg_sandwich", "Veg Sandwich", 2, 3000, 8, "2 days", 4],
  ["ord_hist_2", "C1011", "itm_aloo", "Aloo Prantha", 1, 5900, 12, "2 days 3 hours", 5],
  ["ord_hist_3", "C1012", "itm_hakka", "Hakka Noodles", 1, 6900, 10, "1 day 5 hours", 4],
  ["ord_hist_4", "C1013", "itm_momo_steam_veg", "Steamed Veg momos", 1, 5900, 8, "1 day 2 hours", 5],
  ["ord_hist_5", "C1014", "itm_samosa_chaat", "Samosa Chaat", 2, 4500, 7, "20 hours", 4],
  ["ord_hist_6", "C1015", "itm_kulcha", "Amritsari Kulcha Tandoori", 1, 7900, 14, "8 hours", 5],
  ["ord_hist_7", "C1016", "itm_chai", "Masala Adraki Chai", 3, 2000, 4, "6 hours", 4],
  ["ord_hist_8", "C1017", "itm_peri", "Peri Peri Fries", 2, 4900, 7, "4 hours", 3],
  ["ord_hist_9", "C1018", "itm_rajma", "Rajma Chawal", 1, 6400, 10, "26 hours", 5],
  ["ord_hist_10", "C1019", "itm_cold_coffee", "Cold Coffee", 2, 4900, 5, "3 hours", 4],
];

for (const [id, token, itemId, name, qty, unit, prep, ago, rating] of hist) {
  const sub = unit * qty;
  const total = sub + 500;
  push(`insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values (${q(id)}, ${q(token)}, 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', ${sub}, 500, 0, ${total}, ${prep}, 0, ${prep * 60}, ${q("idem_" + id)}, 'seed', ${q("CX|" + id + "|" + token)}, now() - interval ${q(ago)}, now() - interval ${q(ago)}, now() - interval ${q(ago)} + interval '12 minutes')
on conflict (id) do nothing;`);
  push(`insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
(${q("oi_" + id)}, ${q(id)}, ${q(itemId)}, ${q(name)}, ${qty}, ${unit}, ${sub}, ${prep})
on conflict (id) do nothing;`);
  push(`insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
(${q("pay_" + id)}, ${q(id)}, 'DEMO', 'PAID', ${total}, ${q("paykey_" + id)})
on conflict (id) do nothing;`);
  push(`insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
(${q("rev_" + id)}, ${q(id)}, 'user_demo_customer', 'canteen_central', ${rating}, 'Demo review')
on conflict (id) do nothing;`);
  push(`insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
(${q("sh_" + id)}, ${q(id)}, 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;`);
}

push(`insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, idempotency_key, request_hash, pickup_code, placed_at, updated_at)
values
('ord_live_1', 'C1020', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PREPARING', 'PAID', 5900, 500, 0, 6400, 12, 1, 'idem_live_1', 'seed', 'CX|ord_live_1|C1020', now() - interval '8 minutes', now() - interval '2 minutes'),
('ord_live_2', 'C1021', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_snacks', 'Snacks', 'READY_FOR_PICKUP', 'PAID', 5900, 500, 0, 6400, 4, 0, 'idem_live_2', 'seed', 'CX|ord_live_2|C1021', now() - interval '16 minutes', now() - interval '1 minute')
on conflict (id) do nothing;`);

push(`insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_live_1', 'ord_live_1', 'itm_aloo', 'Aloo Prantha', 1, 5900, 5900, 12),
('oi_live_2', 'ord_live_2', 'itm_momo_steam_veg', 'Steamed Veg momos', 1, 5900, 5900, 8)
on conflict (id) do nothing;`);

push(`insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_live_1', 'ord_live_1', 'DEMO', 'PAID', 6400, 'paykey_live_1'),
('pay_live_2', 'ord_live_2', 'DEMO', 'PAID', 6400, 'paykey_live_2')
on conflict (id) do nothing;`);

push(`insert into status_history (id, order_id, from_status, to_status, actor_user_id, note, created_at) values
('sh_l1a', 'ord_live_1', null, 'PLACED', 'user_demo_customer', null, now() - interval '8 minutes'),
('sh_l1b', 'ord_live_1', 'PLACED', 'PAYMENT_CONFIRMED', 'user_demo_customer', 'Demo payment', now() - interval '7 minutes'),
('sh_l1c', 'ord_live_1', 'PAYMENT_CONFIRMED', 'ACCEPTED', 'user_demo_staff', null, now() - interval '6 minutes'),
('sh_l1d', 'ord_live_1', 'ACCEPTED', 'PREPARING', 'user_demo_staff', null, now() - interval '4 minutes'),
('sh_l2a', 'ord_live_2', null, 'PLACED', 'user_demo_customer', null, now() - interval '16 minutes'),
('sh_l2b', 'ord_live_2', 'PREPARING', 'READY_FOR_PICKUP', 'user_demo_staff', null, now() - interval '2 minutes')
on conflict (id) do nothing;`);

push(`insert into notifications (id, user_id, order_id, kind, title, body, dedupe_key) values
('nt_live_1', 'user_demo_customer', 'ord_live_1', 'STATUS', 'Order C1020 is being prepared', 'Aloo Prantha is on the tawa. This is a demo notification.', 'ord_live_1:PREPARING')
on conflict (id) do nothing;`);

writeFileSync(new URL("../migrations/0003_seed.sql", import.meta.url), lines.join("\n") + "\n");
console.log("wrote migrations/0003_seed.sql", lines.length);
