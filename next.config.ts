import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
