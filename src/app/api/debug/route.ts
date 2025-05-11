import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 获取所有用户的基本信息，不包括密码
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    // 获取Prisma模型信息
    const userModel = await prisma.user.findFirst();
    const userModelKeys = userModel ? Object.keys(userModel) : [];

    return NextResponse.json({ 
      users,
      debug: {
        userCount: users.length,
        prismaModelKeys: userModelKeys,
      }
    });
  } catch (error) {
    console.error("Debug API错误:", error);
    return NextResponse.json(
      { error: "调试API错误", details: String(error) },
      { status: 500 }
    );
  }
}
