# Regla Estricta: Prohibición de Años de Temporada Hardcodeados

## 1. Mandato Principal
**NUNCA** colocar años o rangos de temporada específicos (por ejemplo: `2024/25`, `2025/26`, `24/25`, `25/26`, etc.) hardcodeados en:
- Títulos principales o secundarios (`h1`, `h2`, `h3`).
- Banners, héroes promocionales o vitrinas destacadas.
- Badges, píldoras informativas o chips de confianza.
- Metadatos SEO (`title`, `description`, etiquetas OpenGraph).
- Textos de pie de foto o descripciones de colecciones.

## 2. Motivo Comercial y de Experiencia
90+5 Store maneja un catálogo dinámico y extenso que incluye camisetas actuales, versiones aficionado y jugador, ediciones de copas internacionales y piezas retro. Colocar años específicos fijos:
- Desactualiza la tienda innecesariamente.
- Genera inconsistencias cuando el usuario filtra camisetas de otros periodos o modelos retro.
- Confunde a los clientes respecto a la vigencia del stock.

## 3. Sustitutos Permitidos y Recomendados
En lugar de años de temporada, utilizar siempre terminología perenne y de alto valor:
- ✅ *"Colección Oficial"*
- ✅ *"Nueva Colección & Novedades"*
- ✅ *"Camisetas Oficiales"*
- ✅ *"Versión Jugador y Aficionado"*
- ✅ *"Prendas y Ediciones Especiales"*

## 4. Única Excepción Válida
Los años o temporadas solo pueden mostrarse cuando provengan **estrictamente de datos dinámicos**:
- El campo `item.season` que viene de la base de datos de un producto específico.
- Opciones de filtro generadas dinámicamente según los productos cargados.
