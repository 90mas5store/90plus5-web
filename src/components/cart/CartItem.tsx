export interface CartItem {
  id: string;
  equipo: string;
  modelo: string;
  liga?: string;
  tipo?: string;
  version?: string;
  talla?: string;
  color?: string;
  cantidad: number;
  precio: number;
  imagen: string;
  dorsalNumero?: string;
  dorsalNombre?: string;
  parche?: string | null;        // label para UI
  parches?: string[];            // opcional, si en el futuro permitís varios
  // UUIDs para Supabase
  variant_id?: string | null;
  size_id?: string | null;
  patch_id?: string | null;
  player_id?: string | null;
}
