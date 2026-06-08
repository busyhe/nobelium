module.exports = {
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gravatar.com'
      },
      {
        protocol: 'https',
        hostname: 'www.notion.so'
      },
      {
        protocol: 'https',
        hostname: 'img.notionusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/secure.notion-static.com/**'
      }
    ]
  },
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=()'
          }
        ]
      }
    ]
  },
  transpilePackages: ['dayjs'],
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  }
}
