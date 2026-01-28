-- 1. Crear tabla de administradores permitidos (Whitelist)
CREATE TABLE IF NOT EXISTS admin_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin', -- 'admin', 'superadmin', 'editor'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de Banners para el Home
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  video_url TEXT, -- Soporte para video
  link_url TEXT,
  button_text TEXT DEFAULT 'Ver Más',
  active BOOLEAN DEFAULT true, -- Si el banner funciona en general
  show_on_home BOOLEAN DEFAULT true, -- NUEVO: Si debe salir en el carrusel del Home
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Policy: Solo admins pueden ver/editar la whitelist y banners
ALTER TABLE admin_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para banners (para que se vean en la web)
CREATE POLICY "Banners are viewable by everyone" ON banners
  FOR SELECT USING (true);

-- Política de edición solo para admins (usando la whitelist)
-- Nota: Esto requiere una función helper check_is_admin() o similar, 
-- por simplicidad en este script asumimos autenticación básica de Supabase o que lo gestionas desde el dashboard.

-- INSTRUCCIONES:
-- Copia y pega esto en el SQL Editor de Supabase para aplicar los cambios.
