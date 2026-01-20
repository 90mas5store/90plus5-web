-- 🛡️ SECURITY PROTOCOL: 90+5 STORE 
-- Copy and paste this into the Supabase SQL Editor

-- ==============================================================================
-- 1. ENABLE ROW LEVEL SECURITY (RLS)
-- Esto activa el "candado" en todas las tablas importantes.
-- Por defecto, NINGUNA operación (Select, Insert, Update) será permitida hasta definir políticas.
-- ==============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;

-- Tablas de Órdenes (Datos Sensibles)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. POLITICAS DE "CATÁLOGO PÚBLICO"
-- Permitir a CUALQUIER persona ver los productos (Anon Key)
-- ==============================================================================

-- Products: Públicos solo pueden ver
CREATE POLICY "Public Read Access Products" ON products 
FOR SELECT TO anon, authenticated USING (true);

-- Variants & Sizes: Públicos solo pueden ver
CREATE POLICY "Public Read Access Variants" ON product_variants 
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Access Variant Sizes" ON variant_sizes 
FOR SELECT TO anon, authenticated USING (true);

-- Config Tables: Públicos solo pueden ver
CREATE POLICY "Public Read Access Teams" ON teams 
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Access Leagues" ON leagues 
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Access Categories" ON categories 
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Access Players" ON players 
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Access Patches" ON patches 
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Access Product Patches" ON product_patches 
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Access Product Leagues" ON product_leagues 
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Access Shipping" ON shipping_zones 
FOR SELECT TO anon, authenticated USING (true);

-- ==============================================================================
-- 3. POLITICAS DE "CHECKOUT" (Público puede CREAR, no ver)
-- ==============================================================================

-- Orders: Cualquiera puede CREAR una orden
CREATE POLICY "Public Insert Orders" ON orders 
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Order Items: Cualquiera puede CREAR items
CREATE POLICY "Public Insert Order Items" ON order_items 
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Payments: Cualquiera puede CREAR pagos
CREATE POLICY "Public Insert Payments" ON payments 
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ⚠️ IMPORTANTE: Nadie público puede hacer SELECT/DELETE/UPDATE en ordenes
-- (Solo el Admin podrá, ver sección 4)

-- ==============================================================================
-- 4. POLITICAS DE "SUPER ADMIN" (Authenticated)
-- El usuario logueado en /admin debe poder hacerlo TODO.
-- ==============================================================================

-- NOTA: Supabase tiene un rol especial "service_role" que ya se salta todo esto.
-- Pero para tu Dashboard (que usa cliente autenticado), necesitamos dar permisos explícitos.
-- Asumimos que CUALQUIER usuario autenticado es Admin (setup simple).

-- Permitir TODO a usuarios autenticados (Tu cuenta de Admin)
CREATE POLICY "Admin Full Access Products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Variants" ON product_variants FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Sizes" ON variant_sizes FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Teams" ON teams FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Leagues" ON leagues FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Players" ON players FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Patches" ON patches FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access ProdPatches" ON product_patches FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access ProdLeagues" ON product_leagues FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Shipping" ON shipping_zones FOR ALL TO authenticated USING (true);

-- Admin puede leer y manipular ordenes
CREATE POLICY "Admin Full Access Orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Order Items" ON order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Access Payments" ON payments FOR ALL TO authenticated USING (true);
