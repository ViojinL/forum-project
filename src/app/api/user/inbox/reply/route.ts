import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST to reply to an admin message
export async function POST(req: NextRequest) {
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
    const { messageId, replyContent } = await req.json();

    // Validate input
    if (!messageId || !replyContent) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // Verify the original message exists and belongs to this user
    const originalMessage = await prisma.userInbox.findUnique({
      where: { 
        id: messageId,
        userId: userId 
      }
    });

    if (!originalMessage) {
      return NextResponse.json(
        { error: "消息不存在或您无权回复" },
        { status: 404 }
      );
    }

    // Find admin users to send the reply to
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    });

    if (adminUsers.length === 0) {
      return NextResponse.json(
        { error: "无法发送回复，找不到管理员" },
        { status: 500 }
      );
    }

    // Create a message for each admin
    const replyMessages = await prisma.$transaction(
      adminUsers.map(admin => 
        prisma.userInbox.create({
          data: {
            userId: admin.id,
            message: `用户回复: ${replyContent}\n\n(原消息: ${originalMessage.message})`,
            type: "user_reply",
            isRead: false,
            // Store reference to the original message ID and the user who sent the reply
            relatedPostId: originalMessage.relatedPostId,
            relatedCommentId: originalMessage.relatedCommentId
          }
        })
      )
    );

    // Mark the original message as read
    if (!originalMessage.isRead) {
      await prisma.userInbox.update({
        where: { id: messageId },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "回复已发送给管理员",
      data: replyMessages
    });
  } catch (error) {
    console.error("发送回复失败:", error);
    return NextResponse.json(
      { error: "发送回复失败，请稍后再试" },
      { status: 500 }
    );
  }
}
