import { describe, it, expect } from 'vitest'
import { buildProductSlug, sanitizeSlugPart, mapGenderToSlug } from '@/lib/utils/slug'

describe('Slug utility functions', () => {
    it('sanitizes text properly', () => {
        expect(sanitizeSlugPart('Real Madrid 2024/25!')).toBe('real-madrid-2024-25')
        expect(sanitizeSlugPart('Camiseta Niño (Local)')).toBe('camiseta-nino-local')
    })

    it('maps genders accurately', () => {
        expect(mapGenderToSlug('man')).toBe('hombre')
        expect(mapGenderToSlug('woman')).toBe('mujer')
        expect(mapGenderToSlug('kid')).toBe('nino')
        expect(mapGenderToSlug(null)).toBe('')
    })

    it('builds product slug in strict order [equipo-o-marca] - [nombre] - [temporada] - [categoria] - [genero]', () => {
        const slug = buildProductSlug({
            teamName: 'Real Madrid',
            name: 'Camiseta Local',
            season: '2024/25',
            categoryName: 'Camisetas',
            gender: 'man',
        })
        expect(slug).toBe('real-madrid-camiseta-local-2024-25-camisetas-hombre')
    })

    it('handles random missing fields cleanly without trailing or double dashes', () => {
        // Missing category and season
        const slug1 = buildProductSlug({
            teamName: 'Barcelona',
            name: 'Camiseta Visita',
            gender: 'woman',
        })
        expect(slug1).toBe('barcelona-camiseta-visita-mujer')

        // Brand instead of team
        const slug2 = buildProductSlug({
            brandName: 'Adidas',
            name: 'Zapatillas Retro',
            categoryName: 'Calzado',
        })
        expect(slug2).toBe('adidas-zapatillas-retro-calzado')

        // Only name and season
        const slug3 = buildProductSlug({
            name: 'Balón Oficial',
            season: '2026',
        })
        expect(slug3).toBe('balon-oficial-2026')
    })
})
