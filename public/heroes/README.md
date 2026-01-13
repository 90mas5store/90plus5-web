# 🏟️ Heroes Personalizables - 90+5 Store

Esta carpeta contiene las imágenes y videos personalizados para los banners Hero de cada página/categoría.

---

## 📐 Especificaciones por Sección

### 🏠 **Hero de Home (Página Principal)**
| Propiedad | Valor |
|-----------|-------|
| Archivo | `home.jpg` o `home.mp4` |
| Altura visible | **45vh** (~45% de la pantalla) |
| Dimensiones recomendadas | **1920 x 864 px** |
| Proporción (aspect ratio) | **20:9** (ultra ancho) |
| Formato imagen | JPG, PNG, WebP |
| Formato video | MP4, WebM |
| Tamaño máximo archivo | < 2MB (imagen), < 5MB (video) |

**Nota:** Este hero es más alto porque es la primera impresión del usuario.

---

### 📦 **Hero de Catálogo y Categorías**
| Propiedad | Valor |
|-----------|-------|
| Archivos | `catalogo.jpg`, `futbol.jpg`, `mundial.jpg`, etc. |
| Altura visible | **30vh** (~30% de la pantalla) |
| Dimensiones recomendadas | **1920 x 576 px** |
| Proporción (aspect ratio) | **10:3** (extra ancho) |
| Formato imagen | JPG, PNG, WebP |
| Formato video | MP4, WebM |
| Tamaño máximo archivo | < 1.5MB (imagen), < 4MB (video) |

**Nota:** Estos heroes son más cortos para dar más espacio al contenido del catálogo.

---

## 📂 Estructura de Archivos

```
public/heroes/
├── README.md           # Este archivo
│
├── home.jpg            # 🏠 Hero de la página principal (45vh)
│                       #    Tamaño: 1920x864px, Ratio: 20:9
│
├── catalogo.jpg        # 📦 Hero del catálogo general (30vh)
│                       #    Tamaño: 1920x576px, Ratio: 10:3
│
├── futbol.jpg          # ⚽ Hero de categoría Fútbol
├── mundial.jpg         # 🏆 Hero de categoría Mundial
├── formula1.jpg        # 🏎️ Hero de categoría Formula 1
├── retro.jpg           # 👕 Hero de categoría Retro
└── [categoria].jpg     # Cualquier otra categoría (usar el slug)
```

---

## 🎨 Formatos Soportados

### Imágenes
| Formato | Uso recomendado | Compresión |
|---------|-----------------|------------|
| `.jpg` | Fotografías, fondos complejos | Lossy, 80-85% calidad |
| `.png` | Imágenes con transparencia | Lossless |
| `.webp` | Óptimo para web | Mejor compresión |

### Videos
| Formato | Compatibilidad | Compresión |
|---------|----------------|------------|
| `.mp4` | Universal (H.264) | Excelente |
| `.webm` | Navegadores modernos (VP9) | Mejor compresión |

---

