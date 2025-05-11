import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET comments for a post
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "缺少必要参数：postId" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("获取评论失败:", error);
    return NextResponse.json(
      { error: "获取评论失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// POST to create a new comment
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 获取用户信息，检查积分和封禁状态
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditScore: true, banUntil: true, id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }
    
    // 检查用户信用积分是否低于80
    if (user.creditScore < 80) {
      // 设置封禁时间
      const banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // 更新用户封禁状态
      await prisma.user.update({
        where: { id: userId },
        data: { banUntil }
      });
      
      return NextResponse.json(
        { 
          error: "您的信用积分低于80，暂时被禁止发表评论24小时",
          creditScore: user.creditScore
        },
        { status: 403 }
      );
    }

    // 解析请求体
    const requestData = await req.json();
    const { content, postId } = requestData;

    if (!content || !postId) {
      return NextResponse.json(
        { error: "评论内容和帖子ID不能为空" },
        { status: 400 }
      );
    }

    // 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: "帖子不存在" },
        { status: 404 }
      );
    }

    // 创建新评论
    const comment = await prisma.comment.create({
      data: {
        content,
        author: {
          connect: { id: userId },
        },
        post: {
          connect: { id: postId },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("创建评论失败:", error);
    return NextResponse.json(
      { error: "创建评论失败，请稍后再试" },
      { status: 500 }
    );
  }
}
