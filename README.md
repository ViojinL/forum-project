# 论坛项目 (Forum)

一个使用 Next.js、Prisma 和 TypeScript 构建的论坛应用。

## 项目介绍

本项目是一个基于现代全栈技术构建的高性能在线论坛系统。它不仅提供了用户注册、登录、发帖、评论等核心论坛功能，更在技术实现上追求卓越，旨在打造流畅的用户体验和安全可靠的后端服务。

**核心技术亮点包括：**

*   **全栈 Next.js 应用**：前端采用 **Next.js** 和 **React** 构建，充分利用其服务端渲染 (SSR) 和静态站点生成 (SSG) 的优势，实现了快速的页面加载和良好的 SEO 表现。结合 **TypeScript** 进行开发，确保了代码的类型安全和可维护性。界面则使用 **Tailwind CSS** 实用优先的框架，实现了高效且高度可定制化的 UI 设计。
*   **一体化后端**：后端逻辑通过 **Next.js API Routes** 实现，与前端项目无缝集成，简化了开发和部署流程。这种架构使得 API 接口能够快速响应，并与前端组件紧密协作。
*   **现代化数据管理**：数据库交互采用 **Prisma ORM**，它提供了一个类型安全的数据库客户端，简化了与 **SQLite** 数据库的交互，并支持通过声明式的 Schema 文件管理数据模型和迁移。
*   **安全认证机制**：用户认证和会话管理由 **NextAuth.js** 负责，它提供了灵活且安全的认证方案，支持多种认证策略，保障了用户账户的安全。

通过这些技术的整合，本项目致力于提供一个功能完善、性能优越、易于扩展的现代化论坛平台。

## 技术栈

- **前端**: Next.js, React, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Prisma ORM 与 SQLite
- **认证**: NextAuth.js

## 如何启动项目
``` bash
npm install
npx prisma generate
node scripts\prepare-production.cjs
npm run dev
```
