import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// 获取所有知识库条目
export async function GET() {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: '未授权访问，需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取所有知识库条目，包括分类信息
    const knowledgeItems = await prisma.knowledgeBase.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timesUsed: 'desc',
      },
    });

    // 格式化数据，添加分类名称
    const formattedItems = knowledgeItems.map(item => ({
      ...item,
      categoryName: item.category?.name,
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('获取知识库失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 创建知识库条目
export async function POST(req: NextRequest) {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: '未授权访问，需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取请求体
    const body = await req.json();
    const { question, answer, categoryId } = body;

    // 验证参数
    if (!question || !answer) {
      return NextResponse.json(
        { error: '问题和答案不能为空' },
        { status: 400 }
      );
    }

    // 检查是否已存在相同问题
    const existingItem = await prisma.knowledgeBase.findFirst({
      where: {
        question: {
          equals: question,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: '此问题已存在于知识库中' },
        { status: 409 }
      );
    }

    // 创建知识库条目
    const newItem = await prisma.knowledgeBase.create({
      data: {
        question,
        answer,
        categoryId: categoryId || null,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('创建知识库条目失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
