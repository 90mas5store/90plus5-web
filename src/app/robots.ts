import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                // Regla general: todo público accesible excepto rutas privadas
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/checkout/', '/rastreo/', '/perfil/', '/comprobante/'],
            },
            {
                // Explícitamente permitir crawlers de IA (GEO) para aparecer en respuestas de ChatGPT, Perplexity, etc.
                userAgent: [
                    'GPTBot',
                    'ChatGPT-User',
                    'Google-Extended',
                    'CCBot',
                    'anthropic-ai',
                    'ClaudeBot',
                    'PerplexityBot',
                    'YouBot',
                    'cohere-ai',
                ],
                allow: '/',
                disallow: ['/api/', '/admin/', '/checkout/', '/rastreo/', '/perfil/', '/comprobante/'],
            },
        ],
        sitemap: 'https://90mas5.store/sitemap.xml',
    }
}
