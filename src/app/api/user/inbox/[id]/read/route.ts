import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// PUT to mark a message as read
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find the message
    const message = await prisma.userInbox.findUnique({
      where: { id }
    });

    if (!message) {
      return NextResponse.json(
        { error: "消息不存在" },
        { status: 404 }
      );
    }

    // Verify that the message belongs to the user
    if (message.userId !== userId) {
      return NextResponse.json(
        { error: "无权限操作该消息" },
        { status: 403 }
      );
    }

    // Update the message to mark as read
    const updatedMessage = await prisma.userInbox.update({
      where: { id },
      data: { isRead: true }
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error("标记消息已读失败:", error);
    return NextResponse.json(
      { error: "标记消息已读失败，请稍后再试" },
      { status: 500 }
    );
  }
} 