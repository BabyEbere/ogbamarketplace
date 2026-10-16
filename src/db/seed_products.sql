-- =========================================================================
-- OGBA MARKET PLACE: Commercial Retail Seed Data (Jumia/Konga Standard)
-- 14 High-Demand Commercial Categories & Products for Omoku, Egi & Obrikom
-- =========================================================================

-- 1. Insert Initial Category Definitions
INSERT INTO categories (id, name, slug, description, icon_name, display_order)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Power Banks & Accessories', 'power-banks', 'High capacity portable chargers, solar banks, and multi-port charging cables', 'BatteryCharging', 1),
    ('10000000-0000-0000-0000-000000000002', 'Phones & Tablets', 'phones-tablets', 'Smartphones, Android, iPhones, iPads, tablets, and smart devices', 'Smartphone', 2),
    ('10000000-0000-0000-0000-000000000003', 'Clothes & Fashion', 'clothes-fashion', 'Men and women apparel, senatorial wear, shoes, corporate shirts, and bags', 'Shirt', 3),
    ('10000000-0000-0000-0000-000000000004', 'Cosmetics & Skincare', 'cosmetics-skincare', 'Original body lotions, face cleansers, makeup, fragrances, and sunscreens', 'Sparkles', 4),
    ('10000000-0000-0000-0000-000000000005', 'Electronics & Solar', 'electronics-solar', 'Smart TVs, solar inverters, sound systems, home theatres, and generators', 'Tv', 5),
    ('10000000-0000-0000-0000-000000000006', 'Home and Office', 'home-office', 'Blenders, microwaves, standing fans, electric kettles, and ergonomic furniture', 'Home', 6),
    ('10000000-0000-0000-0000-000000000007', 'Health and Beauty', 'health-beauty', 'Digital BP monitors, hair clippers, hair dryers, oral care, and wellness devices', 'HeartPulse', 7),
    ('10000000-0000-0000-0000-000000000008', 'Computing & Laptops', 'computing-laptops', 'HP, Dell, Lenovo laptops, wireless keyboards, SSD drives, and printers', 'Laptop', 8),
    ('10000000-0000-0000-0000-000000000009', 'Grocery & Supermarket', 'grocery-supermarket', 'Provisions, breakfast beverages, spaghetti, cooking oils, milk, and household supplies', 'ShoppingBag', 9),
    ('10000000-0000-0000-0000-000000000010', 'Garden and Outdoors', 'garden-outdoors', 'Solar outdoor floodlights, lawn mowers, garden hoses, and camping equipment', 'Trees', 10),
    ('10000000-0000-0000-0000-000000000011', 'Automobile & Bike Parts', 'automobile-parts', 'Car batteries, synthetic motor oils, tire inflators, dashcams, and brake pads', 'Car', 11),
    ('10000000-0000-0000-0000-000000000012', 'Sporting Goods & Fitness', 'sporting-goods', 'Dumbbells, resistance bands, footballs, running trainers, and gym wear', 'Dumbbell', 12),
    ('10000000-0000-0000-0000-000000000013', 'Gaming & Consoles', 'gaming-consoles', 'PlayStation 5, Xbox, Nintendo Switch, gaming headsets, and console controllers', 'Gamepad2', 13),
    ('10000000-0000-0000-0000-000000000014', 'Baby Products & Toys', 'baby-products', 'Molfix diapers, baby strollers, feeding bottles, baby wipes, and learning toys', 'Baby', 14)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    display_order = EXCLUDED.display_order;

