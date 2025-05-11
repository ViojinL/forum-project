import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET all users (admin only)
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    // Verify admin status
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: "权限不足，需要管理员权限" },
        { status: 403 }
      );
    }

    // Get all users (exclude password)
    console.log("开始获取用户列表...");
    
    // 使用原始SQL查询获取用户
    const users = await prisma.$queryRaw`
      SELECT 
        "id", 
        "email", 
        "username", 
        "isAdmin", 
        "contactInfo", 
        "signature", 
        "avatar", 
        "createdAt", 
        "updatedAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `;
    
    console.log(`从数据库获取了 ${(users as any[]).length} 个用户`);

    // 获取每个用户的帖子和评论数
    const usersWithCounts = await Promise.all(
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

    console.log("用户数据处理完毕，准备返回...");
    return NextResponse.json({ users: usersWithCounts }, { status: 200 });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json(
      { error: "获取用户列表失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// PATCH to update user admin status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    // Verify admin status
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: "权限不足，需要管理员权限" },
        { status: 403 }
      );
    }

    // Get request body
    const { userId, isAdmin } = await req.json();

    if (!userId || isAdmin === undefined) {
      return NextResponse.json(
        { error: "用户ID和管理员状态不能为空" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "找不到该用户" },
        { status: 404 }
      );
    }

    console.log(`正在更新用户 ${userId} 的管理员状态为: ${isAdmin}`);
    
    // 使用原始SQL更新用户管理员状态
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "isAdmin" = ${isAdmin}
      WHERE "id" = ${userId}
    `;
    
    // 获取更新后的用户信息
    const updatedUser = await prisma.$queryRaw`
      SELECT "id", "email", "username", "isAdmin"
      FROM "User"
      WHERE "id" = ${userId}
    `;

    console.log("用户权限更新成功:", updatedUser);

    return NextResponse.json({ user: (updatedUser as any[])[0] }, { status: 200 });
  } catch (error) {
    console.error("更新用户管理员状态失败:", error);
    return NextResponse.json(
      { error: `更新用户管理员状态失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
} 