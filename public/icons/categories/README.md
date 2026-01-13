# 📂 Iconos de Categorías

Esta carpeta contiene los iconos para las categorías del menú principal.

## 📋 Instrucciones

### 1. **Formato de Archivos**
- **Recomendado**: SVG (mejor calidad, escalable)
- **Alternativo**: PNG (mínimo 128x128px)

### 2. **Nomenclatura**
Nombra tus archivos de forma descriptiva:
- `camisetas.svg`
- `entrenamiento.svg`
- `accesorios.svg`
- etc.

### 3. **Configuración en Supabase**

#### Agregar la columna `icon_url` a la tabla `categories`:

```sql
-- Agregar columna icon_url a la tabla categories
ALTER TABLE categories 
ADD COLUMN icon_url TEXT;

-- Ejemplo de actualización para una categoría
UPDATE categories 
SET icon_url = '/icons/categories/camisetas.svg'
WHERE slug = 'camisetas';
```

### 4. **Estructura de Rutas**

Los iconos se cargan desde la ruta pública:
```
/icons/categories/nombre-del-icono.svg
```

Ejemplo en Supabase:
```
icon_url: /icons/categories/camisetas.svg
```

### 5. **Iconos de Ejemplo**

Si no tienes un icono para una categoría, el sistema mostrará un ícono de **Sparkles** (✨) por defecto.

### 6. **Optimización**

Para SVG, asegúrate de:
- Usar colores que se vean bien con el tema oscuro
- Mantener el tamaño del archivo pequeño (< 10KB)
- Usar `viewBox` para escalabilidad

### 7. **Ejemplo de SVG Optimizado**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="..." />
</svg>
```

---

## 🎨 Recomendaciones de Diseño

- **Estilo**: Minimalista, line-art
- **Colores**: Blanco/gris claro o usa `currentColor` para heredar
- **Tamaño**: 24x24px (viewBox)
- **Grosor de línea**: 2px para consistencia

---

## ✅ Checklist

- [ ] Crear iconos SVG para cada categoría
- [ ] Colocar archivos en `public/icons/categories/`
- [ ] Agregar columna `icon_url` en Supabase
- [ ] Actualizar cada categoría con su ruta de icono
- [ ] Verificar que los iconos se vean bien en el mega menú
