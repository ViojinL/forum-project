import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET to fetch user replies
export async function GET(req: NextRequest) {
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
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: "没有管理员权限" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch user replies from inbox
    const replies = await prisma.userInbox.findMany({
      where: {
        type: "user_reply",
        userId: session.user.id // Only show replies sent to this admin
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    // Count total replies for pagination
    const totalReplies = await prisma.userInbox.count({
      where: {
        type: "user_reply",
        userId: session.user.id
      }
    });

    return NextResponse.json({
      replies,
      pagination: {
        totalItems: totalReplies,
        currentPage: page,
        totalPages: Math.ceil(totalReplies / limit),
        limit
      }
    });
  } catch (error) {
    console.error("获取用户回复失败:", error);
    return NextResponse.json(
      { error: "获取用户回复失败，请稍后再试" },
      { status: 500 }
    );
  }
}
