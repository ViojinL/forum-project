# 论坛项目 (Forum3)

一个使用 Next.js、Prisma 和 TypeScript 构建的论坛应用。

## 项目介绍

这是一个功能完整的论坛系统，支持用户注册、登录、发帖、评论等功能。项目采用了较新的 Web 开发技术栈，提供流畅的用户体验和安全可靠的后端服务。

## 技术栈

- **前端**: Next.js, React, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Prisma ORM 与 SQLite
- **认证**: NextAuth.js

## 如何启动项目
``` bash
npm install
npx prisma migrate dev --name init
npm run dev
```
