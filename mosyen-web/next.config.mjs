/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Mengabaikan error ESLint saat deploy
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mengabaikan error TypeScript saat deploy
    ignoreBuildErrors: true,
  },
};

export default nextConfig;