## 📏 Guía Visual de Proporciones

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    HERO HOME (45vh)                      │
│                    1920 x 864 px                         │
│                    Ratio 20:9                            │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                 HERO CATÁLOGO (30vh)                     │
│                 1920 x 576 px                            │
│                 Ratio 10:3                               │
└──────────────────────────────────────────────────────────┘
```

### Resoluciones Alternativas (manteniendo proporción)

**Para Home (20:9):**
| Resolución | Uso |
|------------|-----|
| 1920 x 864 | Estándar (1080p) |
| 2560 x 1152 | Alta (1440p) |
| 3840 x 1728 | Ultra (4K) |
| 1280 x 576 | Baja resolución |

**Para Catálogo/Categorías (10:3):**
| Resolución | Uso |
|------------|-----|
| 1920 x 576 | Estándar (1080p) |
| 2560 x 768 | Alta (1440p) |
| 3840 x 1152 | Ultra (4K) |
| 1280 x 384 | Baja resolución |

---

## ⚙️ Cómo Personalizar

1. **Prepara tu imagen/video** con las dimensiones correctas según la sección
2. **Nombra el archivo** según el slug de la categoría (en minúsculas, sin espacios)
3. **Coloca el archivo** en esta carpeta (`public/heroes/`)
4. **Recarga la página** para ver los cambios

### Mapeo de Categorías a Archivos:

| Página/Categoría | Slug | Archivo requerido |
|------------------|------|-------------------|
| Página Principal | `home` | `home.jpg` (o `.mp4`) |
| Catálogo General | `catalogo` | `catalogo.jpg` |
| Fútbol | `futbol` | `futbol.jpg` |
| Copas Mundiales | `mundial` | `mundial.jpg` |
| Fórmula 1 | `formula1` | `formula1.jpg` |
| Jerseys Retro | `retro` | `retro.jpg` |

---

## 🎬 Especificaciones para Video

Para usar video en lugar de imagen:

### Requisitos:
- **Duración**: 5-15 segundos (ideal para loop)
- **Sin audio**: El video se silencia automáticamente
- **Loop-able**: El final debe conectar suavemente con el inicio
- **Codec**: H.264 (MP4) o VP9 (WebM)
- **Framerate**: 24-30 fps
- **Bitrate**: 2-4 Mbps

### Resoluciones para Video:

**Home (45vh):**
```
1920x864 @ 24fps, 3Mbps
```

**Catálogo (30vh):**
```
1920x576 @ 24fps, 2.5Mbps
```

---

## 🔧 Herramientas de Optimización

### Para Imágenes:
- **Squoosh** (https://squoosh.app) - Compresión online
- **TinyPNG** (https://tinypng.com) - Compresión PNG/JPG
- **Photoshop** - Exportar como "Guardar para Web"

### Para Videos:
- **HandBrake** - Optimización de video gratuita
- **FFmpeg** - Herramienta de línea de comandos

### Comandos FFmpeg:

**Convertir video para Hero Home:**
```bash
ffmpeg -i input.mp4 -vf "scale=1920:864,fps=24" -c:v libx264 -preset slow -crf 23 -an home.mp4
```

**Convertir video para Hero Catálogo:**
```bash
ffmpeg -i input.mp4 -vf "scale=1920:576,fps=24" -c:v libx264 -preset slow -crf 23 -an catalogo.mp4
```

**Crear WebM (mejor compresión):**
```bash
ffmpeg -i input.mp4 -vf "scale=1920:576,fps=24" -c:v libvpx-vp9 -crf 30 -b:v 0 -an output.webm
```

---

## 📱 Comportamiento Responsive

El componente HeroBanner automáticamente:

| Dispositivo | Comportamiento |
|-------------|----------------|
| Desktop (>1024px) | Muestra imagen completa con `object-cover` |
| Tablet (768-1024px) | Ajusta altura proporcionalmente |
| Mobile (<768px) | Centra el contenido, mantiene proporción |

**Tip:** Asegúrate de que el contenido importante esté centrado en la imagen, ya que los bordes pueden recortarse en dispositivos móviles.

---

## ❌ Fallback

Si no existe un archivo para una categoría específica:
1. El sistema intentará cargar `/heroes/[slug].jpg`
2. Si falla, usará la imagen por defecto: `/fondo.jpg`

---

## 📝 Checklist antes de subir

- [ ] Dimensiones correctas según la sección
- [ ] Proporción de aspecto correcta (20:9 o 10:3)
- [ ] Archivo optimizado (< 2MB)
- [ ] Nombre del archivo en minúsculas
- [ ] Nombre coincide con el slug de la categoría
- [ ] Contenido importante centrado
- [ ] Probado en móvil y desktop

---

## ✨ Funcionalidades Premium del HeroBanner

El componente `HeroBanner` incluye las siguientes funcionalidades avanzadas:

### 🌀 **Efecto Parallax**
El fondo se mueve sutilmente cuando el usuario hace scroll, creando una sensación de profundidad 3D.

```jsx
<HeroBanner
  categorySlug="futbol"
  enableParallax={true}      // Activar parallax
  parallaxIntensity={0.3}    // Intensidad (0-1)
