import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/checkout/', '/rastreo/', '/perfil/'],
            },
            {
                // Bloquear bots de IA para no entrenar modelos con el catálogo
                userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'CCBot', 'anthropic-ai'],
                disallow: '/',
            },
        ],
        sitemap: 'https://90mas5.store/sitemap.xml',
    }
}
