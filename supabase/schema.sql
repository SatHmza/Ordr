-- ============================================================
-- MenuQR — Full Database Schema
-- Paste this into: Supabase → SQL Editor → Run
-- ============================================================

-- RESTAURANTS
CREATE TABLE restaurants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  currency      TEXT NOT NULL DEFAULT 'MAD',
  default_lang  TEXT NOT NULL DEFAULT 'fr',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CATEGORIES
CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name_ar       TEXT,
  name_fr       TEXT,
  name_en       TEXT,
  position      INT NOT NULL DEFAULT 0,
  is_visible    BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ITEMS
CREATE TABLE items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_ar         TEXT,
  name_fr         TEXT,
  name_en         TEXT,
  description_ar  TEXT,
  description_fr  TEXT,
  description_en  TEXT,
  price           NUMERIC(10,2) NOT NULL,
  image_url       TEXT,
  is_available    BOOLEAN NOT NULL DEFAULT true,
  is_visible      BOOLEAN NOT NULL DEFAULT true,
  position        INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLES
CREATE TABLE tables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  qr_token      TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDERS
CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id      UUID NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','confirmed','preparing','ready','served','cancelled')),
  note          TEXT,
  total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE restaurants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  ENABLE ROW LEVEL SECURITY;

-- Restaurants
CREATE POLICY "owner_all_restaurants" ON restaurants
  USING (owner_id = auth.uid());
CREATE POLICY "public_read_restaurants" ON restaurants FOR SELECT
  TO anon USING (is_active = true);

-- Categories
CREATE POLICY "owner_all_categories" ON categories
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon USING (is_visible = true);

-- Items
CREATE POLICY "owner_all_items" ON items
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "public_read_items" ON items FOR SELECT
  TO anon USING (is_visible = true);

-- Tables
CREATE POLICY "owner_all_tables" ON tables
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "public_read_tables" ON tables FOR SELECT
  TO anon USING (is_active = true);

-- Orders — public can insert, owner can read/update all
CREATE POLICY "owner_all_orders" ON orders
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "public_insert_orders" ON orders FOR INSERT
  TO anon WITH CHECK (true);
CREATE POLICY "public_read_own_orders" ON orders FOR SELECT
  TO anon USING (true);

-- Order items
CREATE POLICY "owner_all_order_items" ON order_items
  USING (order_id IN (
    SELECT o.id FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE r.owner_id = auth.uid()
  ));
CREATE POLICY "public_insert_order_items" ON order_items FOR INSERT
  TO anon WITH CHECK (true);
CREATE POLICY "public_read_order_items" ON order_items FOR SELECT
  TO anon USING (true);

-- ============================================================
-- REALTIME
-- Enable realtime on orders table for kitchen display
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- AFTER RUNNING THIS SCHEMA:
-- 1. Create your owner account: Supabase → Authentication → Add user
-- 2. Insert your restaurant row:
--
-- INSERT INTO restaurants (owner_id, name, slug, default_lang)
-- VALUES ('<your-user-id>', 'Mon Restaurant', 'mon-restaurant', 'fr');
--
-- ============================================================
