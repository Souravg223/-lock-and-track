import type { NextConfig } from "next";

// Allow LAN devices to connect to Next.js dev server (HMR / websocket)
const allowedOrigins = process.env.BACKEND_HOST
  ? [process.env.BACKEND_HOST]
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedOrigins,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://${process.env.BACKEND_HOST || "localhost"}:8080/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
