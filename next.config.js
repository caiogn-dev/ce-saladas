const nextConfig = {
  reactStrictMode: true,
  env: {
    // Expose API_BASE_URL or API_URL to the client
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    'https://work-1-dwokebrtijssmeqd.prod-runtime.all-hands.dev',
    'https://work-2-dwokebrtijssmeqd.prod-runtime.all-hands.dev',
  ],
};

export default nextConfig;
