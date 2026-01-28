// Stress Test AGRESIVO para 90+5 Store
// Simula tráfico de Black Friday / Lanzamiento viral

import { writeFileSync } from 'fs';

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_REQUESTS = 100;
const TOTAL_ROUNDS = 5;

let logOutput = '';

function log(message) {
    console.log(message);
    logOutput += message + '\n';
}

async function measureRequest(url) {
    const start = performance.now();
    try {
        const res = await fetch(url);
        const end = performance.now();
        return {
            success: res.ok,
            status: res.status,
            time: end - start
        };
    } catch (e) {
        return { success: false, error: e.message, time: 0 };
    }
}

async function runRound(roundNumber) {
    log(`\n🔥 RONDA ${roundNumber}: Lanzando ${CONCURRENT_REQUESTS} peticiones simultáneas...`);

    const promises = Array(CONCURRENT_REQUESTS).fill(null).map(() => measureRequest(BASE_URL));

    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    const avgTime = results.reduce((acc, r) => acc + r.time, 0) / results.length;
    const maxTime = Math.max(...results.map(r => r.time));
    const minTime = Math.min(...results.map(r => r.time));

    const sortedTimes = results.map(r => r.time).sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    log(`✅ Éxitos: ${successCount}/${CONCURRENT_REQUESTS} (${(successCount / CONCURRENT_REQUESTS * 100).toFixed(1)}%)`);
    log(`❌ Fallos: ${failCount}`);
    log(`⏱️  Promedio: ${avgTime.toFixed(2)}ms`);
    log(`📊 P50 (mediana): ${p50.toFixed(2)}ms`);
    log(`📊 P95: ${p95.toFixed(2)}ms`);
    log(`📊 P99: ${p99.toFixed(2)}ms`);
    log(`🚀 Más rápida: ${minTime.toFixed(2)}ms`);
    log(`🐢 Más lenta: ${maxTime.toFixed(2)}ms`);

    if (successCount === CONCURRENT_REQUESTS && avgTime < 300) {
        log(`✨ ESTATUS: EXCELENTE - Servidor aguanta tráfico viral sin problemas`);
    } else if (successCount === CONCURRENT_REQUESTS && avgTime < 500) {
        log(`⚠️  ESTATUS: BUENO - Sin errores, latencia aceptable bajo carga`);
    } else if (successCount >= CONCURRENT_REQUESTS * 0.95) {
        log(`🟡 ESTATUS: ACEPTABLE - Algunas peticiones fallaron pero mayoría OK`);
    } else {
        log(`🚨 ESTATUS: CRÍTICO - Servidor sobrecargado, muchos errores`);
    }

    return { avgTime, p95, successCount };
}

async function main() {
    log("🏎️  STRESS TEST AGRESIVO - 90+5 STORE");
    log("=====================================");
    log(`📈 Configuración: ${CONCURRENT_REQUESTS} peticiones simultáneas x ${TOTAL_ROUNDS} rondas`);
    log(`🎯 Total de peticiones: ${CONCURRENT_REQUESTS * TOTAL_ROUNDS}`);
    log("");

    log("🔥 Calentando servidor...");
    await measureRequest(BASE_URL);
    await new Promise(r => setTimeout(r, 500));

    const roundResults = [];

    for (let i = 1; i <= TOTAL_ROUNDS; i++) {
        const result = await runRound(i);
        roundResults.push(result);
        await new Promise(r => setTimeout(r, 1500));
    }

    log("\n🏁 STRESS TEST COMPLETADO");
    log("=====================================");
    log(`✅ Total de peticiones procesadas: ${CONCURRENT_REQUESTS * TOTAL_ROUNDS}`);

    const totalAvg = roundResults.reduce((acc, r) => acc + r.avgTime, 0) / roundResults.length;
    const totalP95 = roundResults.reduce((acc, r) => acc + r.p95, 0) / roundResults.length;
    const totalSuccess = roundResults.reduce((acc, r) => acc + r.successCount, 0);

    log(`\n📊 RESUMEN GENERAL:`);
    log(`   Promedio global: ${totalAvg.toFixed(2)}ms`);
    log(`   P95 global: ${totalP95.toFixed(2)}ms`);
    log(`   Tasa de éxito: ${(totalSuccess / (CONCURRENT_REQUESTS * TOTAL_ROUNDS) * 100).toFixed(2)}%`);

    // Guardar resultados
    writeFileSync('stress_test_results.txt', logOutput);
    log('\n💾 Resultados guardados en: stress_test_results.txt');
}

main();
