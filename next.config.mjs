/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * 🖼️ Configuración de imágenes remotas
   * - Usamos remotePatterns en lugar de domains (deprecated en Next.js 14+)
   * - Más seguro: permite especificar protocolo y rutas
   */
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
    ],
    // 🎨 Permitir SVG en el componente Image (necesario para logos de bancos)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
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
};

export default nextConfig;
