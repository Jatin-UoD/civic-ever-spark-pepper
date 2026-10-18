-- Demo data for CanteenX. Labelled demo tenants, not a single hardcoded university.
insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt") values
('user_demo_customer', 'Asha Menon', 'customer@canteenx.dev', true, now(), now()),
('user_demo_staff', 'Rohan Iyer', 'staff@canteenx.dev', true, now(), now()),
('user_demo_canteen', 'Neha Kapoor', 'canteen@canteenx.dev', true, now(), now()),
('user_demo_institution', 'Vikram Shah', 'institution@canteenx.dev', true, now(), now()),
('user_demo_super', 'Platform Admin', 'super@canteenx.dev', true, now(), now()),
('user_demo_night', 'Meera Das', 'night@canteenx.dev', true, now(), now()) on conflict ("id") do nothing;
insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt") values
('acc_demo_customer', 'user_demo_customer', 'credential', 'user_demo_customer', 'a76ab56445df1eb1d1c63457e21640df:2b139fc4cc089640a2a89ed8f2cb51a26baaa0ba55839cd8cb400b161136464700c1984f1b02f3414c459415379fa3ef736e5cf119a0c5093b6153cf99924f0d', now(), now()),
('acc_demo_staff', 'user_demo_staff', 'credential', 'user_demo_staff', 'a76ab56445df1eb1d1c63457e21640df:2b139fc4cc089640a2a89ed8f2cb51a26baaa0ba55839cd8cb400b161136464700c1984f1b02f3414c459415379fa3ef736e5cf119a0c5093b6153cf99924f0d', now(), now()),
('acc_demo_canteen', 'user_demo_canteen', 'credential', 'user_demo_canteen', 'a76ab56445df1eb1d1c63457e21640df:2b139fc4cc089640a2a89ed8f2cb51a26baaa0ba55839cd8cb400b161136464700c1984f1b02f3414c459415379fa3ef736e5cf119a0c5093b6153cf99924f0d', now(), now()),
('acc_demo_institution', 'user_demo_institution', 'credential', 'user_demo_institution', 'a76ab56445df1eb1d1c63457e21640df:2b139fc4cc089640a2a89ed8f2cb51a26baaa0ba55839cd8cb400b161136464700c1984f1b02f3414c459415379fa3ef736e5cf119a0c5093b6153cf99924f0d', now(), now()),
('acc_demo_super', 'user_demo_super', 'credential', 'user_demo_super', 'a76ab56445df1eb1d1c63457e21640df:2b139fc4cc089640a2a89ed8f2cb51a26baaa0ba55839cd8cb400b161136464700c1984f1b02f3414c459415379fa3ef736e5cf119a0c5093b6153cf99924f0d', now(), now()),
('acc_demo_night', 'user_demo_night', 'credential', 'user_demo_night', 'a76ab56445df1eb1d1c63457e21640df:2b139fc4cc089640a2a89ed8f2cb51a26baaa0ba55839cd8cb400b161136464700c1984f1b02f3414c459415379fa3ef736e5cf119a0c5093b6153cf99924f0d', now(), now()) on conflict ("id") do nothing;
insert into institutions (id, name, slug, kind, city, is_demo) values
('inst_demo', 'Demo University', 'demo-university', 'university', 'Chandigarh', true),
('inst_harbour', 'Harbour House Hostel', 'harbour-house', 'hostel', 'Panchkula', true)
on conflict (id) do nothing;
insert into campuses (id, institution_id, name, slug) values
('campus_main', 'inst_demo', 'Main Campus', 'main'),
('campus_harbour', 'inst_harbour', 'City House', 'city-house')
on conflict (id) do nothing;
insert into canteens (id, institution_id, campus_id, name, slug, status, description, prep_capacity, is_demo) values
('canteen_central', 'inst_demo', 'campus_main', 'Central Canteen', 'central', 'OPEN', 'The main campus kitchen. Order ahead and pick up at the counter named on your token.', 4, true),
('canteen_night', 'inst_harbour', 'campus_harbour', 'Night Mess', 'night', 'OPEN', 'Late window for hostel residents. A second tenant, used to prove isolation.', 2, true)
on conflict (id) do nothing;
insert into counters (id, canteen_id, name, lane, active, sort) values
('ctr_snacks', 'canteen_central', 'Snacks', 'SNACKS', true, 1),
('ctr_main', 'canteen_central', 'Main Food', 'MAIN', true, 2),
('ctr_bev', 'canteen_central', 'Beverages', 'BEVERAGES', true, 3),
('ctr_night', 'canteen_night', 'Night window', 'MAIN', true, 1)
on conflict (id) do nothing;
insert into categories (id, canteen_id, name, slug, lane, sort, image_url) values
('cat_sandwich', 'canteen_central', 'Sandwich Mania', 'sandwich', 'MAIN', 1, '/menu/sandwich.jpg'),
('cat_north', 'canteen_central', 'North Indian & Tandoori', 'north', 'MAIN', 2, '/menu/parantha.jpg'),
('cat_thali', 'canteen_central', 'Mini Thali', 'thali', 'MAIN', 3, '/menu/kulcha.jpg'),
('cat_chinese', 'canteen_central', 'Chinese', 'chinese', 'MAIN', 4, '/menu/noodles.jpg'),
('cat_csnack', 'canteen_central', 'Chinese snacks', 'chinese-snacks', 'SNACKS', 5, '/menu/fries.jpg'),
('cat_momos', 'canteen_central', 'Momos', 'momos', 'SNACKS', 6, '/menu/momos.jpg'),
('cat_snacks', 'canteen_central', 'Snacks', 'snacks', 'SNACKS', 7, '/menu/samosa.jpg'),
('cat_hot', 'canteen_central', 'Hot drinks & soups', 'hot', 'BEVERAGES', 8, '/menu/chai.jpg'),
('cat_coffee', 'canteen_central', 'Coffee', 'coffee', 'BEVERAGES', 9, '/menu/coffee.jpg'),
('cat_cold', 'canteen_central', 'Cold drinks', 'cold', 'BEVERAGES', 10, '/menu/chai.jpg'),
('cat_dessert', 'canteen_central', 'Dessert', 'dessert', 'BEVERAGES', 11, '/menu/coffee.jpg'),
('cat_night', 'canteen_night', 'Night plates', 'night', 'MAIN', 1, '/menu/noodles.jpg') on conflict (id) do nothing;
insert into items (id, canteen_id, category_id, name, description, image_url, base_price_paise, mrp_paise, discount_paise, is_veg, diet, prep_minutes, availability, is_demo) values
('itm_veg_sandwich', 'canteen_central', 'cat_sandwich', 'Veg Sandwich', 'Cucumber, tomato and mint chutney on toasted bread.', '/menu/sandwich.jpg', 3000, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_grilled_veg', 'canteen_central', 'cat_sandwich', 'Grilled Veg Sandwich', 'Grilled peppers, onion and cabbage with cheese.', '/menu/sandwich.jpg', 4000, null, 0, true, 'veg', 9, 'AVAILABLE', true),
('itm_grilled_cheese', 'canteen_central', 'cat_sandwich', 'Grilled Cheese Sandwich', 'Thick cheese melt on buttered bread.', '/menu/sandwich.jpg', 4900, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_pizza_cheese', 'canteen_central', 'cat_sandwich', 'Grilled Pizza Cheese Sandwich', 'Pizza spices, peppers and a double cheese layer.', '/menu/sandwich.jpg', 6900, null, 0, true, 'veg', 10, 'AVAILABLE', true),
('itm_egg_sandwich', 'canteen_central', 'cat_sandwich', 'Grilled Egg Sandwich', 'Masala omelette and cheese in grilled bread.', '/menu/sandwich.jpg', 5900, null, 0, false, 'egg', 10, 'AVAILABLE', true),
('itm_aloo', 'canteen_central', 'cat_north', 'Aloo Prantha', 'Spiced potato stuffed parantha, served with curd.', '/menu/parantha.jpg', 5900, null, 0, true, 'veg', 12, 'AVAILABLE', true),
('itm_pyaz', 'canteen_central', 'cat_north', 'Pyaz Prantha', 'Onion stuffing, cooked on the tawa with butter.', '/menu/parantha.jpg', 5900, null, 0, true, 'veg', 12, 'AVAILABLE', true),
('itm_gobhi', 'canteen_central', 'cat_north', 'Gobhi Prantha', 'Cauliflower masala stuffing, served hot.', '/menu/parantha.jpg', 5900, null, 0, true, 'veg', 12, 'AVAILABLE', true),
('itm_paneer_p', 'canteen_central', 'cat_north', 'Paneer Prantha', 'Crumbled paneer and chilli stuffed parantha.', '/menu/parantha.jpg', 6900, null, 0, true, 'veg', 13, 'AVAILABLE', true),
('itm_mix_p', 'canteen_central', 'cat_north', 'Mix Prantha', 'Potato, onion and paneer mixed stuffing.', '/menu/parantha.jpg', 6900, null, 0, true, 'veg', 13, 'AVAILABLE', true),
('itm_rajma', 'canteen_central', 'cat_north', 'Rajma Chawal', 'Red kidney beans with steamed rice.', '/menu/parantha.jpg', 6400, null, 0, true, 'veg', 10, 'AVAILABLE', true),
('itm_choley', 'canteen_central', 'cat_north', 'Choley Chawal (Pindi)', 'Pindi choley with jeera rice.', '/menu/parantha.jpg', 6400, null, 0, true, 'veg', 10, 'AVAILABLE', true),
('itm_kadhi', 'canteen_central', 'cat_north', 'Kadhi Chawal', 'Punjabi kadhi with steamed rice.', '/menu/parantha.jpg', 6400, null, 0, true, 'veg', 10, 'AVAILABLE', true),
('itm_kulcha', 'canteen_central', 'cat_thali', 'Amritsari Kulcha Tandoori', 'Tandoor kulcha with choley.', '/menu/kulcha.jpg', 7900, null, 0, true, 'veg', 14, 'AVAILABLE', true),
('itm_dal', 'canteen_central', 'cat_thali', 'Dal Makhani-Laccha Parantha Tandoori', 'Slow dal makhani with laccha parantha.', '/menu/kulcha.jpg', 7900, null, 0, true, 'veg', 14, 'AVAILABLE', true),
('itm_hakka', 'canteen_central', 'cat_chinese', 'Hakka Noodles', 'Wok-tossed noodles with cabbage and spring onion.', '/menu/noodles.jpg', 6900, null, 0, true, 'veg', 10, 'AVAILABLE', true),
('itm_garlic_noodles', 'canteen_central', 'cat_chinese', 'Chilli Garlic Noodles', 'Garlic, chilli and a dark soy finish.', '/menu/noodles.jpg', 6900, null, 0, true, 'veg', 10, 'AVAILABLE', true),
('itm_fried_rice', 'canteen_central', 'cat_chinese', 'Veg Fried Rice', 'Basmati fried rice with mixed vegetables.', '/menu/noodles.jpg', 5900, null, 0, true, 'veg', 10, 'AVAILABLE', true),
('itm_manchurian', 'canteen_central', 'cat_chinese', 'Manchurian Gravy', 'Vegetable manchurian in a peppery gravy.', '/menu/noodles.jpg', 3000, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_chilli_paneer', 'canteen_central', 'cat_chinese', 'Chilli Paneer Gravy', 'Paneer cubes in chilli gravy.', '/menu/noodles.jpg', 3000, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_spring', 'canteen_central', 'cat_csnack', 'Veg Spring Rolls', 'Crisp rolls with a vegetable filling.', '/menu/fries.jpg', 4500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_kurkure_spring', 'canteen_central', 'cat_csnack', 'Veg Kurkure Spring Rolls', 'Crushed-kurkure crust on a veg roll.', '/menu/fries.jpg', 5900, null, 0, true, 'veg', 9, 'AVAILABLE', true),
('itm_fries', 'canteen_central', 'cat_csnack', 'French Fries', 'Salted fries, fried to order.', '/menu/fries.jpg', 4500, null, 0, true, 'veg', 7, 'AVAILABLE', true),
('itm_peri', 'canteen_central', 'cat_csnack', 'Peri Peri Fries', 'Fries tossed in peri peri spice.', '/menu/fries.jpg', 4900, null, 0, true, 'veg', 7, 'AVAILABLE', true),
('itm_cheesy_fries', 'canteen_central', 'cat_csnack', 'Cheesy Fries', 'Fries under a cheese drizzle. Demo discount applied.', '/menu/fries.jpg', 6400, null, 500, true, 'veg', 8, 'AVAILABLE', true),
('itm_chilli_potato', 'canteen_central', 'cat_csnack', 'Chilli Potato', 'Crisp potato fingers in chilli garlic sauce.', '/menu/fries.jpg', 5900, null, 0, true, 'veg', 9, 'AVAILABLE', true),
('itm_honey_potato', 'canteen_central', 'cat_csnack', 'Honey Potato', 'Honey chilli potatoes.', '/menu/fries.jpg', 6900, null, 0, true, 'veg', 9, 'AVAILABLE', true),
('itm_bread_pakoda', 'canteen_central', 'cat_snacks', 'Bread Pakoda', 'Potato-stuffed bread, gram-flour fried.', '/menu/samosa.jpg', 2000, null, 0, true, 'veg', 6, 'AVAILABLE', true),
('itm_paneer_pakoda', 'canteen_central', 'cat_snacks', 'Paneer Bread Pakoda', 'Paneer slice inside a bread pakoda.', '/menu/samosa.jpg', 3000, null, 0, true, 'veg', 7, 'AVAILABLE', true),
('itm_samosa', 'canteen_central', 'cat_snacks', 'Aloo/Matar Samosa', 'Classic pea and potato samosa.', '/menu/samosa.jpg', 2000, null, 0, true, 'veg', 6, 'AVAILABLE', true),
('itm_pizza_samosa', 'canteen_central', 'cat_snacks', 'Pizza Samosa', 'Samosa with a pizza-spice filling.', '/menu/samosa.jpg', 3000, null, 0, true, 'veg', 7, 'AVAILABLE', true),
('itm_samosa_chaat', 'canteen_central', 'cat_snacks', 'Samosa Chaat', 'Crushed samosa, dahi, chutney and sev.', '/menu/samosa.jpg', 4500, null, 0, true, 'veg', 7, 'AVAILABLE', true),
('itm_dahi_sholey', 'canteen_central', 'cat_snacks', 'Dahi Ke Sholey', 'Dahi-soaked dumplings with chutney.', '/menu/samosa.jpg', 4900, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_chai', 'canteen_central', 'cat_hot', 'Masala Adraki Chai', 'Ginger masala chai.', '/menu/chai.jpg', 2000, null, 0, true, 'veg', 4, 'AVAILABLE', true),
('itm_kulhad', 'canteen_central', 'cat_hot', 'Kulhad Chai', 'Chai served in a clay kulhad.', '/menu/chai.jpg', 2500, null, 0, true, 'veg', 5, 'AVAILABLE', true),
('itm_tomato_soup', 'canteen_central', 'cat_hot', 'Tomato Soup', 'Smooth tomato soup.', '/menu/chai.jpg', 3000, null, 0, true, 'veg', 6, 'AVAILABLE', true),
('itm_hot_sour', 'canteen_central', 'cat_hot', 'Hot & Sour Soup', 'Peppery hot and sour soup.', '/menu/chai.jpg', 3000, null, 0, true, 'veg', 6, 'AVAILABLE', true),
('itm_sweet_corn', 'canteen_central', 'cat_hot', 'Sweet Corn Soup', 'Sweet corn and pepper soup.', '/menu/chai.jpg', 3000, null, 0, true, 'veg', 6, 'AVAILABLE', true),
('itm_manchow', 'canteen_central', 'cat_hot', 'Manchow Soup', 'Crisp noodles on a dark manchow broth.', '/menu/chai.jpg', 4000, null, 0, true, 'veg', 7, 'AVAILABLE', true),
('itm_americano', 'canteen_central', 'cat_coffee', 'Americano', 'Espresso lengthened with hot water.', '/menu/coffee.jpg', 2500, null, 0, true, 'veg', 4, 'AVAILABLE', true),
('itm_latte', 'canteen_central', 'cat_coffee', 'Latte', 'Espresso with steamed milk.', '/menu/coffee.jpg', 3400, null, 0, true, 'veg', 5, 'AVAILABLE', true),
('itm_cappuccino', 'canteen_central', 'cat_coffee', 'Cappuccino', 'Espresso, milk and a thick foam cap.', '/menu/coffee.jpg', 4000, null, 0, true, 'veg', 5, 'AVAILABLE', true),
('itm_cold_coffee', 'canteen_central', 'cat_cold', 'Cold Coffee', 'Blended cold coffee with ice.', '/menu/chai.jpg', 4900, null, 0, true, 'veg', 5, 'AVAILABLE', true),
('itm_lassi', 'canteen_central', 'cat_cold', 'Cold Punjabi Lassi Kulhad', 'Sweet lassi in a kulhad.', '/menu/chai.jpg', 5900, null, 0, true, 'veg', 5, 'AVAILABLE', true),
('itm_ice', 'canteen_central', 'cat_dessert', 'Amul Ice Creams', 'MRP item. An admin must set a selling price before it can be ordered.', '/menu/coffee.jpg', null, null, 0, true, 'veg', 2, 'AVAILABLE', true),
('itm_momo_steam_veg', 'canteen_central', 'cat_momos', 'Steamed Veg momos', 'Steamed Veg momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 3500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_momo_fried_veg', 'canteen_central', 'cat_momos', 'Fried Veg momos', 'Fried Veg momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 4500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_momo_gravy_veg', 'canteen_central', 'cat_momos', 'Gravy Veg momos', 'Gravy Veg momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 5500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_momo_kurkure_veg', 'canteen_central', 'cat_momos', 'Kurkure Veg momos', 'Kurkure Veg momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 6500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_momo_tandoori_veg', 'canteen_central', 'cat_momos', 'Tandoori Veg momos', 'Tandoori Veg momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 7000, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_momo_steam_paneer', 'canteen_central', 'cat_momos', 'Steamed Paneer momos', 'Steamed Paneer momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 4500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_momo_fried_paneer', 'canteen_central', 'cat_momos', 'Fried Paneer momos', 'Fried Paneer momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 5500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_momo_gravy_paneer', 'canteen_central', 'cat_momos', 'Gravy Paneer momos', 'Gravy Paneer momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 6500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_momo_kurkure_paneer', 'canteen_central', 'cat_momos', 'Kurkure Paneer momos', 'Kurkure Paneer momos. Choose 4 or 8 pieces.', '/menu/momos.jpg', 7500, null, 0, true, 'veg', 8, 'AVAILABLE', true),
('itm_night_maggi', 'canteen_night', 'cat_night', 'Masala Maggi', 'Hostel Maggi with mixed vegetables.', '/menu/noodles.jpg', 4000, null, 0, true, 'veg', 6, 'AVAILABLE', true),
('itm_night_tea', 'canteen_night', 'cat_night', 'Night Tea', 'Cutting chai for the late sitting.', '/menu/noodles.jpg', 1500, null, 0, true, 'veg', 3, 'AVAILABLE', true) on conflict (id) do nothing;
insert into variants (id, item_id, name, price_delta_paise, available, sort) values
('itm_momo_steam_veg_4', 'itm_momo_steam_veg', '4 pc', 0, true, 1),
('itm_momo_steam_veg_8', 'itm_momo_steam_veg', '8 pc', 2400, true, 2),
('itm_momo_fried_veg_4', 'itm_momo_fried_veg', '4 pc', 0, true, 1),
('itm_momo_fried_veg_8', 'itm_momo_fried_veg', '8 pc', 2000, true, 2),
('itm_momo_gravy_veg_4', 'itm_momo_gravy_veg', '4 pc', 0, true, 1),
('itm_momo_gravy_veg_8', 'itm_momo_gravy_veg', '8 pc', 2000, true, 2),
('itm_momo_kurkure_veg_4', 'itm_momo_kurkure_veg', '4 pc', 0, true, 1),
('itm_momo_kurkure_veg_8', 'itm_momo_kurkure_veg', '8 pc', 2000, true, 2),
('itm_momo_tandoori_veg_4', 'itm_momo_tandoori_veg', '4 pc', 0, true, 1),
('itm_momo_tandoori_veg_8', 'itm_momo_tandoori_veg', '8 pc', 1900, true, 2),
('itm_momo_steam_paneer_4', 'itm_momo_steam_paneer', '4 pc', 0, true, 1),
('itm_momo_steam_paneer_8', 'itm_momo_steam_paneer', '8 pc', 2400, true, 2),
('itm_momo_fried_paneer_4', 'itm_momo_fried_paneer', '4 pc', 0, true, 1),
('itm_momo_fried_paneer_8', 'itm_momo_fried_paneer', '8 pc', 2000, true, 2),
('itm_momo_gravy_paneer_4', 'itm_momo_gravy_paneer', '4 pc', 0, true, 1),
('itm_momo_gravy_paneer_8', 'itm_momo_gravy_paneer', '8 pc', 2000, true, 2),
('itm_momo_kurkure_paneer_4', 'itm_momo_kurkure_paneer', '4 pc', 0, true, 1),
('itm_momo_kurkure_paneer_8', 'itm_momo_kurkure_paneer', '8 pc', 2000, true, 2) on conflict (id) do nothing;
insert into addons (id, canteen_id, name, price_paise, available) values
('add_cheese', 'canteen_central', 'Extra cheese', 1500, true),
('add_butter', 'canteen_central', 'Butter', 1000, true),
('add_gravy', 'canteen_central', 'Extra gravy', 2000, true),
('add_sev', 'canteen_central', 'Extra sev', 1000, true)
on conflict (id) do nothing;
insert into item_addons (item_id, addon_id) values
('itm_veg_sandwich', 'add_cheese'),
('itm_grilled_veg', 'add_cheese'),
('itm_grilled_cheese', 'add_cheese'),
('itm_pizza_cheese', 'add_cheese'),
('itm_egg_sandwich', 'add_cheese'),
('itm_fries', 'add_cheese'),
('itm_peri', 'add_cheese'),
('itm_cheesy_fries', 'add_cheese'),
('itm_aloo', 'add_butter'),
('itm_pyaz', 'add_butter'),
('itm_gobhi', 'add_butter'),
('itm_paneer_p', 'add_butter'),
('itm_mix_p', 'add_butter'),
('itm_hakka', 'add_gravy'),
('itm_garlic_noodles', 'add_gravy'),
('itm_fried_rice', 'add_gravy'),
('itm_manchurian', 'add_gravy'),
('itm_chilli_paneer', 'add_gravy'),
('itm_momo_steam_veg', 'add_gravy'),
('itm_momo_fried_veg', 'add_gravy'),
('itm_momo_gravy_veg', 'add_gravy'),
('itm_momo_kurkure_veg', 'add_gravy'),
('itm_momo_tandoori_veg', 'add_gravy'),
('itm_momo_steam_paneer', 'add_gravy'),
('itm_momo_fried_paneer', 'add_gravy'),
('itm_momo_gravy_paneer', 'add_gravy'),
('itm_momo_kurkure_paneer', 'add_gravy'),
('itm_samosa_chaat', 'add_sev'),
('itm_dahi_sholey', 'add_sev') on conflict do nothing;
insert into combos (id, canteen_id, name, description, image_url, price_paise, prep_minutes, availability, is_demo) values
('combo_kulcha', 'canteen_central', 'Kulcha & Lassi', 'Amritsari kulcha with a kulhad lassi. Demo combo.', '/menu/kulcha.jpg', 12900, 14, 'AVAILABLE', true),
('combo_noodle', 'canteen_central', 'Noodle & Manchurian', 'Hakka noodles with manchurian gravy. Demo combo.', '/menu/noodles.jpg', 8900, 12, 'AVAILABLE', true)
on conflict (id) do nothing;
insert into combo_items (combo_id, item_id, qty) values
('combo_kulcha', 'itm_kulcha', 1),
('combo_kulcha', 'itm_lassi', 1),
('combo_noodle', 'itm_hakka', 1),
('combo_noodle', 'itm_manchurian', 1)
on conflict do nothing;
insert into coupons (id, institution_id, code, kind, value, min_paise, active) values
('cpn_welcome', 'inst_demo', 'WELCOME10', 'PERCENT', 10, 10000, true)
on conflict (id) do nothing;
insert into memberships (id, user_id, role, institution_id, canteen_id, active) values
('mem_customer', 'user_demo_customer', 'CUSTOMER', 'inst_demo', null, true),
('mem_staff', 'user_demo_staff', 'STAFF', 'inst_demo', 'canteen_central', true),
('mem_canteen', 'user_demo_canteen', 'CANTEEN_ADMIN', 'inst_demo', 'canteen_central', true),
('mem_inst', 'user_demo_institution', 'INSTITUTION_ADMIN', 'inst_demo', null, true),
('mem_super', 'user_demo_super', 'SUPER_ADMIN', null, null, true),
('mem_night', 'user_demo_night', 'STAFF', 'inst_harbour', 'canteen_night', true)
on conflict (id) do nothing;
insert into token_seq (canteen_id, next_n) values
('canteen_central', 1023),
('canteen_night', 200)
on conflict (canteen_id) do nothing;
insert into subscriptions (id, institution_id, plan, status, seats) values
('sub_demo', 'inst_demo', 'Campus', 'ACTIVE', 4),
('sub_harbour', 'inst_harbour', 'Hostel', 'ACTIVE', 1)
on conflict (id) do nothing;
insert into audit_logs (id, actor_user_id, institution_id, action, entity, entity_id, detail) values
('aud_seed', 'user_demo_super', 'inst_demo', 'SEED', 'institution', 'inst_demo', '{"demo":true}'::jsonb)
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_1', 'C1010', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 6000, 500, 0, 6500, 8, 0, 480, 'idem_ord_hist_1', 'seed', 'CX|ord_hist_1|C1010', now() - interval '2 days', now() - interval '2 days', now() - interval '2 days' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_1', 'ord_hist_1', 'itm_veg_sandwich', 'Veg Sandwich', 2, 3000, 6000, 8)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_1', 'ord_hist_1', 'DEMO', 'PAID', 6500, 'paykey_ord_hist_1')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_1', 'ord_hist_1', 'user_demo_customer', 'canteen_central', 4, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_1', 'ord_hist_1', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_2', 'C1011', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 5900, 500, 0, 6400, 12, 0, 720, 'idem_ord_hist_2', 'seed', 'CX|ord_hist_2|C1011', now() - interval '2 days 3 hours', now() - interval '2 days 3 hours', now() - interval '2 days 3 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_2', 'ord_hist_2', 'itm_aloo', 'Aloo Prantha', 1, 5900, 5900, 12)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_2', 'ord_hist_2', 'DEMO', 'PAID', 6400, 'paykey_ord_hist_2')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_2', 'ord_hist_2', 'user_demo_customer', 'canteen_central', 5, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_2', 'ord_hist_2', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_3', 'C1012', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 6900, 500, 0, 7400, 10, 0, 600, 'idem_ord_hist_3', 'seed', 'CX|ord_hist_3|C1012', now() - interval '1 day 5 hours', now() - interval '1 day 5 hours', now() - interval '1 day 5 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_3', 'ord_hist_3', 'itm_hakka', 'Hakka Noodles', 1, 6900, 6900, 10)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_3', 'ord_hist_3', 'DEMO', 'PAID', 7400, 'paykey_ord_hist_3')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_3', 'ord_hist_3', 'user_demo_customer', 'canteen_central', 4, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_3', 'ord_hist_3', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_4', 'C1013', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 5900, 500, 0, 6400, 8, 0, 480, 'idem_ord_hist_4', 'seed', 'CX|ord_hist_4|C1013', now() - interval '1 day 2 hours', now() - interval '1 day 2 hours', now() - interval '1 day 2 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_4', 'ord_hist_4', 'itm_momo_steam_veg', 'Steamed Veg momos', 1, 5900, 5900, 8)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_4', 'ord_hist_4', 'DEMO', 'PAID', 6400, 'paykey_ord_hist_4')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_4', 'ord_hist_4', 'user_demo_customer', 'canteen_central', 5, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_4', 'ord_hist_4', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_5', 'C1014', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 9000, 500, 0, 9500, 7, 0, 420, 'idem_ord_hist_5', 'seed', 'CX|ord_hist_5|C1014', now() - interval '20 hours', now() - interval '20 hours', now() - interval '20 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_5', 'ord_hist_5', 'itm_samosa_chaat', 'Samosa Chaat', 2, 4500, 9000, 7)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_5', 'ord_hist_5', 'DEMO', 'PAID', 9500, 'paykey_ord_hist_5')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_5', 'ord_hist_5', 'user_demo_customer', 'canteen_central', 4, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_5', 'ord_hist_5', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_6', 'C1015', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 7900, 500, 0, 8400, 14, 0, 840, 'idem_ord_hist_6', 'seed', 'CX|ord_hist_6|C1015', now() - interval '8 hours', now() - interval '8 hours', now() - interval '8 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_6', 'ord_hist_6', 'itm_kulcha', 'Amritsari Kulcha Tandoori', 1, 7900, 7900, 14)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_6', 'ord_hist_6', 'DEMO', 'PAID', 8400, 'paykey_ord_hist_6')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_6', 'ord_hist_6', 'user_demo_customer', 'canteen_central', 5, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_6', 'ord_hist_6', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_7', 'C1016', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 6000, 500, 0, 6500, 4, 0, 240, 'idem_ord_hist_7', 'seed', 'CX|ord_hist_7|C1016', now() - interval '6 hours', now() - interval '6 hours', now() - interval '6 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_7', 'ord_hist_7', 'itm_chai', 'Masala Adraki Chai', 3, 2000, 6000, 4)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_7', 'ord_hist_7', 'DEMO', 'PAID', 6500, 'paykey_ord_hist_7')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_7', 'ord_hist_7', 'user_demo_customer', 'canteen_central', 4, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_7', 'ord_hist_7', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_8', 'C1017', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 9800, 500, 0, 10300, 7, 0, 420, 'idem_ord_hist_8', 'seed', 'CX|ord_hist_8|C1017', now() - interval '4 hours', now() - interval '4 hours', now() - interval '4 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_8', 'ord_hist_8', 'itm_peri', 'Peri Peri Fries', 2, 4900, 9800, 7)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_8', 'ord_hist_8', 'DEMO', 'PAID', 10300, 'paykey_ord_hist_8')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_8', 'ord_hist_8', 'user_demo_customer', 'canteen_central', 3, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_8', 'ord_hist_8', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_9', 'C1018', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 6400, 500, 0, 6900, 10, 0, 600, 'idem_ord_hist_9', 'seed', 'CX|ord_hist_9|C1018', now() - interval '26 hours', now() - interval '26 hours', now() - interval '26 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_9', 'ord_hist_9', 'itm_rajma', 'Rajma Chawal', 1, 6400, 6400, 10)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_9', 'ord_hist_9', 'DEMO', 'PAID', 6900, 'paykey_ord_hist_9')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_9', 'ord_hist_9', 'user_demo_customer', 'canteen_central', 5, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_9', 'ord_hist_9', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, prep_seconds, idempotency_key, request_hash, pickup_code, placed_at, updated_at, picked_up_at)
values ('ord_hist_10', 'C1019', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PICKED_UP', 'PAID', 9800, 500, 0, 10300, 5, 0, 300, 'idem_ord_hist_10', 'seed', 'CX|ord_hist_10|C1019', now() - interval '3 hours', now() - interval '3 hours', now() - interval '3 hours' + interval '12 minutes')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_ord_hist_10', 'ord_hist_10', 'itm_cold_coffee', 'Cold Coffee', 2, 4900, 9800, 5)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_ord_hist_10', 'ord_hist_10', 'DEMO', 'PAID', 10300, 'paykey_ord_hist_10')
on conflict (id) do nothing;
insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values
('rev_ord_hist_10', 'ord_hist_10', 'user_demo_customer', 'canteen_central', 4, 'Demo review')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values
('sh_ord_hist_10', 'ord_hist_10', 'READY_FOR_PICKUP', 'PICKED_UP', 'user_demo_staff', 'Demo history')
on conflict (id) do nothing;
insert into orders (id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name, customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise, discount_paise, total_paise, eta_minutes, orders_ahead, idempotency_key, request_hash, pickup_code, placed_at, updated_at)
values
('ord_live_1', 'C1020', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_main', 'Main Food', 'PREPARING', 'PAID', 5900, 500, 0, 6400, 12, 1, 'idem_live_1', 'seed', 'CX|ord_live_1|C1020', now() - interval '8 minutes', now() - interval '2 minutes'),
('ord_live_2', 'C1021', 'inst_demo', 'campus_main', 'canteen_central', 'Demo University', 'Main Campus', 'Central Canteen', 'user_demo_customer', 'ctr_snacks', 'Snacks', 'READY_FOR_PICKUP', 'PAID', 5900, 500, 0, 6400, 4, 0, 'idem_live_2', 'seed', 'CX|ord_live_2|C1021', now() - interval '16 minutes', now() - interval '1 minute')
on conflict (id) do nothing;
insert into order_items (id, order_id, item_id, name, qty, unit_paise, line_paise, prep_minutes) values
('oi_live_1', 'ord_live_1', 'itm_aloo', 'Aloo Prantha', 1, 5900, 5900, 12),
('oi_live_2', 'ord_live_2', 'itm_momo_steam_veg', 'Steamed Veg momos', 1, 5900, 5900, 8)
on conflict (id) do nothing;
insert into payments (id, order_id, provider, status, amount_paise, idempotency_key) values
('pay_live_1', 'ord_live_1', 'DEMO', 'PAID', 6400, 'paykey_live_1'),
('pay_live_2', 'ord_live_2', 'DEMO', 'PAID', 6400, 'paykey_live_2')
on conflict (id) do nothing;
insert into status_history (id, order_id, from_status, to_status, actor_user_id, note, created_at) values
('sh_l1a', 'ord_live_1', null, 'PLACED', 'user_demo_customer', null, now() - interval '8 minutes'),
('sh_l1b', 'ord_live_1', 'PLACED', 'PAYMENT_CONFIRMED', 'user_demo_customer', 'Demo payment', now() - interval '7 minutes'),
('sh_l1c', 'ord_live_1', 'PAYMENT_CONFIRMED', 'ACCEPTED', 'user_demo_staff', null, now() - interval '6 minutes'),
('sh_l1d', 'ord_live_1', 'ACCEPTED', 'PREPARING', 'user_demo_staff', null, now() - interval '4 minutes'),
('sh_l2a', 'ord_live_2', null, 'PLACED', 'user_demo_customer', null, now() - interval '16 minutes'),
('sh_l2b', 'ord_live_2', 'PREPARING', 'READY_FOR_PICKUP', 'user_demo_staff', null, now() - interval '2 minutes')
on conflict (id) do nothing;
insert into notifications (id, user_id, order_id, kind, title, body, dedupe_key) values
('nt_live_1', 'user_demo_customer', 'ord_live_1', 'STATUS', 'Order C1020 is being prepared', 'Aloo Prantha is on the tawa. This is a demo notification.', 'ord_live_1:PREPARING')
on conflict (id) do nothing;
