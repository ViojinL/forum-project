import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from 'next/link';

export default async function AdminCheck() {
  // 尝试获取会话
  const session = await getServerSession(authOptions);
  
  // 直接从数据库查询root@admin.edu用户
  const adminUser = await prisma.$queryRaw`
    SELECT "id", "email", "username", "isAdmin" FROM "User" WHERE "email" = 'root@admin.edu'
  `;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">管理员状态检查</h1>
      
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          返回首页
        </Link>
      </div>
      
      <div className="bg-yellow-100 p-4 mb-4 rounded">
        <h2 className="text-xl font-semibold mb-2">数据库中的管理员用户</h2>
        <pre className="bg-white p-4 rounded">{JSON.stringify(adminUser, null, 2)}</pre>
      </div>
      
      <div className="bg-blue-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">当前会话</h2>
        {session ? (
          <div>
            <p>已登录为: {session.user?.email}</p>
            <p>用户名: {session.user?.username}</p>
            <p>管理员: {session.user?.isAdmin ? '是' : '否'}</p>
            <pre className="bg-white p-4 rounded mt-2">{JSON.stringify(session, null, 2)}</pre>
          </div>
        ) : (
          <p>未登录</p>
        )}
      </div>
    </div>
  );
} 