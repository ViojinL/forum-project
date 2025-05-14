import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    
    // 定义包含 isAdmin 属性的用户类型
    interface AdminUser {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      isAdmin?: boolean;
      creditScore?: number;
      // 使用unknown代替any，保持类型安全
      [key: string]: string | number | boolean | undefined;
    }
    
    if (!session || !session.user || !(session.user as AdminUser).isAdmin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }
    
    // 并行获取各种统计数据
    const [
      postCount,
      commentCount,
      userCount,
      categoryCount
    ] = await Promise.all([
      prisma.post.count(),
      prisma.comment.count(),
      prisma.user.count(),
      prisma.category.count()
    ]);
    
    // 返回统计数据
    return NextResponse.json({
      posts: postCount,
      comments: commentCount,
      users: userCount,
      categories: categoryCount
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' }, 
      { status: 500 }
    );
  }
}
