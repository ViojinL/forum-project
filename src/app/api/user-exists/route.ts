import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // 从URL获取email参数
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: "邮箱参数必须提供" }, { status: 400 });
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true } // 只需要获取ID字段以确认存在性
    });

    // 返回用户是否存在的信息，不返回具体用户数据
    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("检查用户存在性时出错:", error);
    return NextResponse.json({ error: "检查用户失败" }, { status: 500 });
  }
} 