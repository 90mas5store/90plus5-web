# Directrices y Reglas para Antigravity en 90+5 Store

## Reglas de Redacción y Copy
1. **NO PONER AÑOS DE TEMPORADA EN COPIES NI TÍTULOS**:
   - Queda estrictamente prohibido hardcodear años o rangos de temporada (ej: `2024/25`, `2025/26`, `24/25`, `25/26`) en títulos, subtítulos, banners, héroes, badges, píldoras ni metadatos SEO.
   - En su lugar, usar siempre términos perennes: *"Colección Oficial"*, *"Nueva Colección & Novedades"*, *"Camisetas Oficiales"*, *"Versión Jugador y Aficionado"*.
   - Los años de temporada solo deben mostrarse si provienen de la base de datos de manera dinámica (`product.season`).

## Principios de Diseño
- Estética deportiva de lujo oscura: fondo `#07080a`, acentos en rojo primario, biseles superiores de luz specular (`border-white/10`, `via-white/20`).
- Modularidad estricta: componentes independientes, reutilizables y sin hardcodear datos.
- Filosofía Apple Design: física de resortes, controles táctiles y feedback claro.

## Estándar Homologado de Diseño para el Panel Admin
Para asegurar 100% de coherencia visual en todas las pantallas del admin:
1. **Encabezado de Página (Header)**:
   - Contenedor: `p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4`.
   - Icono: `p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0`.
   - Título: `text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight`.
   - Subtítulo: `text-xs sm:text-sm text-neutral-400 mt-0.5`.
2. **Superficie / Card Contenedor**:
   - `bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent`.
   - Subheader de sección: `flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4`.
3. **Tarjetas KPI**:
   - `bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent`.
   - Título/Etiqueta: `text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between`.
   - Indicador: punto sutil de 2x2 (`w-2 h-2 rounded-full [color]`).
   - Valor: `text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2`.
   - Leyenda: `text-[11px] text-neutral-500 mt-1 truncate`.
4. **Controles Segmentados (Filtros Rápidos)**:
   - Barra: `inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto`.
   - Botón Activo: `bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]`.
   - Botón Inactivo: `text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl transition-all`.
5. **Formularios & Buscadores (Inputs)**:
   - `bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all`.
6. **Badges de Estado**:
   - Sin cajas fluorescentes. Tono sobre tono suave (`bg-[color]/10 text-[color] border border-[color]/20`) con punto de color sutil (`w-1.5 h-1.5 rounded-full [color]`).
7. **Botones de Acción**:
   - Primario: `bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all shadow-sm`.
   - Secundario: `bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs sm:text-sm transition-all`.
   - WhatsApp / Success: `bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-400 border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all`.
