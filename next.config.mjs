/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  outputFileTracingIncludes: {
    '/api/auth/*': [
      './node_modules/sql.js/dist/sql-wasm.wasm',
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('sql.js');
    }
    return config;
  },
};

export default nextConfig;