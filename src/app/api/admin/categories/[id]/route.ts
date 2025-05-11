import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// PATCH - 更新板块
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;

    // 验证是否为管理员
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

    // 解析请求体
    const { name, description } = await request.json();

    // 验证名称不为空
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "板块名称不能为空" },
        { status: 400 }
      );
    }

    // 检查板块是否存在
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "板块不存在" },
        { status: 404 }
      );
    }

    // 如果名称发生变化，检查新名称是否已被使用
    if (existingCategory.name !== name.trim()) {
      const nameExists = await prisma.category.findFirst({
        where: { name: name.trim() },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "板块名称已存在" },
          { status: 400 }
        );
      }
    }

    // 更新板块
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json({ 
      message: "板块更新成功", 
      category: updatedCategory 
    });
  } catch (error) {
    // 更新板块失败
    return NextResponse.json(
      { error: `更新板块失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
}

// DELETE - 删除板块
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;

    // 验证是否为管理员
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

    // 检查板块是否存在
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { posts: { select: { id: true } } }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "板块不存在" },
        { status: 404 }
      );
    }

    // 删除板块及其所有帖子（级联删除会自动删除相关评论）
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ 
      message: "板块删除成功",
      deletedPostsCount: existingCategory.posts.length
    });
  } catch (error) {
    // 删除板块失败
    return NextResponse.json(
      { error: `删除板块失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
} 