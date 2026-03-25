# 🔍 AUDITORÍA COMPLETA — 90+5 Store
**Fecha:** 24 de Febrero, 2026
**Stack:** Next.js 14 · Tailwind CSS · Supabase · Framer Motion
**Herramientas usadas:** npm audit · ESLint · Análisis manual de código

---

## 🔴 SEGURIDAD — CRÍTICO

### 1. `/api/admin/invite` SIN AUTENTICACIÓN ⚠️ CRÍTICO
**Archivo:** `src/app/api/admin/invite/route.ts`
**Problema:** El endpoint para crear/invitar administradores NO verifica si el usuario que llama está autenticado. Cualquier persona en internet puede hacer un POST a `/api/admin/invite` con un email y crear una cuenta de administrador.
**Impacto:** Escalada de privilegios total. Un atacante puede darse a sí mismo acceso al panel de administración.
**Fix requerido:** Añadir verificación de sesión al inicio del handler.

### 2. Stack trace expuesto en producción ⚠️ CRÍTICO
**Archivo:** `src/app/api/orders/create/route.ts` — línea final del catch
**Código problemático:**
```js
stack: error.stack, // 🔥 DEBUG STACK
```
**Problema:** En producción, cualquier error interno devuelve el stack trace completo al cliente. Esto expone rutas de archivos del servidor, nombres de funciones internas, y facilita la ingeniería inversa del sistema.
**Fix:** Eliminar `stack` del response en producción.

---

## 🟠 SEGURIDAD — ALTO

### 3. Next.js con vulnerabilidades DoS (CVE)
**Versión actual:** `^14.2.35`
**Vulnerabilidades:**
- `GHSA-9g9p-9gw9-jx7f`: DoS via Image Optimizer remotePatterns
- `GHSA-h25m-26qc-wcjf`: HTTP request deserialization DoS (React Server Components)
**Fix:** `npm audit fix --force` instalaría Next.js 16 (breaking change). Evaluar migración.

### 4. Paquete `xlsx` con vulnerabilidades sin parche
**Vulnerabilidades:**
- `GHSA-4r6h-8v6p-xvw6`: Prototype Pollution
- `GHSA-5pgg-2g8v-p4x9`: ReDoS
**Sin fix disponible.** El proyecto ya tiene `exceljs` instalado.
**Fix:** Reemplazar todos los usos de `xlsx` con `exceljs`.

### 5. `minimatch` con ReDoS (3 variantes)
**Severidad:** High — incluye dependencias transitivas de TypeScript ESLint.
**Fix:** `npm audit fix`

### 6. CSP con `unsafe-eval` y `unsafe-inline`
**Archivo:** `next.config.mjs`
**Problema:** El Content-Security-Policy permite `unsafe-eval` y `unsafe-inline` en scripts, lo que anula gran parte de la protección XSS que CSP ofrece.
**Contexto:** Es difícil eliminarlos completamente con Next.js + Partytown, pero se puede mitigar usando nonces CSP.

### 7. Rate limiting solo en memoria (no distribuido)
**Archivo:** `src/middleware.ts`
**Problema:** El rate limit en `ipCache` (Map en memoria) se resetea en cada restart del servidor y no funciona con múltiples instancias (Vercel deployments). Un atacante puede saturar la API cambiando de IP o esperando reinicios.
**Fix:** Usar Upstash Redis o similar para rate limiting distribuido.

---

## 🟡 SEGURIDAD — MEDIO

### 8. Sin validación de longitud/formato en campos de orden
**Archivo:** `src/app/api/orders/create/route.ts`
**Problema:** No hay límite de longitud para `customer_name`, `customer_email`, `customer_phone`, etc. Un payload con strings de millones de caracteres puede degradar el rendimiento.
**Fix:** Añadir validación con máximos: nombre ≤ 100 chars, email ≤ 254 chars, teléfono ≤ 20 chars.

### 9. `dangerouslyAllowSVG: true` en imagen config
**Archivo:** `next.config.mjs`
**Contexto:** Mitigado parcialmente con `contentDispositionType: 'attachment'`. Pero SVGs externos pueden contener scripts si se renderizan directamente en el browser.

---

## 🔵 SEO — MEDIO

### 10. Metadata del catálogo demasiado genérica
**Archivo:** `src/app/catalogo/page.tsx`
**Problema:** Título: `"Catálogo"` y descripción: `"Explora nuestra colección..."` son muy débiles para SEO. No incluyen keywords de fútbol, Honduras, ni el nombre de la marca.
**Fix Sugerido:**
```ts
title: "Catálogo de Camisetas de Fútbol | 90+5 Store Honduras"
description: "Explora más de 100 camisetas versión jugador y aficionado: Real Madrid, Barcelona, Olimpia, Motagua y más. Envíos a todo Honduras."
```

### 11. Canonical URL global apuntando a "/"
**Archivo:** `src/app/layout.tsx`
**Problema:** `alternates: { canonical: "/" }` en el layout global significa que todas las páginas declaran como URL canónica la raíz `/`. Google puede interpretar esto como contenido duplicado.
**Fix:** Eliminar el canonical global y definirlo página por página con la URL específica.

### 12. `force-dynamic` y `revalidate` en conflicto (sitemap)
**Archivo:** `src/app/sitemap.ts`
**Problema:** `export const dynamic = 'force-dynamic'` evita todo cacheo, pero `export const revalidate = 3600` pide cacheo de 1h. Son mutuamente excluyentes. `force-dynamic` gana y el sitemap se regenera en cada request.
**Fix:** Eliminar `force-dynamic`, mantener solo `revalidate = 3600`.

