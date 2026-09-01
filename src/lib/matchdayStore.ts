/**
 * matchdayStore.ts
 *
 * Store de configuración manual de Matchday.
 *
 * IMPORTANTE: La fuente de verdad real es Supabase (columnas `is_matchday_active`,
 * `matchday_opponent`, `matchday_score`, `matchday_period` en la tabla `teams`).
 *
 * Este módulo era originalmente un archivo JSON local (src/data/matchday_manual.json),
 * pero Vercel tiene un filesystem de solo lectura y las instancias serverless son
 * efímeras — los datos escritos en disco nunca persisten.
 *
 * La escritura ya fue migrada a Supabase en `admin/matchday-config/route.ts`.
 * Este módulo ahora solo mantiene un Map en memoria por compatibilidad con el
 * código legacy que lo importa (ej. discount/validate/route.ts), aunque los datos
 * reales siempre deben leerse directamente de Supabase.
 */

export interface ManualMatchdayStore {
  is_matchday_active: boolean;
  matchday_opponent?: string;
  matchday_score?: string;
  matchday_period?: string;
}

// Store en memoria — solo persiste dentro de la misma instancia de función serverless.
// No usar como fuente de verdad; leer siempre de Supabase para datos fiables.
const manualStore = new Map<string, ManualMatchdayStore>();

export function getManualMatchdayConfig(teamId: string): ManualMatchdayStore | null {
  return manualStore.get(teamId) || null;
}

export function setManualMatchdayConfig(teamId: string, config: ManualMatchdayStore) {
  // Solo actualiza el Map en memoria (en Vercel esto no persiste entre funciones).
  // La persistencia real se hace via Supabase en admin/matchday-config/route.ts.
  manualStore.set(teamId, config);
}

export function getAllManualMatchdayConfigs(): Map<string, ManualMatchdayStore> {
  return manualStore;
}
