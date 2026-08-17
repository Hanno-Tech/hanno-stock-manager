import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O padrão é 1 MB e uma foto de câmera de celular passa disso. O cliente já
      // recomprime antes de enviar; isto é a folga para o que escapar da compressão.
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
