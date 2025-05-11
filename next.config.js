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
}

module.exports = nextConfig