-- 2. Insert Retail Merchant Users
INSERT INTO users (id, phone_number, full_name, email, role, area, delivery_address, wallet_balance)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+2348029991122', 'Ogba Tech Distro Hub', 'tech@ogbadistro.ng', 'vendor', 'Omoku', 'Omoku GRA Bypass Axis, Shop 12', 450000.00),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '+2348143334455', 'De-Kings Gadget & Phone Mart', 'dekings@gadgets.ng', 'vendor', 'Omoku', 'Omoku Main Market, Line 2, Shop 14', 890000.00),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '+2348097778899', 'Glamour Skincare & Cosmetics', 'glamour@cosmetics.ng', 'vendor', 'Omoku', 'Ahoada Road Commercial Axis, Omoku', 620000.00),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '+2348051112233', 'Executive Fashion & Boutique', 'executive@fashionboutique.ng', 'vendor', 'Omoku', 'Ahia Ogba Shopping Complex, Shop 08', 1400000.00)
ON CONFLICT (phone_number) DO NOTHING;

-- 3. Insert Retail Stores / Vendors
INSERT INTO vendors (id, user_id, business_name, slug, market_location, area, rating, review_count, total_sales, is_verified, kyc_status)
VALUES
    ('11111111-2222-3333-4444-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ogba Prime Electronics & Solar Hub', 'ogba-prime-electronics', 'Omoku GRA Bypass Axis, Shop 12', 'Omoku', 4.9, 310, 4500000.00, true, 'verified'),
    ('22222222-3333-4444-5555-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'De-Kings Gadgets & Computing World', 'de-kings-gadgets', 'Omoku Main Market, Line 2, Shop 14', 'Omoku', 4.8, 195, 3890000.00, true, 'verified'),
    ('33333333-4444-5555-6666-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Glamour Cosmetics & Beauty Store', 'glamour-cosmetics', 'Ahoada Road Commercial Axis, Omoku', 'Omoku', 4.9, 142, 2620000.00, true, 'verified'),
    ('44444444-5555-6666-7777-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Executive Men & Women Fashion Hub', 'executive-fashion-hub', 'Ahia Ogba Shopping Complex, Shop 08', 'Omoku', 4.7, 220, 5400000.00, true, 'verified')
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Commercial Retail Products (Covering Gadgets, Power Banks, Phones, Fashion, Laptops, Cosmetics, Gaming, Baby, Auto, Home)
INSERT INTO products (vendor_id, category_id, title, slug, description, price, compare_at_price, stock_quantity, unit, images, is_deal_of_day, is_fresh_produce)
VALUES
    -- 1. Power Banks
    (
        '11111111-2222-3333-4444-555555555555',
        '10000000-0000-0000-0000-000000000001',
        'Oraimo 20,000mAh Anifast Multi-Device Fast-Charging Power Bank',
        'oraimo-20000mah-powerbank',
        'Heavy-duty 20,000mAh fast-charging power bank with digital LED battery percentage display, AniFast high-speed intelligent chip, and dual USB-C/USB-A output.',
        18500.00,
        22000.00,
        45,
        'Unit / Box',
        ARRAY['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'],
        true,
        false
    ),
    (
        '11111111-2222-3333-4444-555555555555',
        '10000000-0000-0000-0000-000000000001',
        'Romoss 30,000mAh 22.5W Two-Way Fast Charge Power Bank',
        'romoss-30000mah-fast-charge-powerbank',
        'High capacity 30,000mAh lithium-polymer power bank capable of charging iPhones up to 7 times. Compatible with Type-C PD 3.0 and Quick Charge.',
        28000.00,
        34000.00,
        30,
        'Unit / Box',
        ARRAY['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 2. Phones & Tablets
    (
        '22222222-3333-4444-5555-666666666666',
        '10000000-0000-0000-0000-000000000002',
        'Samsung Galaxy A15 5G (128GB / 6GB RAM) Dual SIM - Black',
        'samsung-galaxy-a15-5g',
        'Original brand new factory-sealed smartphone with 6.5-inch 90Hz Super AMOLED display, 50MP triple AI camera, and 5000mAh long-lasting battery.',
        215000.00,
        235000.00,
        15,
        'Box / Phone',
        ARRAY['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80'],
        true,
        false
    ),
    (
        '22222222-3333-4444-5555-666666666666',
        '10000000-0000-0000-0000-000000000002',
        'Apple iPhone 15 Pro Max (256GB, Natural Titanium)',
        'apple-iphone-15-pro-max-256gb',
        'Brand new sealed iPhone 15 Pro Max with aerospace-grade titanium design, A17 Pro chip, 48MP main camera with 5x optical zoom, and USB-C speed.',
        1750000.00,
        1890000.00,
        6,
        'Box / Sealed',
        ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 3. Clothes & Fashion
    (
        '44444444-5555-6666-7777-888888888888',
        '10000000-0000-0000-0000-000000000003',
        'Men Luxury Pure Cotton Senatorial Native Wear (Navy Blue)',
        'men-luxury-senatorial-wear-navy',
        'Premium tailored native senatorial outfit made from high-grade breathable Italian cotton fabric with modern embroidery detailing and matching trousers.',
        32000.00,
        38000.00,
        25,
        'Complete Set',
        ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),
    (
        '44444444-5555-6666-7777-888888888888',
        '10000000-0000-0000-0000-000000000003',
        'Women Elegant Floral Chiffon Maxi Office & Casual Gown',
        'women-floral-chiffon-maxi-gown',
        'Graceful and stylish women chiffon dress suitable for corporate outings, church, and high-end occasions.',
        18500.00,
        24000.00,
        35,
        'Piece',
        ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80'],
        true,
        false
    ),

    -- 4. Cosmetics & Skincare
    (
        '33333333-4444-5555-6666-777777777777',
        '10000000-0000-0000-0000-000000000004',
        'CeraVe Moisturizing Daily Lotion & Hydrating Facial Cleanser Combo',
        'cerave-moisturizing-cleanser-combo',
        'Dermatologist-formulated skincare duo with 3 essential ceramides and hyaluronic acid to restore protective skin barrier.',
        24000.00,
        28000.00,
        40,
        'Set / 2 Bottles',
        ARRAY['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80'],
        true,
        false
    ),

    -- 5. Electronics & Solar
    (
        '11111111-2222-3333-4444-555555555555',
        '10000000-0000-0000-0000-000000000005',
        'Hisense 43-Inch 4K UHD Frameless Smart TV with HDR & Dolby Audio',
        'hisense-43-inch-4k-smart-tv',
        'Crystal clear 4K Ultra HD television with built-in YouTube, Netflix, Prime Video, HDMI 2.1, and Dolby Audio surround sound.',
        245000.00,
        270000.00,
        12,
        'Carton / Unit',
        ARRAY['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80'],
        true,
        false
    ),
    (
        '11111111-2222-3333-4444-555555555555',
        '10000000-0000-0000-0000-000000000005',
        'Felicity Solar 1kVA / 12V Pure Sine Wave Hybrid Inverter System',
        'felicity-solar-1kva-hybrid-inverter',
        'Reliable solar energy inverter with built-in 40A MPPT charge controller, overload protection, and high-efficiency power backup.',
        165000.00,
        185000.00,
        8,
        'Unit',
        ARRAY['https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 6. Home and Office
    (
        '11111111-2222-3333-4444-555555555555',
        '10000000-0000-0000-0000-000000000006',
        'Century 1.5L Stainless Steel Electric Blender & Dry Mill Grinder',
        'century-1-5l-electric-blender',
        'High-speed copper motor blender with stainless steel ice-crushing blades and secondary grinder cup for spices and beans.',
        22500.00,
        26000.00,
        30,
        'Carton',
        ARRAY['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 7. Health and Beauty
    (
        '33333333-4444-5555-6666-777777777777',
        '10000000-0000-0000-0000-000000000007',
        'Omron Automatic Upper Arm Digital Blood Pressure Monitor',
        'omron-digital-blood-pressure-monitor',
        'Clinically validated upper arm BP monitor with hypertension indicator, memory storage for 60 readings, and irregular heartbeat detector.',
        34000.00,
        39000.00,
        20,
        'Unit / Box',
        ARRAY['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 8. Computing & Laptops
    (
        '22222222-3333-4444-5555-666666666666',
        '10000000-0000-0000-0000-000000000008',
        'HP 15 Intel Core i5 16GB RAM 512GB NVMe SSD 15.6" Laptop',
        'hp-15-intel-core-i5-laptop',
        'High performance student and corporate laptop with Intel Core i5 processor, 16GB DDR4 RAM, 512GB SSD, Windows 11 Pro, and backlit keyboard.',
        460000.00,
        490000.00,
        10,
        'Piece / Laptop',
        ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 9. Grocery & Supermarket
    (
        '33333333-4444-5555-6666-777777777777',
        '10000000-0000-0000-0000-000000000009',
        'Milo Energy Food Drink (800g) + Peak Full Cream Milk (850g) Breakfast Pack',
        'milo-peak-milk-breakfast-pack',
        'Family essential breakfast pack featuring fortified malt beverage and 100% full cream powdered milk.',
        13500.00,
        15500.00,
        60,
        'Combo Pack',
        ARRAY['https://images.unsplash.com/photo-1584473457406-624048518851?auto=format&fit=crop&w=600&q=80'],
        true,
        false
    ),

    -- 10. Garden and Outdoors
    (
        '11111111-2222-3333-4444-555555555555',
        '10000000-0000-0000-0000-000000000010',
        '300W Waterproof Commercial Solar LED Street & Compound Floodlight',
        '300w-waterproof-solar-floodlight',
        'All-in-one solar security lighting with remote controller, radar motion sensor, IP67 waterproof aluminum casing, and dusk-to-dawn auto illumination.',
        28500.00,
        34000.00,
        35,
        'Carton / Unit',
        ARRAY['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 11. Automobile & Bike Parts
    (
        '11111111-2222-3333-4444-555555555555',
        '10000000-0000-0000-0000-000000000011',
        'TotalEnergies Quartz 9000 5W-40 Fully Synthetic Engine Oil (4 Litres)',
        'total-quartz-9000-5w40-engine-oil',
        'Original premium engine lubricant delivering optimal engine cleanliness, wear protection, and fuel efficiency in Nigerian driving conditions.',
        31000.00,
        36000.00,
        40,
        '4 Litres Gallon',
        ARRAY['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 12. Sporting Goods & Fitness
    (
        '22222222-3333-4444-5555-666666666666',
        '10000000-0000-0000-0000-000000000012',
        '20kg Adjustable Rubber-Coated Dumbbell & Barbell Weight Set',
        '20kg-adjustable-dumbbell-set',
        'Versatile home workout dumbbell set with connecting bar converter, anti-slip handles, and floor-safe rubber encased plates.',
        38000.00,
        44000.00,
        20,
        'Complete Case',
        ARRAY['https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 13. Gaming & Consoles
    (
        '22222222-3333-4444-5555-666666666666',
        '10000000-0000-0000-0000-000000000013',
        'Sony PlayStation 5 (PS5) Slim Disc Edition + Extra DualSense Controller',
        'sony-ps5-slim-disc-edition',
        'Brand new 1TB SSD Ultra-HD PlayStation 5 Slim console with ray tracing, 4K gaming, and bonus official wireless controller.',
        880000.00,
        940000.00,
        5,
        'Box / Sealed',
        ARRAY['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    ),

    -- 14. Baby Products & Toys
    (
        '33333333-4444-5555-6666-777777777777',
        '10000000-0000-0000-0000-000000000014',
        'Molfix Premium Baby Diapers Jumbo Pack (Size 4 Maxi - 88 Count)',
        'molfix-premium-baby-diapers-size-4',
        'Ultra-absorbent, hypoallergenic diapers with 3D anti-leak barriers and soft breathable cotton feel for babies 7-14kg.',
        14500.00,
        16500.00,
        50,
        'Jumbo Pack',
        ARRAY['https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80'],
        false,
        false
    )
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    stock_quantity = EXCLUDED.stock_quantity,
    unit = EXCLUDED.unit,
    images = EXCLUDED.images,
    is_deal_of_day = EXCLUDED.is_deal_of_day;
