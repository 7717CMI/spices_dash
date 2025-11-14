import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production
  compress: true,
  // Enable React strict mode
  reactStrictMode: true,
  // Optimize images if needed
  images: {
    unoptimized: false,
  },
  // Ensure API routes work in serverless environment
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
