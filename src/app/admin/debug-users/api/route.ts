import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    // 获取请求体
    const { userId, isAdmin } = await req.json();

    console.log(`[调试工具] 正在更新用户 ${userId} 的管理员状态为: ${isAdmin}`);
    
    // 使用原始SQL更新用户管理员状态
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "isAdmin" = ${isAdmin ? 1 : 0}
      WHERE "id" = ${userId}
    `;
    
    // 获取更新后的用户信息
    const updatedUser = await prisma.$queryRaw`
      SELECT "id", "email", "username", "isAdmin"
      FROM "User"
      WHERE "id" = ${userId}
    `;

    console.log("[调试工具] 用户权限更新成功:", updatedUser);

    return NextResponse.json({ success: true, user: (updatedUser as any[])[0] }, { status: 200 });
  } catch (error) {
    console.error("[调试工具] 更新用户管理员状态失败:", error);
    return NextResponse.json(
      { error: `更新失败: ${(error as Error).message || '未知错误'}` },
      { status: 500 }
    );
  }
}

// GET方法获取所有用户
export async function GET(req: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    console.log("调试API: 开始获取用户列表");
    
    // 直接使用原始SQL查询获取所有用户
    const users = await prisma.$queryRaw`
      SELECT 
        "id", 
        "email", 
        "username", 
        "isAdmin", 
        "creditScore",
        "banUntil",
        "contactInfo", 
        "signature", 
        "avatar", 
        "createdAt", 
        "updatedAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `;
    
    console.log(`调试API: 获取到 ${(users as any[]).length} 个用户`);
    
    // 获取用户帖子和评论数
    const usersWithStats = await Promise.all(
      (users as any[]).map(async (user: any) => {
        const postCount = await prisma.post.count({
          where: { authorId: user.id }
        });
        
        const commentCount = await prisma.comment.count({
          where: { authorId: user.id }
        });
        
        return {
          ...user,
          _count: {
            posts: postCount,
            comments: commentCount
          }
        };
      })
    );
    
    return NextResponse.json({ users: usersWithStats }, { status: 200 });
  } catch (error) {
    console.error("调试API - 获取用户列表失败:", error);
    return NextResponse.json(
      { error: `获取用户列表失败: ${(error as Error).message || '未知错误'}` },
      { status: 500 }
    );
  }
} 