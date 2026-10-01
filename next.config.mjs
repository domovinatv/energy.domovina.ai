/** @type {import('next').NextConfig} */
const nextConfig = {
  // Statički export → Cloudflare. Jedno okruženje (docs/12 §2): svaki push u
  // `main` je objava, pa je rollback = vraćanje prethodnog deploya.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // NE dodavati `export const dynamicParams = false` u rutama — ruši
  // prerenderirane rute na OpenNextu (opennextjs-cloudflare #611, docs/06 §5).
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
