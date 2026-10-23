/** @type {import('next').NextConfig} */
const rawBackendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://gather-backend-fidw.onrender.com"
    : "http://127.0.0.1:5000");

const cleanBackendUrl = rawBackendUrl.replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${cleanBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
