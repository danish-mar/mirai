import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s4.anilist.co"
      },
      {
        protocol: "https",
        hostname: "img1.ak.crunchyroll.com"
      },
      {
        protocol: "https",
        hostname: "*.ak.crunchyroll.com"
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net"
      },
      {
        protocol: "https",
        hostname: "media.kitsu.io"
      }
    ]
  },
};

export default nextConfig;
