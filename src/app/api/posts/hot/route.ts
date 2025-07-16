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
        author: {
          select: {
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });
    
    return NextResponse.json({ posts: hotPosts });
  } catch (error) {
    console.error('获取热门帖子失败:', error);
    return NextResponse.json(
      { error: '获取热门帖子失败，请稍后再试' },
      { status: 500 }
    );
  }
}