/>
```

### ⏳ **Skeleton Loader**
Mientras la imagen carga, se muestra un loader animado elegante con efecto de shimmer.

### 🎠 **Carrusel/Slideshow**
Múltiples imágenes que rotan automáticamente. Ideal para promociones.

```jsx
<HeroBanner
  slides={[
    { imageSrc: "/heroes/promo1.jpg", title: "Nueva Temporada", subtitle: "50% OFF" },
    { imageSrc: "/heroes/promo2.jpg", title: "Champions", subtitle: "Llegaron las nuevas" },
    { imageSrc: "/heroes/promo3.jpg" },
  ]}
  slideInterval={5000}  // 5 segundos por slide
/>
```

### 🔄 **Transiciones Suaves**
Las imágenes cambian con un efecto de fade/scale cinematográfico.

### 🚀 **Preload Inteligente**
Pre-carga automáticamente las imágenes de categorías adyacentes para transiciones instantáneas.

```jsx
<HeroBanner
  categorySlug="futbol"
  adjacentCategories={["mundial", "formula1", "retro"]}  // Pre-cargar estas
/>
```

### 📝 **Overlay de Texto Opcional**
Muestra título y subtítulo sobre el hero para promociones especiales.

```jsx
<HeroBanner
  categorySlug="home"
  title="90+5 STORE"
  subtitle="Donde el fútbol no termina en el 90"
/>
```

### 📊 **Barra de Progreso**
En modo slideshow, muestra una barra de progreso que indica el tiempo restante antes del siguiente slide.

---

## 🎯 Ejemplos de Uso

### Hero Simple (Solo Imagen)
```jsx
<HeroBanner categorySlug="futbol" minHeight="30vh" />
```

### Hero con Parallax Intenso
```jsx
<HeroBanner 
  categorySlug="mundial" 
  enableParallax={true}
  parallaxIntensity={0.5}
/>
```

### Hero Promocional con Slideshow
```jsx
<HeroBanner
  slides={[
    { imageSrc: "/heroes/sale.jpg", title: "MEGA SALE", subtitle: "Hasta 70% OFF" },
    { imageSrc: "/heroes/new.jpg", title: "NUEVA COLECCIÓN" },
  ]}
  slideInterval={4000}
  minHeight="50vh"
/>
```

### Hero con Texto Overlay
```jsx
<HeroBanner
  imageSrc="/heroes/special.jpg"
  title="BLACK FRIDAY"
  subtitle="Solo por 24 horas"
  overlayOpacity={0.7}
/>
```

---

## 🔌 Props Disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `imageSrc` | string | - | Ruta a la imagen |
| `videoSrc` | string | - | Ruta al video |
| `slides` | array | - | Array de slides para carrusel |
| `slideInterval` | number | 5000 | Tiempo entre slides (ms) |
| `categorySlug` | string | - | Slug para auto-detectar imagen |
| `minHeight` | string | "45vh" | Altura mínima del hero |
| `overlayOpacity` | number | 0.5 | Opacidad del overlay (0-1) |
| `enableParallax` | boolean | true | Activar efecto parallax |
| `parallaxIntensity` | number | 0.3 | Intensidad del parallax (0-1) |
| `title` | string | - | Título overlay |
| `subtitle` | string | - | Subtítulo overlay |
| `adjacentCategories` | string[] | [] | Categorías para preload |
| `fallbackImage` | string | "/fondo.jpg" | Imagen de respaldo |
| `alt` | string | "Hero Banner 90+5" | Texto alternativo |
| `className` | string | "" | Clases CSS adicionales |

---

*Última actualización: Enero 2026*

