/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // WebSocket configuration using rewrites
  async rewrites() {
    return [
      {
        source: '/api/socket.io/:slug*',
        destination: '/api/terminal'
      }
    ];
  },

  // Enable WebSocket support
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false
      };
    }
    return config;
  }
}

module.exports = nextConfig