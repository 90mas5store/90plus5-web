import { SupabaseClient } from '@supabase/supabase-js'

export interface SlugComponents {
    teamName?: string | null
    brandName?: string | null
    name?: string | null
    season?: string | null
    categoryName?: string | null
    gender?: string | null
}

/**
 * Sanitiza un texto individual para su uso en slugs de URL.
 */
export function sanitizeSlugPart(text: string): string {
    return (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

/**
 * Mapea valores de género del sistema a etiquetas legibles para el slug.
 */
export function mapGenderToSlug(gender?: string | null): string {
    if (!gender) return ''
    const g = gender.toLowerCase()
    if (g === 'man' || g === 'hombre' || g === 'men') return 'hombre'
    if (g === 'woman' || g === 'mujer' || g === 'women') return 'mujer'
    if (g === 'kid' || g === 'nino' || g === 'ninos' || g === 'kids') return 'nino'
    return sanitizeSlugPart(gender)
}

/**
 * Construye el slug completo de un producto siguiendo el orden estricto:
 * [equipo-o-marca] - [nombre] - [temporada] - [categoria] - [genero]
 */
export function buildProductSlug(components: SlugComponents): string {
    const parts: string[] = []

    // 1. Equipo o Marca (si no hay equipo seleccionado)
    const team = components.teamName ? sanitizeSlugPart(components.teamName) : ''
    const brand = components.brandName ? sanitizeSlugPart(components.brandName) : ''
    const entity = team || brand
    if (entity) parts.push(entity)

    // 2. Nombre del producto
    const namePart = components.name ? sanitizeSlugPart(components.name) : ''
    if (namePart) parts.push(namePart)

    // 3. Temporada
    const seasonPart = components.season ? sanitizeSlugPart(components.season) : ''
    if (seasonPart) parts.push(seasonPart)

    // 4. Categoría
    const catPart = components.categoryName ? sanitizeSlugPart(components.categoryName) : ''
    if (catPart) parts.push(catPart)

    // 5. Género / Audiencia
    const genderPart = mapGenderToSlug(components.gender)
    if (genderPart) parts.push(genderPart)

    return parts.join('-')
}

/**
 * Consulta Supabase para verificar si un slug existe y retorna una versión garantizada única
 * agregando sufijos numéricos (-1, -2, etc.) si es necesario.
 */
export async function generateUniqueSlug(
    supabase: SupabaseClient,
    candidateSlug: string,
    excludeProductId?: string | null
): Promise<string> {
    const baseSlug = sanitizeSlugPart(candidateSlug)
    if (!baseSlug) return ''

    let currentSlug = baseSlug
    let counter = 1
    let isUnique = false

    while (!isUnique && counter <= 100) {
        let query = supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('slug', currentSlug)
            .is('deleted_at', null)

        if (excludeProductId) {
            query = query.neq('id', excludeProductId)
        }

        const { count, error } = await query

        if (error) {
            console.error('Error al comprobar unicidad del slug:', error)
            break
        }

        if (count === 0 || count === null) {
            isUnique = true
        } else {
            currentSlug = `${baseSlug}-${counter}`
            counter++
        }
    }

    return currentSlug
}
