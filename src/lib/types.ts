export type ProductVariant = {
  id: string;
  version: string;
  price: number;
  active: boolean;
  original_price?: number;
  active_original_price?: boolean;
}

export interface Product {
  id: string;
  equipo: string;
  team_id: string;   // ✅ CLAVE
  modelo: string;
  precio: number;
  imagen: string;
  destacado?: boolean;
  product_variants?: ProductVariant[];
  logoEquipo?: string;
  category_id?: string;
  league_id?: string;
  slug?: string;
}


export interface Category {
  id: string;
  nombre: string;
  slug: string;
  order: number;
  icon_url?: string;
}

export interface League {
  id: string;
  nombre: string;
  slug: string;
  imagen: string;
  category_id?: string;
}

export interface Config {
  categorias: Category[];
  ligas: League[];
  banners?: { imagen: string; link: string }[];
  [key: string]: any;
}

export interface ShippingZone {
  id: string;
  department: string;
  municipality: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export interface CartItem extends Product {
  talla: string;
  cantidad: number;
  version?: string;
  dorsal?: string;
  dorsalNumero?: string;
  dorsalNombre?: string;
  parche?: string | null;
  parches?: string[];
  // UUIDs para Supabase
  variant_id?: string | null;
  size_id?: string | null;
  patch_id?: string | null;
  player_id?: string | null;
}
