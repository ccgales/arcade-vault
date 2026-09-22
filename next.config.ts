import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // IP de la red local de desarrollo (SPEC 11): permite abrir `next dev` desde
  // un teléfono de la misma LAN para probar los controles táctiles. Es
  // específica de esta máquina — ajústala a tu propia IP local.
  allowedDevOrigins: ["192.168.1.20"],
};

export default nextConfig;
