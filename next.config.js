const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    'https://work-1-dwokebrtijssmeqd.prod-runtime.all-hands.dev',
    'https://work-2-dwokebrtijssmeqd.prod-runtime.all-hands.dev',
  ],
};

export default nextConfig;
