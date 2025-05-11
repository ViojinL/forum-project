import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET to fetch count of unread inbox messages
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

    // Count unread messages
    const count = await prisma.userInbox.count({
      where: { 
        userId,
        isRead: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("获取未读消息数量失败:", error);
    return NextResponse.json(
      { error: "获取未读消息数量失败，请稍后再试" },
      { status: 500 }
    );
  }
} 