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
  parche?: string;        // ✅ singular (usado en checkout y cartDrawer)
  parches?: string[];     // opcional, si en el futuro permitís varios
}
