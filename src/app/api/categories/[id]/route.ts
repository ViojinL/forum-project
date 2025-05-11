import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 获取特定分类的详细信息
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // 查找分类信息
    const category = await prisma.category.findUnique({
      where: { id: id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "找不到指定的分类" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("获取分类信息失败:", error);
    return NextResponse.json(
      { error: "获取分类信息失败，请稍后再试" },
      { status: 500 }
    );
  }
}
