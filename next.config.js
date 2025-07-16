/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境配置
  typescript: {
    // 在构建过程中忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 在构建过程中忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  // 实验性功能配置
  experimental: {
    largePageDataBytes: 512 * 1000, // 增加页面数据大小限制
  },
  // 外部包配置
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // 添加自定义服务器配置来处理431错误
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/auth/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // 优化输出
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 优化图片
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
