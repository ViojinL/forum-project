import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET all users (admin only)
export async function GET() {
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
        "creditScore",
        "banUntil",
        "createdAt", 
        "updatedAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `;
    
    console.log(`从数据库获取了 ${(users as Record<string, unknown>[]).length} 个用户`);

    // 获取每个用户的帖子和评论数
    const usersWithCounts = await Promise.all(
      (users as Record<string, unknown>[]).map(async (user: Record<string, unknown>) => {
        const userId = String(user.id);
        const postCount = await prisma.post.count({
          where: { authorId: userId }
        });
        
        const commentCount = await prisma.comment.count({
          where: { authorId: userId }
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

// PATCH to update user admin status or credit score (admin only)
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
    const { userId, isAdmin, action } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "用户ID不能为空" },
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

    // 根据操作类型执行不同的更新
    if (action === 'setCredit90') {
      // 设置用户信用积分为90，并解除封禁
      console.log(`正在更新用户 ${userId} 的信用积分为90并解除封禁`);
      
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "creditScore" = 90, "banUntil" = NULL
        WHERE "id" = ${userId}
      `;
      
      // 发送系统消息到用户收件箱
      await prisma.userInbox.create({
        data: {
          userId: userId,
          message: '管理员已将您的信用积分调整为90分并解除了发言限制。请遵守社区规则，积极参与讨论。',
          type: 'system',
        },
      });
      
      // 获取更新后的用户信息
      const updatedUser = await prisma.$queryRaw`
        SELECT "id", "email", "username", "isAdmin", "creditScore", "banUntil"
        FROM "User"
        WHERE "id" = ${userId}
      `;

      console.log("用户信用积分更新成功:", updatedUser);

      return NextResponse.json({ user: (updatedUser as Record<string, unknown>[])[0] }, { status: 200 });
    } 
    else if (isAdmin !== undefined) {
      // 更新管理员状态
      console.log(`正在更新用户 ${userId} 的管理员状态为: ${isAdmin}`);
      
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "isAdmin" = ${isAdmin}
        WHERE "id" = ${userId}
      `;
      
      // 获取更新后的用户信息
      const updatedUser = await prisma.$queryRaw`
        SELECT "id", "email", "username", "isAdmin", "creditScore"
        FROM "User"
        WHERE "id" = ${userId}
      `;

      console.log("用户权限更新成功:", updatedUser);

      return NextResponse.json({ user: (updatedUser as Record<string, unknown>[])[0] }, { status: 200 });
    }
    else {
      return NextResponse.json(
        { error: "无效的操作类型" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("更新用户信息失败:", error);
    return NextResponse.json(
      { error: `更新用户信息失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
} 