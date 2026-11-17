import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config/site'

export default function robots(): MetadataRoute.Robots {
    const privatePaths = [
        '/api/',
        '/admin',
        '/auth/',
        '/checkout',
        '/perfil',
        '/comprobante/',
        '/rastreo?*',
    ]

    return {
        rules: [
            {
                // Regla general: todo público accesible excepto rutas privadas y transaccionales
                userAgent: '*',
                allow: '/',
                disallow: privatePaths,
            },
            {
                // Explícitamente permitir crawlers de IA (GEO) para aparecer en respuestas de ChatGPT Search, Perplexity, Claude, Gemini, etc.
                userAgent: [
                    'OAI-SearchBot',
                    'GPTBot',
                    'ChatGPT-User',
                    'PerplexityBot',
                    'ClaudeBot',
                    'anthropic-ai',
                    'Google-Extended',
                    'GoogleOther',
                    'Applebot',
                    'Applebot-Extended',
                    'CCBot',
                    'cohere-ai',
                    'YouBot',
                    'Bingbot',
                ],
                allow: '/',
                disallow: privatePaths,
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
