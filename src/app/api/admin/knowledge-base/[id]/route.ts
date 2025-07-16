import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// 获取单个知识库条目
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: '未授权访问，需要管理员权限' },
        { status: 403 }
      );
    }

    const id = params.id;

    // 获取知识库条目
    const knowledgeItem = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!knowledgeItem) {
      return NextResponse.json(
        { error: '知识库条目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...knowledgeItem,
      categoryName: knowledgeItem.category?.name,
    });
  } catch (error) {
    console.error('获取知识库条目失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 更新知识库条目
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: '未授权访问，需要管理员权限' },
        { status: 403 }
      );
    }

    const id = params.id;

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

    // 检查是否存在
    const existingItem = await prisma.knowledgeBase.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: '知识库条目不存在' },
        { status: 404 }
      );
    }

    // 检查是否有其他条目使用相同的问题（除了当前条目）
    const duplicateItem = await prisma.knowledgeBase.findFirst({
      where: {
        question: {
          equals: question,
        },
        id: {
          not: id,
        },
      },
    });

    if (duplicateItem) {
      return NextResponse.json(
        { error: '此问题已存在于其他知识库条目中' },
        { status: 409 }
      );
    }

    // 更新知识库条目
    const updatedItem = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        question,
        answer,
        categoryId: categoryId || null,
        updatedAt: new Date(),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedItem,
      categoryName: updatedItem.category?.name,
    });
  } catch (error) {
    console.error('更新知识库条目失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 删除知识库条目
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: '未授权访问，需要管理员权限' },
        { status: 403 }
      );
    }

    const id = params.id;

    // 检查是否存在
    const existingItem = await prisma.knowledgeBase.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: '知识库条目不存在' },
        { status: 404 }
      );
    }

    // 删除知识库条目
    await prisma.knowledgeBase.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除知识库条目失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
