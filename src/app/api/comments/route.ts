import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET comments for a post
export async function GET(req: NextRequest) {
  try {
    console.log('开始获取评论');
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");

    if (!postId) {
      console.log('缺少postId参数');
      return NextResponse.json(
        { error: "缺少必要参数：postId" },
        { status: 400 }
      );
    }

    console.log('从数据库查询评论, postId:', postId);
    
    // 首先检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      console.log('找不到指定帖子:', postId);
      return NextResponse.json(
        { error: "找不到指定帖子" },
        { status: 404 }
      );
    }
    
        // 分两步获取评论，首先获取顶级评论（没有parentId的评论）
    console.log('获取顶级评论');
    const topLevelComments = await prisma.comment.findMany({
      where: { 
        postId,
        parentId: null 
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        }
      },
    });
    
    console.log('获取到顶级评论:', topLevelComments.length, '条');
    
    // 然后获取所有回复（有parentId的评论）
    const replies = await prisma.comment.findMany({
      where: { 
        postId,
        NOT: { parentId: null } 
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        }
      },
    });
    
    console.log('获取到回复:', replies.length, '条');
    
    console.log('获取到', replies.length, '条回复');
    
    // 组织评论和回复 - 将回复关联到父评论
    const commentsMap = new Map();
    
    // 首先将所有顶级评论添加到map中，并为每个评论添加空的replies数组
    topLevelComments.forEach(comment => {
      commentsMap.set(comment.id, {
        ...comment,
        replies: []
      });
    });
    
    // 然后将回复添加到它们的父评论中
    replies.forEach(reply => {
      if (reply.parentId && commentsMap.has(reply.parentId)) {
        commentsMap.get(reply.parentId).replies.push(reply);
      } else {
        // 如果找不到父评论，将其作为顶级评论处理
        commentsMap.set(reply.id, {
          ...reply,
          replies: []
        });
      }
    });
    
    // 将map转换回数组
    const organizedComments = Array.from(commentsMap.values());
    
    console.log('成功构建带回复的评论数据');
    return NextResponse.json({ comments: organizedComments });
  } catch (error) {
    console.error("获取评论失败 - 详细错误:", error);
    
    // 返回更具体的错误信息
    const errorMessage = error instanceof Error 
      ? `获取评论失败: ${error.message}` 
      : "获取评论时发生未知错误";
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST to create a new comment
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

    // 获取用户信息，检查积分和封禁状态
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditScore: true, banUntil: true, id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }
    
    // 检查用户信用积分是否低于80
    if (user.creditScore < 80) {
      // 设置封禁时间
      const banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // 更新用户封禁状态
      await prisma.user.update({
        where: { id: userId },
        data: { banUntil }
      });
      
      return NextResponse.json(
        { 
          error: "您的信用积分低于80，暂时被禁止发表评论24小时",
          creditScore: user.creditScore
        },
        { status: 403 }
      );
    }

    // 解析请求体
    const requestData = await req.json();
    const { content, postId, parentId } = requestData;

    if (!content || !postId) {
      return NextResponse.json(
        { error: "评论内容和帖子ID不能为空" },
        { status: 400 }
      );
    }

    // 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: "帖子不存在" },
        { status: 404 }
      );
    }

    // 检查如果是回复，确保父评论存在且属于同一帖子
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { postId: true }
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "要回复的评论不存在" },
          { status: 404 }
        );
      }

      if (parentComment.postId !== postId) {
        return NextResponse.json(
          { error: "评论与帖子不匹配" },
          { status: 400 }
        );
      }
    }

    // 创建新评论
    const comment = await prisma.comment.create({
      data: {
        content,
        author: {
          connect: { id: userId },
        },
        post: {
          connect: { id: postId },
        },
        // 如果有parentId，则设置父评论关系
        ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        parent: {
          select: {
            id: true,
            authorId: true,
            author: {
              select: {
                username: true
              }
            }
          }
        },
      },
    });
    
    // 如果是回复其他用户的评论，可以在这里添加通知逻辑
    if (parentId && comment.parent && comment.parent.authorId !== userId) {
      // 创建一条通知到收件箱
      await prisma.userInbox.create({
        data: {
          userId: comment.parent.authorId,
          message: `用户 ${session.user.name || '某用户'} 回复了您的评论: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
          type: "comment_reply",
          relatedPostId: postId,
          relatedCommentId: comment.id,
        }
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("创建评论失败:", error);
    return NextResponse.json(
      { error: "创建评论失败，请稍后再试" },
      { status: 500 }
    );
  }
}
