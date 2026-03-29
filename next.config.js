/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper headers for SEO crawling
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
      {
        // Ensure robots.txt is always accessible
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
  // Rewrites for clean service page URLs
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
