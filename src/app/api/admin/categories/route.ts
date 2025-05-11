import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - 创建新板块
export async function POST(req: NextRequest) {
  try {
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
    const { name, description } = await req.json();

    // 验证名称不为空
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "板块名称不能为空" },
        { status: 400 }
      );
    }

    // 检查板块名称是否已存在
    const existingCategory = await prisma.category.findFirst({
      where: { name: name.trim() },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "板块名称已存在" },
        { status: 400 }
      );
    }

    // 创建新板块
    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json({ 
      message: "板块创建成功", 
      category: newCategory 
    }, { status: 201 });
  } catch (error) {
    console.error("创建板块失败:", error);
    return NextResponse.json(
      { error: `创建板块失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
} 