import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:3050/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://127.0.0.1:3050/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;