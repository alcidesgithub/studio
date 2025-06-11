
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Allow any HTTPS source
        protocol: 'https',
        hostname: '**', 
      },
      { // Allow any HTTP source (less secure, use with caution)
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
