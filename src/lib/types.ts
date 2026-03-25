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
  league_ids?: string[]; // ✅ Support for multiple leagues
  slug?: string;
  sort_order?: number;
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
  [key: string]: unknown;
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

// ============================================================
// Supabase Raw Response Types (for type-safe query results)
// ============================================================

/** Raw product row as returned by Supabase queries with JOINs */
export interface SupabaseRawProduct {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url: string;
  featured?: boolean;
  sort_order?: number;
  team_id: string;
  category_id?: string;
  league_id?: string;
  active?: boolean;
  teams?: { id?: string; name: string; logo_url?: string } | { id?: string; name: string; logo_url?: string }[] | null;
  product_variants?: SupabaseRawVariant[];
  product_leagues?: { league_id: string }[];
}

export interface SupabaseRawVariant {
  id: string;
  version: string;
  price: number;
  active: boolean;
  original_price?: number;
  active_original_price?: boolean;
}

/** Raw order item row from Supabase with JOINs.
 * Note: Supabase may return arrays for single-row relations; use `as unknown as` for cast. */
export interface SupabaseRawOrderItem {
  quantity: number;
  unit_price?: number;
  personalization_type?: string;
  custom_name?: string | null;
  custom_number?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any;
  product_variants?: any;
  sizes?: any;
  patches?: any;
  players?: any;
}

/** Raw payment row */
export interface SupabaseRawPayment {
  id: string;
  amount: number;
  type: 'deposit' | 'remaining';
  status: 'pending' | 'completed' | 'failed';
  provider: string;
  method: string;
  notes?: string;
  created_at?: string;
}

/** Raw order row from Supabase */
export interface SupabaseRawOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: string;
  total_amount: number;
  subtotal?: number;
  deposit_amount?: number;
  shipping_department?: string;
  shipping_municipality?: string;
  shipping_address?: string;
  idempotency_key?: string;
  order_items?: SupabaseRawOrderItem[];
  payments?: SupabaseRawPayment[];
}

/** Raw banner row */
export interface SupabaseRawBanner {
  id: string;
  title?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  link_url?: string;
  button_text?: string;
}
