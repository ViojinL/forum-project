import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET comment by ID
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        post: true,
        // Include all replies recursively
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            replies: true, // This will recursively include all nested replies
          },
          orderBy: {
            createdAt: "asc"
          }
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "评论不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("获取评论详情失败:", error);
    return NextResponse.json(
      { error: "获取评论详情失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// PUT to update a comment
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

    // 获取评论信息
    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return NextResponse.json(
        { error: "评论不存在" },
        { status: 404 }
      );
    }

    // 检查是否是评论作者
    if (comment.authorId !== userId) {
      return NextResponse.json(
        { error: "您没有权限编辑此评论" },
        { status: 403 }
      );
    }

    // 检查编辑次数限制
    if (comment.editCount >= 2) {
      return NextResponse.json(
        { error: "您已达到评论编辑次数上限 (2次)" },
        { status: 403 }
      );
    }

    // 解析请求体
    const requestData = await req.json();
    const { content } = requestData;

    if (!content) {
      return NextResponse.json(
        { error: "评论内容不能为空" },
        { status: 400 }
      );
    }

    // 更新评论，并增加编辑次数
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content,
        editCount: comment.editCount + 1
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        // Include replies so the frontend can display them
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc"
          }
        },
      },
    });

    return NextResponse.json({ 
      comment: updatedComment,
      message: `评论已更新，您还剩余 ${2 - updatedComment.editCount} 次编辑机会` 
    });
  } catch (error) {
    console.error("更新评论失败:", error);
    return NextResponse.json(
      { error: "更新评论失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// DELETE to delete a comment
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

    // 获取评论信息
    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return NextResponse.json(
        { error: "评论不存在" },
        { status: 404 }
      );
    }

    // 检查是否是评论作者或管理员
    if (comment.authorId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "您没有权限删除此评论" },
        { status: 403 }
      );
    }

    // 删除评论
    await prisma.comment.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: "评论已成功删除" 
    });
  } catch (error) {
    console.error("删除评论失败:", error);
    return NextResponse.json(
      { error: "删除评论失败，请稍后再试" },
      { status: 500 }
    );
  }
} 