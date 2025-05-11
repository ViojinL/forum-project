import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    // 获取请求体
    const { userId, creditScore } = await req.json();

    if (!userId || creditScore === undefined) {
      return NextResponse.json(
        { error: "用户ID和信用积分不能为空" },
        { status: 400 }
      );
    }

    console.log(`[调试工具] 正在更新用户 ${userId} 的信用积分为: ${creditScore}`);
    
    // 检查用户是否需要被封禁
    let banUntil = null;
    if (creditScore < 80) {
      // 封禁24小时
      banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    
    // 使用原始SQL更新用户信用积分
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "creditScore" = ${creditScore},
          "banUntil" = ${banUntil ? banUntil.toISOString() : null}
      WHERE "id" = ${userId}
    `;
    
    // 获取更新后的用户信息
    const updatedUser = await prisma.$queryRaw`
      SELECT "id", "email", "username", "creditScore", "banUntil", "isAdmin"
      FROM "User"
      WHERE "id" = ${userId}
    `;

    console.log("[调试工具] 用户信用积分更新成功:", updatedUser);

    return NextResponse.json({ 
      success: true, 
      user: (updatedUser as any[])[0],
      banned: banUntil !== null
    }, { status: 200 });
  } catch (error) {
    console.error("[调试工具] 更新用户信用积分失败:", error);
    return NextResponse.json(
      { error: `更新失败: ${(error as Error).message || '未知错误'}` },
      { status: 500 }
    );
  }
} 