import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// 获取用户信息
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: "用户ID不能为空" },
        { status: 400 }
      );
    }

    // 使用原始SQL查询获取用户信息，以解决类型问题
    const users = await prisma.$queryRaw`
      SELECT 
        u."id", 
        u."username", 
        u."email", 
        u."contactInfo", 
        u."signature", 
        u."avatar", 
        u."creditScore", 
        u."banUntil",
        u."createdAt",
        (SELECT COUNT(*) FROM "Post" WHERE "authorId" = u."id") as "postCount",
        (SELECT COUNT(*) FROM "Comment" WHERE "authorId" = u."id") as "commentCount"
      FROM "User" u
      WHERE u."id" = ${id}
    `;

    // 检查是否找到用户
    if (!users || (users as any[]).length === 0) {
      return NextResponse.json(
        { error: "找不到该用户" },
        { status: 404 }
      );
    }

    const user = (users as any[])[0];
    
    // 格式化返回数据，保持与之前API返回格式一致
    const formattedUser = {
      ...user,
      _count: {
        posts: parseInt(user.postCount || '0'),
        comments: parseInt(user.commentCount || '0')
      }
    };
    
    // 删除临时计数字段
    delete formattedUser.postCount;
    delete formattedUser.commentCount;

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return NextResponse.json(
      { error: `获取用户信息失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    // 验证用户是否已登录
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录后再修改个人信息" },
        { status: 401 }
      );
    }

    // 确保用户只能修改自己的信息
    if (session.user.id !== id) {
      return NextResponse.json(
        { error: "无权修改其他用户的信息" },
        { status: 403 }
      );
    }

    // 解析请求体
    const { username, contactInfo, signature, avatar } = await req.json();
    
    // 验证输入
    if (username === undefined && contactInfo === undefined && signature === undefined && avatar === undefined) {
      return NextResponse.json(
        { error: "未提供任何要更新的字段" },
        { status: 400 }
      );
    }
    
    // 如果更新用户名，确保新用户名未被使用
    if (username) {
      const existingUsers = await prisma.$queryRaw`
        SELECT "id" FROM "User" WHERE "username" = ${username}
      `;
      
      if ((existingUsers as any[]).length > 0 && (existingUsers as any[])[0].id !== id) {
        return NextResponse.json(
          { error: "该用户名已被使用" },
          { status: 400 }
        );
      }
    }
    
    // 构建更新SQL
    const now = new Date();
    
    // 使用单个更新语句并且直接构建SQL字符串
    if (username !== undefined) {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "username" = ${username}, "updatedAt" = ${now}
        WHERE "id" = ${id}
      `;
    }
    
    if (contactInfo !== undefined) {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "contactInfo" = ${contactInfo}, "updatedAt" = ${now}
        WHERE "id" = ${id}
      `;
    }
    
    if (signature !== undefined) {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "signature" = ${signature}, "updatedAt" = ${now}
        WHERE "id" = ${id}
      `;
    }
    
    if (avatar !== undefined) {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "avatar" = ${avatar}, "updatedAt" = ${now}
        WHERE "id" = ${id}
      `;
    }
    
    // 获取更新后的用户信息
    const updatedUsers = await prisma.$queryRaw`
      SELECT 
        "id", 
        "username", 
        "email", 
        "contactInfo", 
        "signature", 
        "avatar", 
        "creditScore",
        "banUntil",
        "createdAt"
      FROM "User" 
      WHERE "id" = ${id}
    `;
    
    return NextResponse.json({ user: (updatedUsers as any[])[0] });
  } catch (error) {
    console.error("更新用户信息失败:", error);
    return NextResponse.json(
      { error: `更新用户信息失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
}