# 🚀 90+5 Store - Production Hardening Checklist

## ✅ Cambios Realizados

### 1. `next.config.mjs` - Configuración Modernizada
- ✅ Migrado de `images.domains` (deprecated) a `images.remotePatterns`
- ✅ Añadidos headers de seguridad (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- ✅ Deshabilitado header "X-Powered-By: Next.js"
- ✅ Configurado `removeConsole` para eliminar console.log en producción

### 2. Arquitectura Supabase - Buenas Prácticas
Nuevos archivos centralizados en `src/lib/supabase/`:
- ✅ `client.ts` - Cliente para componentes del navegador (singleton)
- ✅ `server.ts` - Cliente para Server Components y Route Handlers (async)
- ✅ `middleware.ts` - Cliente para middleware de Next.js
- ✅ `index.ts` - Documentación y re-exports

### 3. Eliminación de Fugas de Credenciales
- ✅ Eliminado `console.log("Supabase conectado:", supabase)` en `api.ts`
- ✅ Eliminados console.log de desarrollo en route handlers
- ✅ Eliminados console.log del carrito en producción
- ✅ Cambiado a console.warn para Service Worker failures

### 4. Archivos Eliminados (Deprecated)
- ❌ `src/lib/supabaseClient.ts`
- ❌ `src/lib/supabaseServer.ts`
- ❌ `src/lib/supabaseBrowser.ts`
- ❌ `src/lib/supabaseMiddleware.ts`

### 5. Dependencias Actualizadas
- ✅ `baseline-browser-mapping` actualizado

---

## 🔧 Configuración para Vercel

### Variables de Entorno Requeridas
En tu dashboard de Vercel, asegúrate de configurar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Configuración Recomendada de Build
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev"
}
```

---

## 📋 Recomendaciones Adicionales para Producción

### 1. 🔐 Seguridad de Supabase
- [ ] Habilitar Row Level Security (RLS) en todas las tablas
- [ ] Crear políticas específicas para cada operación (SELECT, INSERT, UPDATE, DELETE)
- [ ] Nunca exponer `service_role` key en el cliente
- [ ] Revisar y restringir los permisos de la `anon` key

### 2. 🛡️ Headers de Seguridad Adicionales
Considera añadir en `next.config.mjs`:
```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; img-src 'self' https://i.imgur.com https://res.cloudinary.com; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
},
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains'
}
```

### 3. 📊 Monitoreo y Logging
- [ ] Configurar Vercel Analytics
- [ ] Implementar logging estructurado (ej: Axiom, LogRocket)
- [ ] Configurar alertas para errores críticos
- [ ] Monitorear performance con Web Vitals

### 4. 🚀 Optimización de Performance
- [ ] Habilitar Incremental Static Regeneration (ISR) donde sea apropiado
- [ ] Implementar caching de datos de Supabase
- [ ] Optimizar imágenes con `next/image`
- [ ] Revisar Core Web Vitals

### 5. 🔍 SEO y Accesibilidad
- [ ] Verificar meta tags en todas las páginas
- [ ] Implementar sitemap.xml
- [ ] Configurar robots.txt
- [ ] Revisar accesibilidad (WCAG 2.1)

### 6. 🧪 Testing antes de Deploy
- [ ] Ejecutar `npm run build` localmente
- [ ] Verificar todas las rutas funcionan
- [ ] Probar flujo de checkout completo
- [ ] Verificar autenticación admin

### 7. 📝 Checklist Pre-Deploy
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio personalizado configurado
- [ ] SSL/HTTPS habilitado
- [ ] Redirecciones wwww → non-www (o viceversa)
- [ ] Páginas de error (404, 500) personalizadas

---

## 🎯 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar build localmente
npm run start

# Linting
npm run lint
```

---

## 📁 Estructura Final de Supabase

```
src/lib/supabase/
├── client.ts      # Para Client Components ("use client")
├── server.ts      # Para Server Components, Route Handlers, Server Actions
├── middleware.ts  # Para middleware.ts
└── index.ts       # Documentación y re-exports
```

### Uso Correcto:

**Client Components:**
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

**Server Components / Route Handlers:**
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
```

**Middleware:**
```typescript
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(req: NextRequest) {
  const { supabase, response } = await createClient(req)
  // ...
  return response
}
```

---

¡Tu proyecto está listo para producción! 🎉
