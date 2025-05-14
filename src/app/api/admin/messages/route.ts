import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST to send a message to a user
export async function POST(req: NextRequest) {
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

    // Get message data from request
    const { userId, message, type = "admin" } = await req.json();

    // Validate input
    if (!userId || !message) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    let inboxMessages = [];
    
    // Handle "all" users case
    if (userId === "all") {
      // Get all non-admin users
      const users = await prisma.user.findMany({
        where: { 
          isAdmin: false 
        },
        select: { id: true }
      });
      
      if (users.length === 0) {
        return NextResponse.json(
          { error: "没有找到用户" },
          { status: 404 }
        );
      }
      
      // Create message for each user
      const messageData = users.map(user => ({
        userId: user.id,
        message,
        type,
        isRead: false
      }));
      
      // Create all messages in a transaction
      inboxMessages = await prisma.$transaction(
        messageData.map(data => 
          prisma.userInbox.create({ data })
        )
      );
    } else {
      // Check if single user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!userExists) {
        return NextResponse.json(
          { error: "用户不存在" },
          { status: 404 }
        );
      }

      // Create inbox message for single user
      const inboxMessage = await prisma.userInbox.create({
        data: {
          userId,
          message,
          type,
          isRead: false
        }
      });
      
      inboxMessages = [inboxMessage];
    }

    return NextResponse.json({ 
      success: true, 
      message: `消息发送成功 (${inboxMessages.length}条)`, 
      data: inboxMessages 
    });
  } catch (error) {
    console.error("发送消息失败:", error);
    return NextResponse.json(
      { error: "发送消息失败，请稍后再试" },
      { status: 500 }
    );
  }
}
