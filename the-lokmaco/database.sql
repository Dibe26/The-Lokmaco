-- =============================================
-- The Lokmaco — Supabase Database Schema
-- Based on Class Diagram (svg)
-- =============================================

-- ─── 1. MENU ITEMS ───────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
    id          SERIAL PRIMARY KEY,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    image_url   TEXT        NOT NULL DEFAULT '',
    price       INTEGER     NOT NULL,  -- цена в сумах
    quantity    INTEGER     NOT NULL DEFAULT 100,
    category    TEXT        NOT NULL DEFAULT 'other'
);

-- ─── 2. USERS (anonymous, session-based) ─────
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    session_id  TEXT        NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. CARTS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. CART ITEMS ────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
    id           SERIAL PRIMARY KEY,
    cart_id      INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (cart_id, menu_item_id)
);

-- ─── 5. ORDERS ────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id          SERIAL PRIMARY KEY,
    name        TEXT        NOT NULL,
    phone       TEXT        NOT NULL,
    total_price INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. ORDER ITEMS ───────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id           SERIAL PRIMARY KEY,
    order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE SET NULL,
    quantity     INTEGER NOT NULL DEFAULT 1,
    price        INTEGER NOT NULL  -- цена на момент заказа
);

-- ─── INDEXES ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ─── ROW LEVEL SECURITY ───────────────────────
ALTER TABLE menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- menu_items: публичное чтение
CREATE POLICY "Public read menu_items"
    ON menu_items FOR SELECT USING (true);

-- users: публичное создание и чтение своей записи
CREATE POLICY "Public insert users"
    ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select users"
    ON users FOR SELECT USING (true);

-- carts: публичное создание и чтение
CREATE POLICY "Public insert carts"
    ON carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select carts"
    ON carts FOR SELECT USING (true);

-- cart_items: публичный CRUD
CREATE POLICY "Public insert cart_items"
    ON cart_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select cart_items"
    ON cart_items FOR SELECT USING (true);
CREATE POLICY "Public update cart_items"
    ON cart_items FOR UPDATE USING (true);
CREATE POLICY "Public delete cart_items"
    ON cart_items FOR DELETE USING (true);

-- orders: публичное создание и чтение
CREATE POLICY "Public insert orders"
    ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select orders"
    ON orders FOR SELECT USING (true);

-- order_items: публичное создание и чтение
CREATE POLICY "Public insert order_items"
    ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select order_items"
    ON order_items FOR SELECT USING (true);

-- ─── SEED DATA — MENU ITEMS ───────────────────
INSERT INTO menu_items (name, description, image_url, price, quantity, category) VALUES
(
    'Гонконгские вафли с шоколадом',
    'Хрустящие гонконгские вафли с шоколадным соусом',
    'img/гонконгские.jpg',
    45000, 100, 'hong-kong'
),
(
    'Гонконгские вафли с бананом',
    'Воздушные гонконгские вафли с ломтиками банана',
    'img/гонконгскиеСБананом.jpg',
    53000, 100, 'hong-kong'
),
(
    'Гонконгские вафли с клубникой',
    'Нежные гонконгские вафли со свежей клубникой',
    'img/гонконгскиеСКлубникой.jpg',
    55000, 100, 'hong-kong'
),
(
    'Гонконгские вафли фруктовый микс',
    'Гонконгские вафли с ассорти из свежих фруктов',
    'img/гонконгскиеМикс.jpg',
    65000, 100, 'hong-kong'
),
(
    'Бельгийские вафли с шоколадом',
    'Классические бельгийские вафли с шоколадом',
    'img/бельгийские.jpg',
    45000, 100, 'belgian'
),
(
    'Бельгийские вафли с бананом',
    'Бельгийские вафли с карамелизированным бананом',
    'img/бельгийскиеСБананом.jpg',
    53000, 100, 'belgian'
),
(
    'Бельгийские вафли с клубникой',
    'Бельгийские вафли со взбитыми сливками и клубникой',
    'img/бельгийскиеСКлубникой.jpg',
    55000, 100, 'belgian'
),
(
    'Бельгийские вафли фруктовый микс',
    'Бельгийские вафли с ассорти из сезонных фруктов',
    'img/бельгийскиеМикс.jpg',
    65000, 100, 'belgian'
),
(
    'Английские панкейки',
    'Пышные английские панкейки с сиропом',
    'img/английскиеПанкейки.jpg',
    78000, 100, 'pancakes'
),
(
    'Фруктовые блинчики',
    'Тонкие блинчики с фруктовой начинкой',
    'img/блинчики.jpg',
    70000, 100, 'pancakes'
),
(
    'Фондю с мороженым',
    'Шоколадное фондю с шариками мороженого',
    'img/фондю.jpg',
    85000, 100, 'fondue'
);
