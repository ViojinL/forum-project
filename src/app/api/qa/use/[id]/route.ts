import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // 查找知识库条目
    const knowledgeItem = await prisma.knowledgeBase.findUnique({
      where: { id },
    });
    
    if (!knowledgeItem) {
      return NextResponse.json(
        { error: '知识库条目不存在' },
        { status: 404 }
      );
    }
    
    // 更新使用次数
    await prisma.knowledgeBase.update({
      where: { id },
      data: {
        timesUsed: knowledgeItem.timesUsed + 1,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新知识库使用次数失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
