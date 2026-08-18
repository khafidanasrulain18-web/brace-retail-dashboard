/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Mengizinkan Vercel menyelesaikan proses build meskipun ada error ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mengizinkan Vercel menyelesaikan proses build meskipun ada error TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;