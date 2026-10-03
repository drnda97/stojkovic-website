import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Projekat živi u podfolderu (htdocs), pa koren navodimo izričito.
  turbopack: { root: __dirname },
};

export default nextConfig;
