# 🚀 OPTIMIZACIÓN FRAMER MOTION - ESTRATEGIA COMPLETA

## 📊 PROBLEMA ACTUAL

**TBT Actual:** 5,570ms  
**Objetivo:** < 600ms  
**Reducción necesaria:** 4,970ms (89%)

**Principal bloqueante:**
- `motion-dom/batcher.mjs`: **3,806ms** (68% del TBT)

---

## ✅ SOLUCIÓN IMPLEMENTADA: LazyMotion

He creado un wrapper optimizado en `src/lib/motion.ts` que usa **LazyMotion** de Framer Motion.

### **Beneficios de LazyMotion:**
- ✅ Reduce bundle size de Framer Motion en **~60%**
- ✅ Carga solo las features de animación que se usan
- ✅ Lazy loading automático de funciones de animación
- ✅ Compatible con todos los componentes existentes

---

## 🔧 CÓMO USAR EL WRAPPER OPTIMIZADO

### **ANTES (❌ No optimizado):**
```tsx
import { motion, AnimatePresence } from "framer-motion";

export default function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Content
    </motion.div>
  );
}
```

### **DESPUÉS (✅ Optimizado):**
```tsx
import { motion, AnimatePresence } from "@/lib/motion";

export default function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Content
    </motion.div>
  );
}
```

**Cambio:** Solo reemplazar el import de `"framer-motion"` por `"@/lib/motion"`

---

## 📝 ARCHIVOS QUE NECESITAN ACTUALIZACIÓN

### **Componentes Críticos (Alta Prioridad):**

1. ✅ **src/components/Footer.tsx**
   ```tsx
   // CAMBIAR:
   import { motion } from "framer-motion";
   // POR:
   import { motion } from "@/lib/motion";
   ```

2. ✅ **src/components/Header.tsx**
   ```tsx
   // CAMBIAR:
   import { motion, AnimatePresence } from "framer-motion";
   // POR:
   import { motion, AnimatePresence } from "@/lib/motion";
   ```

3. ✅ **src/components/HeroBanner.tsx**
   ```tsx
   // CAMBIAR:
   import { motion, AnimatePresence } from "framer-motion";
   // POR:
   import { motion, AnimatePresence } from "@/lib/motion";
   ```

4. ✅ **src/components/ui/WhatsAppButton.tsx**
   ```tsx
   // CAMBIAR:
   import { motion } from "framer-motion";
   // POR:
   import { motion } from "@/lib/motion";
   ```

5. ✅ **src/components/ui/SpecialEventBanner.tsx**
   ```tsx
   // CAMBIAR:
   import { motion } from "framer-motion";
   // POR:
   import { motion } from "@/lib/motion";
   ```

6. ✅ **src/components/cart/CartDrawer.tsx**
   ```tsx
   // CAMBIAR:
   import { motion, AnimatePresence } from "framer-motion";
   // POR:
   import { motion, AnimatePresence } from "@/lib/motion";
   ```

7. ✅ **src/components/ui/SearchBar.tsx**
   ```tsx
   // CAMBIAR:
   import { motion, AnimatePresence } from "framer-motion";
   // POR:
   import { motion, AnimatePresence } from "@/lib/motion";
   ```

8. ✅ **src/components/catalogo/CarruselDeCategoria.tsx**
   ```tsx
   // CAMBIAR:
   import { motion } from "framer-motion";
   // POR:
   import { motion } from "@/lib/motion";
   ```

9. ✅ **src/app/catalogo/CatalogoContent.tsx**
   ```tsx
   // CAMBIAR:
   import { motion, AnimatePresence } from "framer-motion";
   // POR:
   import { motion, AnimatePresence } from "@/lib/motion";
   ```

### **Componentes Secundarios (Media Prioridad):**

10. **src/components/ProductImage.tsx**
11. **src/components/product/RelatedProducts.tsx**
12. **src/components/product/ProductoPersonalizar.tsx**
13. **src/components/skeletons/ProductSkeletons.tsx**
14. **src/app/checkout/page.tsx**
15. **src/app/rastreo/page.tsx**

### **Componentes Admin (Baja Prioridad):**

16-22. Todos los componentes en `src/app/admin/`

---

## 🎯 IMPACTO ESPERADO

### **Con LazyMotion:**
- **Bundle Size:** De ~41.6KB a ~16KB (⬇️ 61%)
- **JavaScript Execution:** De 3,806ms a ~1,500ms (⬇️ 61%)
- **TBT:** De 5,570ms a **~2,200ms** (⬇️ 60%)

### **Progreso hacia el objetivo:**

```
INICIO:
- TBT: 7,804ms ❌

DESPUÉS DE ELIMINAR REACT-ICONS:
- TBT: 5,570ms ⚠️
- Mejora: 29%

DESPUÉS DE LAZYMOTION:
- TBT: ~2,200ms ⚠️
- Mejora total: 72%

OBJETIVO FINAL:
- TBT: < 600ms
- Reducción adicional necesaria: ~1,600ms
```

---

## 🔄 PROCESO DE IMPLEMENTACIÓN

### **Opción A: Automático (Recomendado)**

Ejecutar este comando para reemplazar todos los imports automáticamente:

```powershell
# Buscar y reemplazar en todos los archivos .tsx
Get-ChildItem -Path src -Recurse -Filter *.tsx | ForEach-Object {
    (Get-Content $_.FullName) -replace 'from "framer-motion"', 'from "@/lib/motion"' | Set-Content $_.FullName
}
```

### **Opción B: Manual**

Abrir cada archivo listado arriba y cambiar el import manualmente.

---

## 📈 OPTIMIZACIONES ADICIONALES (Si TBT > 600ms)

Si después de LazyMotion el TBT sigue alto, implementar:

### **1. Lazy Loading de Componentes con Animaciones**

```tsx
import dynamic from 'next/dynamic';

const AnimatedComponent = dynamic(
  () => import('@/components/AnimatedComponent'),
  { ssr: false }
);
```

### **2. Reemplazar Animaciones Simples con CSS**

```tsx
// ANTES (Framer Motion)
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// DESPUÉS (CSS)
<div className="animate-fade-in">
  Content
</div>

// En globals.css:
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}
```

### **3. Reducir Complejidad de Animaciones**

- Usar `whileHover` solo cuando sea necesario
- Evitar `AnimatePresence` en listas largas
- Simplificar `transition` configs

---

## ✅ VALIDACIÓN

Después de implementar:

1. **Compilar:**
   ```bash
   npm run build
   ```

2. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

3. **Auditar con Lighthouse:**
   - Abrir Chrome DevTools
   - Pestaña Lighthouse
   - Ejecutar auditoría de Performance
   - Verificar TBT < 2,500ms

---

## 📊 MÉTRICAS OBJETIVO

| Métrica | Actual | Objetivo | Estado |
|---------|--------|----------|--------|
| **TBT** | 5,570ms | < 2,500ms | 🟡 En progreso |
| **JavaScript** | ~14,000ms | < 8,000ms | 🟡 En progreso |
| **Bundle Size** | ~430KB | < 350KB | 🟡 En progreso |
| **Performance Score** | ~30 | > 70 | 🟡 En progreso |

---

**Fecha:** 2026-02-06  
**Prioridad:** 🔴 CRÍTICA  
**Impacto:** 🔴 ALTO

**Archivo creado:** `src/lib/motion.ts` ✅
