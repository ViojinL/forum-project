import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET to fetch user's inbox messages
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch user's inbox messages
    const messages = await prisma.userInbox.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("获取收件箱信息失败:", error);
    return NextResponse.json(
      { error: "获取收件箱信息失败，请稍后再试" },
      { status: 500 }
    );
  }
} 