import fs from 'fs';
import path from 'path';

export interface ManualMatchdayStore {
  is_matchday_active: boolean;
  matchday_opponent?: string;
  matchday_score?: string;
  matchday_period?: string;
}

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'matchday_manual.json');
const manualStore = new Map<string, ManualMatchdayStore>();

function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      for (const [key, val] of Object.entries(obj)) {
        manualStore.set(key, val as ManualMatchdayStore);
      }
    }
  } catch (e) {
    console.warn('[matchdayStore] Error reading file:', e);
  }
}

function saveToFile() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj = Object.fromEntries(manualStore.entries());
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {
    // Silencioso en Vercel (read-only filesystem)
  }
}

// Cargar al inicializar el módulo
loadFromFile();

export function getManualMatchdayConfig(teamId: string): ManualMatchdayStore | null {
  if (manualStore.size === 0) {
    loadFromFile();
  }
  return manualStore.get(teamId) || null;
}

export function setManualMatchdayConfig(teamId: string, config: ManualMatchdayStore) {
  manualStore.set(teamId, config);
  saveToFile();
}

export function getAllManualMatchdayConfigs(): Map<string, ManualMatchdayStore> {
  if (manualStore.size === 0) {
    loadFromFile();
  }
  return manualStore;
}
