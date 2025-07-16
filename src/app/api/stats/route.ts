import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 获取今天的开始时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 并行获取各种统计数据
    const [
      userCount,
      postCount,
      commentCount,
      todayPostCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.post.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      })
    ]);
    
    // 返回统计数据
    return NextResponse.json({
      users: userCount,
      posts: postCount,
      comments: commentCount,
      todayPosts: todayPostCount
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' }, 
      { status: 500 }
    );
  }
} 