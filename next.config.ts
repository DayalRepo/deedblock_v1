import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for faster loads
  compress: true,
  
  // Note: swcMinify is enabled by default in Next.js 13+ and not needed
  
  // Optimize package imports for faster bundle sizes
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'qrcode.react'],
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
