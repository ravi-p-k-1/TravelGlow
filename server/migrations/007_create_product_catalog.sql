CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL,
  price_cents INTEGER,
  image_url TEXT,
  concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  skin_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  climate_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  spf INTEGER,
  partner BOOLEAN NOT NULL DEFAULT FALSE,
  partner_priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_price_nonnegative CHECK (price_cents IS NULL OR price_cents >= 0),
  CONSTRAINT products_spf_positive CHECK (spf IS NULL OR spf > 0),
  CONSTRAINT products_tags_are_arrays CHECK (
    jsonb_typeof(concerns) = 'array' AND jsonb_typeof(skin_types) = 'array'
    AND jsonb_typeof(climate_tags) = 'array'
  )
);

CREATE TABLE IF NOT EXISTS product_purchase_links (
  id UUID PRIMARY KEY,
  product_id VARCHAR(80) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  retailer VARCHAR(120) NOT NULL,
  url TEXT NOT NULL,
  partner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, retailer)
);

CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  forecast_id UUID NOT NULL REFERENCES skin_forecasts(id) ON DELETE CASCADE,
  product_id VARCHAR(80) NOT NULL REFERENCES products(id),
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  reasons JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, product_id),
  UNIQUE (trip_id, rank),
  CONSTRAINT product_recommendations_reasons_array CHECK (jsonb_typeof(reasons) = 'array')
);

CREATE INDEX IF NOT EXISTS product_recommendations_trip_id_idx ON product_recommendations (trip_id, rank);

