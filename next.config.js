/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Important: This enables WebSocket connections through Next.js server
  webSocketServer: {
    options: {
      // You can configure WebSocket server options here
      path: '/api/terminal',
    },
  },
}

module.exports = nextConfig