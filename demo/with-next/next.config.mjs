/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  webpack: config => {
    let newConfig = { ...config };
    newConfig.experiments.asyncWebAssembly = true;
    return newConfig;
  }
};

export default nextConfig;
