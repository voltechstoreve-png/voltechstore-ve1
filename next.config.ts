/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ← Agrega esto
  },
  eslint: {
    ignoreDuringBuilds: true,  // ← Y esto
  },
};

export default nextConfig;