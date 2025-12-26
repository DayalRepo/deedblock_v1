import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for faster loads
  compress: true,

  // Fix for "inferred workspace root" warning
  outputFileTracingRoot: process.cwd(),

  // Allowed origins for development
  allowedDevOrigins: ['192.168.0.102', '192.168.0.102:3000', 'localhost', 'localhost:3000'],

  // Note: swcMinify is enabled by default in Next.js 13+ and not needed

  // Optimize package imports for faster bundle sizes
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.mypinata.cloud; connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.mypinata.cloud; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer, webpack }) => {
    // Ignore pino-pretty optional dependency (used only for development logging)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pino-pretty$/,
      })
    );

    // Set fallback for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'pino-pretty': false,
      };

      // Optimize chunk splitting for better code splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: any) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                return packageName?.replace('@', '');
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
