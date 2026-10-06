import type { NextConfig } from "next";

// Headers de seguridad (SPEC 20). Sin Content-Security-Policy ni `preload` en HSTS: ver el spec.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  headers: async () => [{ source: "/(.*)", headers: securityHeaders }],
  // IP de la red local de desarrollo (SPEC 11): permite abrir `next dev` desde
  // un teléfono de la misma LAN para probar los controles táctiles. Es
  // específica de esta máquina — ajústala a tu propia IP local.
  allowedDevOrigins: ["192.168.1.20"],
};

export default nextConfig;
