/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Inclure 127.0.0.1 : sinon les Server Actions échouent si l’URL n’est pas exactement "localhost"
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
    },
  },
};

export default nextConfig;
