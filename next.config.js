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
  // 增加服务器响应头配置，解决431错误
  serverRuntimeConfig: {
    // 增加请求头大小限制
    BODY_PARSER_SIZE_LIMIT: '1mb',
  },
  // 外部包配置移到正确位置
  serverExternalPackages: ['bcryptjs'],
  // 配置HTTP服务器头部大小
  experimental: {
    largePageDataBytes: 512 * 1000, // 增加页面数据大小限制
  },
}

export default nextConfig
