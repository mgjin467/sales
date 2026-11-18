/** @type {import('next').NextConfig} */
// No static export any more: the login needs server routes (app/api/auth/*) and middleware, which Vercel runs.
const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  async headers() {
    return [
      { source: '/data/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
    ];
  },
};

export default nextConfig;
