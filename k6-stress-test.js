import http from 'k6/http';
import { check, sleep } from 'k6';

// 🚀 BREAKPOINT STRESS TEST (Hasta 500 Usuarios Concurrentes)
export const options = {
  stages: [
    { duration: '20s', target: 30 },   // Fase 1: Carga inicial (30 VUs)
    { duration: '30s', target: 100 },  // Fase 2: Carga moderada (100 VUs)
    { duration: '40s', target: 250 },  // Fase 3: Carga pesada (250 VUs)
    { duration: '40s', target: 500 },  // Fase 4: Estrés extremo / Punto de quiebre (500 VUs)
    { duration: '20s', target: 0 },    // Fase 5: Enfriamiento y recuperación
  ],
  thresholds: {
    // 95% de las peticiones deben responder en menos de 2000ms
    http_req_duration: ['p(95)<2000'],
    // Menos del 5% de errores HTTP
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. Home Page (SSR / Static Cache)
  const resHome = http.get(`${BASE_URL}/`, {
    tags: { name: 'Home' },
  });
  check(resHome, {
    'Home 200': (r) => r.status === 200,
  });
  sleep(0.5);

  // 2. Catálogo (SSR con consultas de productos)
  const resCatalog = http.get(`${BASE_URL}/catalogo`, {
    tags: { name: 'Catalogo' },
  });
  check(resCatalog, {
    'Catalogo 200': (r) => r.status === 200,
  });
  sleep(0.5);

  // 3. API de partidos en vivo (Cache en memoria / Edge)
  const resApi = http.get(`${BASE_URL}/api/live-matches`, {
    tags: { name: 'API_LiveMatches' },
  });
  check(resApi, {
    'API 200': (r) => r.status === 200,
  });
  sleep(1);
}