### 13. PWA Manifest con íconos SVG (no PNG)
**Archivo:** `public/manifest.json`
**Problema:** Los íconos declaran `type: "image/svg+xml"`. La especificación PWA requiere PNG para la instalación en Android/Chrome. Sin íconos PNG el "Add to Home Screen" no funciona correctamente.
**Fix:** Generar `logo-192.png` y `logo-512.png` y actualizar el manifest.

---

## 🔵 UX/UI — MEDIO

### 14. Splash screen bloquea contenido 1.8 segundos
**Archivo:** `src/app/ClientLayout.tsx`
**Problema:** El loader de entrada bloquea todo el contenido (children, WhatsApp button) durante 1800ms en la primera visita. Para usuarios en móviles lentos esto se suma al tiempo de carga, empeorando la percepción de velocidad.
**Sugerencia:** Reducir a 1000ms o hacerlo overlay sin bloquear el DOM.

### 15. Formulario de checkout sin validación en tiempo real
**Archivo:** `src/app/checkout/page.tsx`
**Problema:** Los errores de validación solo aparecen al intentar enviar el formulario. El usuario no sabe que su email o teléfono tienen formato incorrecto hasta el final.
**Fix:** Validar `onBlur` (al salir del campo) y mostrar feedback inline.

### 16. `<img>` nativo en página de perfil
**Archivo:** `src/app/perfil/page.jsx` — línea 62
**Problema:** El avatar del usuario usa `<img src={usuario.avatar}>` en lugar de `<Image>` de Next.js. Esto impide optimización automática (WebP, AVIF, lazy loading), afecta LCP.
**Fix:** Migrar a `<Image>` con `width`, `height`, y `alt`.

### 17. Modo oscuro forzado, sin respeto a preferencias del sistema
**Archivo:** `tailwind.config.js` — `darkMode: "class"` siempre activo
**Problema:** El sitio está siempre en dark mode. Usuarios con preferencia de sistema `prefers-color-scheme: light` no tienen opción de cambio.
**Impacto:** UX menor, pero puede ser un punto de fricción para algunos usuarios.

---

## ✅ LO QUE ESTÁ BIEN HECHO

### Seguridad ✓
- `getUser()` en lugar de `getSession()` en middleware (correcto para seguridad server-side)
- Honeypot field en formulario de órdenes
- Precios calculados en el servidor (nunca se confía en el precio del frontend)
- `poweredByHeader: false` para ocultar tecnología
- Headers de seguridad completos: HSTS, X-Frame-Options, X-Content-Type-Options
- Validación de productos/variantes contra DB antes de crear orden
- UUID regex para legacy redirects (previene path traversal)

### SEO ✓
- Metadata rica en layout global con OG tags, Twitter Cards, verificación Google
- Sitemap dinámico con productos reales
- robots.txt bien configurado
- JSON-LD (Schema.org Product) en páginas de producto
- Metadata dinámica por producto con `generateMetadata`
- `metadataBase` configurado correctamente

### Performance ✓
- ISR con `revalidate: 3600` en homepage
- LazyMotion + dynamic imports para Framer Motion
- Service Worker con Network-First para HTML
- Preconnect a Supabase, Cloudinary, Imgur
- AVIF + WebP en Next.js Image
- `removeConsole` en producción
- Partytown para analytics off-thread

### Responsive Design ✓
- Tailwind mobile-first en todo el proyecto
- Footer con acordeón en móvil
- Breakpoints `sm:`, `md:`, `lg:` usados consistentemente
- Menú hamburguesa en header móvil
- Grid responsive en catálogo y checkout

### UX ✓
- Skeleton loaders en catálogo y productos
- Toast notifications con diseño on-brand
- WhatsApp button flotante para soporte
- Transiciones y animaciones con `prefersReducedMotion`
- Splash screen en primera visita (solo 1 vez via sessionStorage)
- Rastreo de orden pública para clientes

---

## 📊 RESUMEN DE VULNERABILIDADES npm audit

| Severidad | Cantidad | Paquetes |
|-----------|----------|----------|
| 🔴 High | 3 | `next`, `xlsx`, `minimatch` |
| 🟡 Moderate | 1 | `ajv` |
| **Total** | **4** | |

---

## 📋 ERRORES ESLint

| Tipo | Cantidad |
|------|----------|
| Errores (errors) | 19 |
| Advertencias (warnings) | 26 |
| **Total** | **45** |

**Errores principales:**
- `setState` síncrono dentro de `useEffect` (x2): ClientLayout.tsx, useOptimization.ts
- Múltiples `useEffect` con dependencias faltantes en páginas admin

---

## 🛠️ PLAN DE ACCIÓN PRIORITARIO

### Prioridad 1 — INMEDIATA (seguridad crítica)
1. **Proteger `/api/admin/invite`** con auth check
2. **Eliminar `stack: error.stack`** del response de producción en orders API

### Prioridad 2 — ESTA SEMANA (seguridad alta)
3. Reemplazar `xlsx` por `exceljs` (ya instalado)
4. Añadir validación de longitud en campos de orden
5. Ejecutar `npm audit fix` para minimatch/ajv

### Prioridad 3 — PRÓXIMAS 2 SEMANAS (SEO y UX)
6. Mejorar metadata del catálogo
7. Eliminar canonical global, añadir por página
8. Arreglar conflicto `force-dynamic` vs `revalidate` en sitemap
9. Generar íconos PNG para manifest PWA
10. Migrar `<img>` en perfil a `<Image>`
11. Añadir validación `onBlur` en checkout

### Prioridad 4 — MANTENIMIENTO (código)
12. Corregir dependencias faltantes en useEffect (admin pages)
13. Corregir `setState` en effects (ClientLayout, useOptimization)
