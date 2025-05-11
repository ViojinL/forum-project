import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// DELETE - 删除评论
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: "权限不足，需要管理员权限" },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "评论ID不能为空" },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: id },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "评论不存在" },
        { status: 404 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: id },
    });

    return NextResponse.json({ 
      message: "评论删除成功" 
    });
  } catch (error) {
    console.error("删除评论失败:", error);
    return NextResponse.json(
      { error: `删除评论失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
} 