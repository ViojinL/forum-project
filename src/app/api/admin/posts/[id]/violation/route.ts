import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Define extended User type with the missing fields
interface ExtendedUser {
  id: string;
  creditScore: number;
  banUntil: Date | null;
  [key: string]: any;
}

// 违规理由请求参数
interface ViolationRequest {
  reason: string;
}

// POST to mark a post as a violation and deduct credit score
export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    console.log('收到标记违规请求，帖子ID:', context.params.id);
    const { id } = context.params;
    
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.error('未登录');
      return NextResponse.json(
        { error: "未登录，请先登录" },
        { status: 401 }
      );
    }

    // Verify admin status
    if (!session.user.isAdmin) {
      console.error('非管理员');
      return NextResponse.json(
        { error: "权限不足，需要管理员权限" },
        { status: 403 }
      );
    }

    if (!id) {
      console.error('帖子ID为空');
      return NextResponse.json(
        { error: "帖子ID不能为空" },
        { status: 400 }
      );
    }

    const adminId = session.user.id;
    console.log('管理员ID:', adminId);

    // 尝试解析请求体
    let requestData: ViolationRequest;
    try {
      requestData = await req.json();
      console.log('请求数据:', requestData);
    } catch (error) {
      console.error('请求体解析失败:', error);
      return NextResponse.json(
        { error: "请求格式错误" },
        { status: 400 }
      );
    }

    const reason = requestData.reason || "违反论坛规则";
    console.log('违规原因:', reason);

    // 查询该管理员是否已经标记过这个帖子
    const existingViolation = await prisma.postViolation.findUnique({
      where: {
        postId_adminId: {
          postId: id,
          adminId: adminId,
        }
      }
    });

    if (existingViolation) {
      console.log('已存在的违规记录:', existingViolation);
      return NextResponse.json(
        { error: "您已经标记过这个帖子，不能重复标记" },
        { status: 400 }
      );
    }

    // Check if post exists and get author info
    const post = await prisma.post.findUnique({
      where: { id: id },
      include: { author: true, violations: true }
    });

    if (!post) {
      console.error('找不到帖子');
      return NextResponse.json(
        { error: "找不到该帖子" },
        { status: 404 }
      );
    }
    
    console.log('找到帖子:', post.id, post.title);

    // 获取当前用户的信用积分信息
    const user = await prisma.user.findUnique({
      where: { id: post.authorId },
      select: { creditScore: true, banUntil: true }
    });

    if (!user) {
      console.error('找不到用户信息');
      return NextResponse.json(
        { error: "找不到该用户的信用积分信息" },
        { status: 404 }
      );
    }
    
    console.log('用户信用信息:', user);

    // 帖子扣除的积分点数
    const pointsDeducted = 5;

    // 计算新的信用积分
    const currentCreditScore = user.creditScore;
    const newCreditScore = Math.max(0, currentCreditScore - pointsDeducted);
    console.log('信用分变化:', currentCreditScore, '->', newCreditScore);

    // 检查是否需要封禁
    let banUntil = user.banUntil ? new Date(user.banUntil) : null;
    if (newCreditScore < 80 && (!banUntil || banUntil < new Date())) {
      // 封禁用户1天
      banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      console.log('用户被封禁至:', banUntil);
    }

    // 开始事务处理
    console.log('开始事务处理');
    try {
      const result = await prisma.$transaction([
        // 1. 创建违规标记记录
        prisma.postViolation.create({
          data: {
            postId: id,
            adminId: adminId,
            reason: reason,
            pointsDeducted: pointsDeducted
          }
        }),
        
        // 2. 更新帖子状态为违规
        prisma.post.update({
          where: { id: id },
          data: { isViolation: true }
        }),
        
        // 3. 更新用户信用积分和封禁状态
        prisma.user.update({
          where: { id: post.authorId },
          data: {
            creditScore: newCreditScore,
            banUntil: banUntil
          }
        }),
        
        // 4. 创建用户收件箱通知
        prisma.userInbox.create({
          data: {
            userId: post.authorId,
            message: `您的帖子《${post.title}》因${reason}被标记为违规，扣除${pointsDeducted}信用分。${newCreditScore < 80 ? '由于信用分低于80，您将被暂时禁言24小时。' : ''}`,
            type: "post_violation",
            relatedPostId: id
          }
        })
      ]);
      
      console.log('事务处理完成:', result);

      return NextResponse.json({ 
        message: "已标记为违规并扣除信用积分", 
        newCreditScore, 
        banned: banUntil && banUntil > new Date(),
        violationRecord: result[0]
      }, { status: 200 });
    } catch (dbError) {
      console.error('数据库事务失败:', dbError);
      return NextResponse.json(
        { error: `数据库操作失败: ${(dbError as Error).message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("标记违规帖子失败:", error);
    return NextResponse.json(
      { error: `标记违规帖子失败: ${(error as Error).message || '请稍后再试'}` },
      { status: 500 }
    );
  }
} 