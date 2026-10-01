/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // instrumentation.ts is supported by default in Next.js 15+ without any config flag
}

export default nextConfig
