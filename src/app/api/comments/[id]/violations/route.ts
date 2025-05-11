import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    // 验证管理员身份
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

    // 获取评论的违规标记记录
    const violations = await prisma.commentViolation.findMany({
      where: {
        commentId: id
      },
      include: {
        markedByAdmin: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      violations 
    }, { status: 200 });
  } catch (error) {
    console.error("获取评论违规标记失败:", error);
    return NextResponse.json(
      { error: `获取评论违规标记失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
} 