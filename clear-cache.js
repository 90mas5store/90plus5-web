// Script para limpiar el caché de categorías
// Ejecutar en la consola del navegador

console.log('🧹 Limpiando caché de categorías...');

// Limpiar sessionStorage
if (typeof sessionStorage !== 'undefined') {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
        if (key.includes('config') || key.includes('cache')) {
            sessionStorage.removeItem(key);
            console.log(`✅ Eliminado: ${key}`);
        }
    });
}

// Limpiar localStorage también por si acaso
if (typeof localStorage !== 'undefined') {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.includes('config') || key.includes('cache')) {
            localStorage.removeItem(key);
            console.log(`✅ Eliminado: ${key}`);
        }
    });
}

console.log('✅ Caché limpiado. Recargando página...');
location.reload();
