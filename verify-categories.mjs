/**
 * Script de verificación del orden de categorías
 * Ejecutar con: node verify-categories.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Cargar variables de entorno desde .env.local
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim();
    }
});

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyCategories() {
    console.log('🔍 Verificando orden de categorías en Supabase...\n');

    const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, order_index, active')
        .eq('active', true)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log('📊 Categorías ordenadas por order_index:\n');

    data.forEach((cat, idx) => {
        console.log(`${idx + 1}. ${cat.name}`);
        console.log(`   Slug: ${cat.slug}`);
        console.log(`   Order Index: ${cat.order_index}`);
        console.log(`   ID: ${cat.id}`);
        console.log('');
    });

    console.log('✅ Total de categorías activas:', data.length);

    // Verificar si hay order_index duplicados o nulos
    const orderIndexes = data.map(c => c.order_index);
    const duplicates = orderIndexes.filter((item, index) => orderIndexes.indexOf(item) !== index);
    const nulls = data.filter(c => c.order_index === null || c.order_index === undefined);

    if (duplicates.length > 0) {
        console.warn('\n⚠️  Hay order_index duplicados:', [...new Set(duplicates)]);
    }

    if (nulls.length > 0) {
        console.warn('\n⚠️  Hay categorías sin order_index:', nulls.map(c => c.name));
    }

    if (duplicates.length === 0 && nulls.length === 0) {
        console.log('\n✅ Todos los order_index son únicos y válidos');
    }
}

verifyCategories();
