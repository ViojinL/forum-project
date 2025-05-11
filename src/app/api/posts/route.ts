import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录后再发布帖子" },
        { status: 401 }
      );
    }

    // 解析请求体
    const { title, content, categoryId } = await req.json();

    // 验证请求数据
    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "标题、内容和分类不能为空" },
        { status: 400 }
      );
    }

    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "指定的分类不存在" },
        { status: 404 }
      );
    }

    // 获取用户ID
    const email = session.user.email as string;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否被封禁
    if (user.banUntil && user.banUntil > new Date()) {
      const remainingTime = Math.ceil((user.banUntil.getTime() - Date.now()) / (1000 * 60 * 60));
      return NextResponse.json(
        { 
          error: `您的账号因信用积分过低暂时被禁止发帖，约 ${remainingTime} 小时后解除`,
          creditScore: user.creditScore,
          banUntil: user.banUntil
        },
        { status: 403 }
      );
    }
    
    // 检查用户信用积分是否低于80
    if (user.creditScore < 80) {
      // 设置封禁时间
      const banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // 更新用户封禁状态
      await prisma.user.update({
        where: { id: user.id },
        data: { banUntil }
      });
      
      return NextResponse.json(
        { 
          error: "您的信用积分低于80，暂时被禁止发帖24小时",
          creditScore: user.creditScore
        },
        { status: 403 }
      );
    }

    // 创建新帖子
    const post = await prisma.post.create({
      data: {
        title,
        content,
        author: {
          connect: { id: user.id },
        },
        category: {
          connect: { id: categoryId },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("创建帖子失败:", error);
    return NextResponse.json(
      { error: "创建帖子失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// 获取所有帖子
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    
    // 构建查询条件
    const where = categoryId ? { categoryId } : {};
    
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        category: true,
        comments: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            comments: true,
            violations: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("获取帖子失败:", error);
    return NextResponse.json(
      { error: "获取帖子失败，请稍后再试" },
      { status: 500 }
    );
  }
}
