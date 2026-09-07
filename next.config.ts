import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/regulatory-landscape", destination: "/milestones", permanent: false },
    ];
  },
};

export default nextConfig;
