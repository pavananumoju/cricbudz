import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'img1.hscicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'static.cricbuzz.com',
      },
      {
        protocol: 'https',
        hostname: 'www.cricbuzz.com',
      },
      {
        protocol: 'https',
        hostname: 'i.cricketcb.com', // Added to allow Cricbuzz legacy storage CDN access
      },
    ],
  },
};

export default nextConfig;