/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // WebSocket configuration using rewrites
  async rewrites() {
    return [
      {
        source: '/api/terminal',
        destination: '/api/terminal'
      },
      {
        source: '/api/socket',
        destination: '/api/socket'
      }
    ];
  }
}

module.exports = nextConfig