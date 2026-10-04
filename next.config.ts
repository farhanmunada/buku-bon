import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["drizzle-orm", "@neondatabase/serverless"],
  async redirects() {
    return [
      {
        source: "/report",
        destination: "/reports",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
