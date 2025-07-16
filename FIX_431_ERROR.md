# 431错误简化修复方案

## 问题分析
431 Request Header Fields Too Large 错误主要由NextAuth的JWT token过大和cookie积累导致。

## 修复措施

### 1. 优化NextAuth配置
**文件**: `src/lib/auth.ts`
- 缩短JWT和session过期时间（24小时）
- 最小化JWT内容
- 移除不必要的调试和事件处理

### 2. 优化登录流程
**文件**: `src/app/login/page.tsx`
- 使用 `redirect: false` 避免URL参数过长
- 手动处理登录成功后的跳转

### 3. 简化中间件
**文件**: `middleware.ts`
- 只检查cookie大小（>4KB时重定向清理）
- 移除复杂的请求头处理

### 4. 修复Next.js配置
**文件**: `next.config.js`
- 移除已弃用的配置项
- 保留必要的优化设置

## 核心原理

通过减少JWT token大小和及时清理过大的cookie来避免431错误：

1. **JWT优化**: 24小时过期，只存储必要信息
2. **Cookie监控**: 超过4KB自动重定向清理
3. **简化配置**: 移除不必要的复杂功能

## 测试步骤

1. 访问 `/clear-cookies` 清理现有数据
2. 尝试正常登录
3. 验证不再出现431错误

## 如果仍有问题

1. 清理浏览器所有数据
2. 重启开发服务器
3. 检查控制台是否有cookie大小警告

这个方案保持了NextAuth的完整功能，只是优化了配置来避免431错误。 