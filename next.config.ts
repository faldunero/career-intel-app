import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse y @napi-rs/canvas no se pueden "bundlear": necesitan
  // resolverse desde node_modules en runtime (binarios nativos +
  // workers de pdfjs-dist). Sin esto, la extracción de PDF falla en
  // Vercel con "DOMMatrix is not defined".
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
