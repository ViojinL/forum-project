import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// DELETE a post (admin only)
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
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

    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: "帖子ID不能为空" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "找不到该帖子" },
        { status: 404 }
      );
    }

    // Delete the post (will cascade delete comments as defined in schema)
    await prisma.post.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "帖子删除成功" }, { status: 200 });
  } catch (error) {
    console.error("删除帖子失败:", error);
    return NextResponse.json(
      { error: "删除帖子失败，请稍后再试" },
      { status: 500 }
    );
  }
} 