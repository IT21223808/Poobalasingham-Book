import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://192.168.0.1:3050/api/:path*",
      },
    ];
  },
};

export default nextConfig;