/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * 🖼️ Configuración de imágenes remotas
   * - Usamos remotePatterns en lugar de domains (deprecated en Next.js 14+)
   * - Más seguro: permite especificar protocolo y rutas
   */
  transpilePackages: ['lucide-react', 'framer-motion'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '90mas5.store',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fhvxolslqrrkefsvbcrq.supabase.co',
        pathname: '/**',
      },
    ],
    // 🎨 Permitir SVG en el componente Image (necesario para logos de bancos)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',

    // 🚀 OPTIMIZACIONES DE IMAGEN (Lighthouse recommendations)
    formats: ['image/webp', 'image/avif'], // Formatos modernos primero
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Tamaños responsive
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Tamaños de íconos
    minimumCacheTTL: 60 * 60 * 24 * 365, // Cache de 1 año
    unoptimized: false, // Asegurar que las imágenes se optimicen
  },

  /**
   * 🛡️ Headers de seguridad para producción
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://i.imgur.com https://res.cloudinary.com https://upload.wikimedia.org https://90mas5.store https://fhvxolslqrrkefsvbcrq.supabase.co https://*.facebook.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; connect-src 'self' https://*.facebook.com https://fhvxolslqrrkefsvbcrq.supabase.co;",
          },
        ],
      },
      // 🚀 Cache Control para assets estáticos inmutables (Fonts, Images)
      // Next.js ya maneja los JS/CSS con hash, pero esto refuerza imágenes
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  /**
   * 🚀 Optimizaciones para producción
   */
  poweredByHeader: false, // Oculta el header "X-Powered-By: Next.js"

  /**
   * 📦 Configuración de compilación
   */
  compiler: {
    // Elimina console.log en producción (excepto console.error y console.warn)
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  /**
   * ⚡ Optimizaciones de rendimiento (Lighthouse recommendations)
   */
  compress: true, // Habilitar compresión gzip
  swcMinify: true, // Usar SWC para minificación (más rápido que Terser)

  /**
   * 🔬 Características experimentales para mejor rendimiento
   */
  experimental: {
    optimizeCss: false, // Disabled due to performance regression
    optimizePackageImports: ['framer-motion', 'lucide-react'], // Optimizar imports grandes
  },

  /**
   * 📊 Configuración de webpack para optimizaciones adicionales
   */
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    };
    return config;
  },
};

export default nextConfig;
