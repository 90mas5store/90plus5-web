# 📋 Arquitectura de Ordenamiento de Productos - 90+5 Store

## 🎯 Objetivo
Separar completamente la lógica de ordenamiento entre:
1. **Homepage (Destacados)** → Orden manual/curado (`sort_order`)
2. **Catálogo/Categorías** → Orden alfabético (Equipo A-Z → Producto A-Z)

---

## 🏠 HOMEPAGE - Productos Destacados

### Flujo de Datos
```
Database (sort_order) 
    ↓
getFeaturedServer() [api-server.ts]
    ↓ .order("sort_order", { ascending: true })
    ↓
HomeClient (React Component)
    ↓ .filter() SIN .sort()
    ↓
UI (Orden preservado)
```

### Archivos Involucrados
1. **`src/lib/api-server.ts`** - `getFeaturedServer()`
   - Consulta: `.order("sort_order", { ascending: true })`
   - **NO aplica sort en memoria**
   - Retorna productos en el orden definido en la BD

2. **`src/lib/api.ts`** - `fetchFeaturedFromSupabase()`
   - Consulta: `.order("sort_order", { ascending: true })`
   - **NO aplica sort en memoria**
   - Usado para client-side fetching (si aplica)

3. **`src/components/HomeClient.tsx`** - `destacadosFiltrados`
   - Aplica `.filter()` para liga seleccionada
   - **NO aplica `.sort()`** - preserva orden original
   - El orden que ves es el que viene del servidor

### Cómo Modificar el Orden
1. Ve a tu base de datos Supabase
2. Tabla `products`
3. Modifica el campo `sort_order` (números más bajos aparecen primero)
4. Ejemplo:
   - Real Madrid 1ra: `sort_order = 1`
   - Barcelona 1ra: `sort_order = 2`
   - Real Madrid 2da: `sort_order = 3`

---

## 📂 CATÁLOGO - Todas las Categorías

### Flujo de Datos
```
Database (sin orden específico)
    ↓
getCatalogPaginated() [api.ts]
    ↓ Fetch metadata (id, team, name)
    ↓ .sort() EN MEMORIA (Team A-Z → Product A-Z)
    ↓ Slice IDs para paginación
    ↓ Fetch datos completos
    ↓ Reconstruir orden exacto
    ↓
UI (Orden alfabético estricto)
```

### Archivos Involucrados
1. **`src/lib/api.ts`** - `getCatalogPaginated()`
   - **Paso 1:** Fetch metadata ligera (ID, nombre equipo, nombre producto)
   - **Paso 2:** Sort en memoria:
     ```typescript
     .sort((a, b) => {
       const teamCompare = teamA.localeCompare(teamB);
       if (teamCompare !== 0) return teamCompare;
       return nameA.localeCompare(nameB);
     })
     ```
   - **Paso 3:** Paginar IDs ordenados
   - **Paso 4:** Fetch datos completos
   - **Paso 5:** Reconstruir array en orden exacto

### Resultado Esperado
Los productos siempre aparecen agrupados por equipo (A-Z), luego por nombre de producto (A-Z):
```
- AC Milan - 1ra Equipación
- AC Milan - 2da Equipación
- Arsenal - 1ra Equipación
- Barcelona - 1ra Equipación
- Barcelona - 2da Equipación
- Real Madrid - 1ra Equipación
```

---

## 🔑 Puntos Clave

### ✅ Independencia Total
- **Homepage:** Usa `sort_order` de la BD
- **Catálogo:** Usa sort alfabético en memoria
- **NO se afectan mutuamente**

### ✅ Cache Separado
- Homepage: `featured_v4` (sessionStorage + memoria)
- Catálogo: `_v9_sorted` (Map en memoria, 60s TTL)

### ✅ Validación
Para verificar que funciona:

1. **Homepage:**
   ```sql
   SELECT name, sort_order 
   FROM products 
   WHERE featured = true 
   ORDER BY sort_order;
   ```
   El orden en la UI debe coincidir con `sort_order`

2. **Catálogo:**
   - Ve a `/catalogo`
   - Los productos deben estar agrupados por equipo (A-Z)
   - Dentro de cada equipo, ordenados por nombre (A-Z)

---

## 🐛 Troubleshooting

### "Los destacados se ordenan alfabéticamente"
- ✅ Verifica que `getFeaturedServer()` use `.order("sort_order")`
- ✅ Verifica que `HomeClient` NO aplique `.sort()` en `destacadosFiltrados`
- ✅ Limpia cache: `localStorage.clear()` + `sessionStorage.clear()`

### "El catálogo no está ordenado alfabéticamente"
- ✅ Verifica que `getCatalogPaginated()` aplique el sort en memoria
- ✅ Verifica cache key: debe ser `_v9_sorted`
- ✅ Verifica que `adaptSupabaseProductToProduct` mapee correctamente `teams.name` a `equipo`

### "Cambios no se reflejan"
- ✅ Cache ISR: Espera hasta 1 hora o fuerza rebuild
- ✅ Cache cliente: Limpia sessionStorage
- ✅ Cache servidor: Redeploy en Vercel

---

## 📝 Notas Finales

- **NO modifiques** `fetchFeaturedFromSupabase` para aplicar sort alfabético
- **NO modifiques** `getCatalogPaginated` para usar `sort_order`
- **Mantén** las funciones completamente separadas
- **Cache keys** versionados para forzar refresh cuando cambies lógica