INSERT INTO products (id, name, brand, category, price_cents, image_url, concerns, skin_types, climate_tags, spf) VALUES
  ('cerave-am-spf50', 'AM Facial Moisturizing Lotion SPF 50', 'CeraVe', 'sunscreen', 1999, '/product-images/sunscreen.svg', '["uv-protection","hydration"]', '["normal","dry","sensitive"]', '["high-uv","dry"]', 50),
  ('eucerin-oil-control-spf50', 'Oil Control Face Sunscreen SPF 50', 'Eucerin', 'sunscreen', NULL, '/product-images/sunscreen.svg', '["uv-protection","oiliness","heat-congestion"]', '["oily","acne-prone"]', '["high-uv","humid","hot"]', 50),
  ('eucerin-ultralight-spf50', 'Advanced Hydration Ultra-Light Face Sunscreen SPF 50', 'Eucerin', 'sunscreen', NULL, '/product-images/sunscreen.svg', '["uv-protection","hydration"]', '["all","sensitive"]', '["high-uv","hot"]', 50),
  ('lrp-uvair-spf50', 'Anthelios UVAir SPF 50 Serum Sunscreen', 'La Roche-Posay', 'sunscreen', NULL, '/product-images/sunscreen.svg', '["uv-protection","oiliness"]', '["all","oily"]', '["high-uv","humid","hot"]', 50),
  ('vanicream-mineral-spf30', 'Mineral Facial Moisturizer SPF 30', 'Vanicream', 'sunscreen', NULL, '/product-images/sunscreen.svg', '["uv-protection","barrier-dryness"]', '["sensitive","dry"]', '["high-uv","dry","cold"]', 30),
  ('cerave-hydrating-cleanser', 'Hydrating Facial Cleanser', 'CeraVe', 'cleanser', 1599, '/product-images/cleanser.svg', '["hydration","barrier-dryness"]', '["normal","dry","sensitive"]', '["dry","cold"]', NULL),
  ('cerave-foaming-cleanser', 'Foaming Facial Cleanser', 'CeraVe', 'cleanser', 1599, '/product-images/cleanser.svg', '["oiliness","heat-congestion"]', '["normal","oily"]', '["humid","hot"]', NULL),
  ('vanicream-gentle-cleanser', 'Gentle Facial Cleanser', 'Vanicream', 'cleanser', NULL, '/product-images/cleanser.svg', '["hydration","barrier-dryness"]', '["all","sensitive"]', '["dry","cold"]', NULL),
  ('ordinary-squalane-cleanser', 'Squalane Cleanser', 'The Ordinary', 'cleanser', NULL, '/product-images/cleanser.svg', '["hydration","barrier-dryness"]', '["all","dry"]', '["dry","cold"]', NULL),
  ('cerave-pm-lotion', 'PM Facial Moisturizing Lotion', 'CeraVe', 'moisturizer', 1999, '/product-images/moisturizer.svg', '["hydration","barrier-dryness"]', '["all","dry"]', '["dry","cold"]', NULL),
  ('cerave-ultralight-gel', 'Ultra-Light Moisturizing Gel', 'CeraVe', 'moisturizer', 1999, '/product-images/moisturizer.svg', '["oiliness","heat-congestion","hydration"]', '["all","oily"]', '["humid","hot"]', NULL),
  ('cerave-oil-control-gel', 'Oil Control Moisturizing Gel-Cream', 'CeraVe', 'moisturizer', NULL, '/product-images/moisturizer.svg', '["oiliness","heat-congestion"]', '["oily","combination"]', '["humid","hot"]', NULL),
  ('cerave-moisturizing-cream', 'Moisturizing Cream', 'CeraVe', 'moisturizer', 1499, '/product-images/moisturizer.svg', '["hydration","barrier-dryness"]', '["normal","dry","sensitive"]', '["dry","cold"]', NULL),
  ('lrp-cicaplast-balm-b5', 'Cicaplast Balm B5', 'La Roche-Posay', 'moisturizer', NULL, '/product-images/moisturizer.svg', '["barrier-dryness","hydration"]', '["dry","sensitive"]', '["dry","cold"]', NULL),
  ('ordinary-ha-b5', 'Hyaluronic Acid 2% + B5', 'The Ordinary', 'hydrating-serum', NULL, '/product-images/serum.svg', '["hydration","barrier-dryness"]', '["all","dry"]', '["dry","cold"]', NULL),
  ('cerave-ha-serum', 'Hydrating Hyaluronic Acid Serum', 'CeraVe', 'hydrating-serum', NULL, '/product-images/serum.svg', '["hydration","barrier-dryness"]', '["all","dry","sensitive"]', '["dry","cold"]', NULL),
  ('lrp-hyalu-b5-serum', 'Hyalu B5 Suractivated Serum with Hyaluronic Acid', 'La Roche-Posay', 'hydrating-serum', NULL, '/product-images/serum.svg', '["hydration","barrier-dryness"]', '["all","dry","sensitive"]', '["dry","cold"]', NULL),
  ('aquaphor-lip-spf30', 'Lip Protectant + SPF 30', 'Aquaphor', 'lip-spf', NULL, '/product-images/lip-spf.svg', '["uv-protection","barrier-dryness"]', '["all","sensitive"]', '["high-uv","dry","cold"]', 30),
  ('avene-thermal-water', 'Thermal Spring Water', 'Avène', 'facial-mist', 2000, '/product-images/mist.svg', '["heat-congestion","redness"]', '["all","sensitive"]', '["hot","humid"]', NULL),
  ('eucerin-after-sun', 'Advanced Hydration After Sun Lotion', 'Eucerin', 'after-sun', NULL, '/product-images/after-sun.svg', '["uv-protection","hydration"]', '["all","dry","sensitive"]', '["high-uv","hot"]', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_purchase_links (id, product_id, retailer, url) VALUES
  ('10000000-0000-4000-8000-000000000001', 'cerave-am-spf50', 'CeraVe', 'https://www.cerave.com/skincare/moisturizers/facial-moisturizers/am-facial-moisturizing-lotion-spf-50'),
  ('10000000-0000-4000-8000-000000000002', 'eucerin-oil-control-spf50', 'Eucerin', 'https://www.eucerinus.com/products/sun-protection/oil-control-face-sunscreen-spf-50'),
  ('10000000-0000-4000-8000-000000000003', 'eucerin-ultralight-spf50', 'Eucerin', 'https://www.eucerinus.com/products/sun-protection/advanced-hydration-ultra-light-face-sunscreen-spf-50'),
  ('10000000-0000-4000-8000-000000000004', 'lrp-uvair-spf50', 'La Roche-Posay', 'https://www.laroche-posay.us/our-products/sun/face-sunscreen/anthelios-uv-air-spf-50-serum-sunscreen-3606000650114.html'),
  ('10000000-0000-4000-8000-000000000005', 'vanicream-mineral-spf30', 'Vanicream', 'https://www.vanicream.com/product/facial-moisturizer-with-spf'),
  ('10000000-0000-4000-8000-000000000006', 'cerave-hydrating-cleanser', 'CeraVe', 'https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser'),
  ('10000000-0000-4000-8000-000000000007', 'cerave-foaming-cleanser', 'CeraVe', 'https://www.cerave.com/skincare/cleansers/foaming-facial-cleanser'),
  ('10000000-0000-4000-8000-000000000008', 'vanicream-gentle-cleanser', 'Vanicream', 'https://www.vanicream.com/product/gentle-facial-cleanser'),
  ('10000000-0000-4000-8000-000000000009', 'ordinary-squalane-cleanser', 'The Ordinary', 'https://theordinary.com/en-us/squalane-face-cleanser-100446.html'),
  ('10000000-0000-4000-8000-000000000010', 'cerave-pm-lotion', 'CeraVe', 'https://www.cerave.com/skincare/moisturizers/pm-facial-moisturizing-lotion'),
  ('10000000-0000-4000-8000-000000000011', 'cerave-ultralight-gel', 'CeraVe', 'https://www.cerave.com/skincare/moisturizers/ultra-light-moisturizing-gel'),
  ('10000000-0000-4000-8000-000000000012', 'cerave-oil-control-gel', 'CeraVe', 'https://www.cerave.com/skincare/moisturizers/oil-control-moisturizing-gel-cream'),
  ('10000000-0000-4000-8000-000000000013', 'cerave-moisturizing-cream', 'CeraVe', 'https://www.cerave.com/skincare/moisturizers/moisturizing-cream'),
  ('10000000-0000-4000-8000-000000000014', 'lrp-cicaplast-balm-b5', 'La Roche-Posay', 'https://www.laroche-posay.us/our-products/face/face-moisturizer/cicaplast-balm-b5-for-dry-skin-irritations-3337872412998.html'),
  ('10000000-0000-4000-8000-000000000015', 'ordinary-ha-b5', 'The Ordinary', 'https://theordinary.com/en-us/hyaluronic-acid-2-b5-serum-100637.html'),
  ('10000000-0000-4000-8000-000000000016', 'cerave-ha-serum', 'CeraVe', 'https://www.cerave.com/skincare/facial-serums/hydrating-hyaluronic-acid-serum'),
  ('10000000-0000-4000-8000-000000000017', 'lrp-hyalu-b5-serum', 'La Roche-Posay', 'https://www.laroche-posay.us/our-products/face/face-serum/hyalu-b5-pure-hyaluronic-acid-serum-3337875583626.html'),
  ('10000000-0000-4000-8000-000000000018', 'aquaphor-lip-spf30', 'Aquaphor', 'https://www.aquaphorus.com/products/aquaphor/aquaphor-lip-protectant-spf-30'),
  ('10000000-0000-4000-8000-000000000019', 'avene-thermal-water', 'Avène', 'https://www.aveneusa.com/products/thermal-spring-water'),
  ('10000000-0000-4000-8000-000000000020', 'eucerin-after-sun', 'Eucerin', 'https://www.eucerinus.com/products/sun-protection/after-sun')
ON CONFLICT (product_id, retailer) DO NOTHING;
