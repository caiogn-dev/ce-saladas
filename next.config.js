const nextConfig = {
  reactStrictMode: true,
  // Keep tracing scoped to this app when parent folders also have lockfiles.
  outputFileTracingRoot: process.cwd(),
  env: {
    // Expose API_BASE_URL or API_URL to the client
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
