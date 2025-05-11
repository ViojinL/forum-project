import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 获取热门帖子列表
export async function GET() {
  try {
    // 从数据库获取帖子并按评论数排序
    const hotPosts = await prisma.post.findMany({
      take: 10, // 获取前10个评论数最多的帖子
      orderBy: {
        comments: {
          _count: 'desc' // 按评论数降序排序
        }
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            comments: true
          }
        }
      }
    });
    
    // 转换为前端所需的格式
    const formattedHotPosts = hotPosts.map(post => ({
      id: post.id,
      title: post.title,
      commentCount: post._count.comments // 使用实际评论数
    }));
    
    return NextResponse.json({ posts: formattedHotPosts });
  } catch (error) {
    console.error('获取热门帖子失败:', error);
    return NextResponse.json(
      { error: '获取热门帖子失败，请稍后再试' },
      { status: 500 }
    );
  }
}
