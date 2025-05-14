import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET post by ID
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: "帖子ID不能为空" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        category: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            // 暂时移除所有可能使用parentId或replies的关联
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "找不到该帖子" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("获取帖子详情失败:", error);
    return NextResponse.json(
      { error: "获取帖子详情失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// PUT to update a post
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 获取帖子信息
    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json(
        { error: "帖子不存在" },
        { status: 404 }
      );
    }

    // 检查是否是帖子作者
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: "您没有权限编辑此帖子" },
        { status: 403 }
      );
    }

    // 检查编辑次数限制
    if (post.editCount >= 2) {
      return NextResponse.json(
        { error: "您已达到编辑次数上限 (2次)" },
        { status: 403 }
      );
    }

    // 解析请求体
    const requestData = await req.json();
    const { title, content } = requestData;

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    // 更新帖子，并增加编辑次数
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        editCount: post.editCount + 1
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        category: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            // 暂时移除所有可能使用parentId或replies的关联
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({ 
      post: updatedPost,
      message: `帖子已更新，您还剩余 ${2 - updatedPost.editCount} 次编辑机会` 
    });
  } catch (error) {
    console.error("更新帖子失败:", error);
    return NextResponse.json(
      { error: "更新帖子失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// DELETE to delete a post
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const isAdmin = session.user.isAdmin;

    // 获取帖子信息
    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json(
        { error: "帖子不存在" },
        { status: 404 }
      );
    }

    // 检查是否是帖子作者或管理员
    if (post.authorId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "您没有权限删除此帖子" },
        { status: 403 }
      );
    }

    // 删除帖子
    await prisma.post.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: "帖子已成功删除" 
    });
  } catch (error) {
    console.error("删除帖子失败:", error);
    return NextResponse.json(
      { error: "删除帖子失败，请稍后再试" },
      { status: 500 }
    );
  }
}
