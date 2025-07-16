import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// 改进的中文相似度计算函数
function calculateSimilarity(str1: string, str2: string): number {
  // 对于中文，我们使用字符级别的匹配而不是单词级别
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // 如果有精确匹配，直接返回最高相似度
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9; // 设为0.9而不是1.0，保留一些灵活性
  }
  
  // 字符级别匹配
  const chars1 = Array.from(s1);
  const chars2 = Array.from(s2);
  
  // 计算共同字符
  const set1 = new Set(chars1);
  const set2 = new Set(chars2);
  const intersection = new Set([...set1].filter(char => set2.has(char)));
  
  // 使用改进的Jaccard相似度，考虑到中文短语通常较短
  const union = new Set([...set1, ...set2]);
  
  // 基础相似度
  let similarity = intersection.size / union.size;
  
  // 长度差异惩罚 - 如果长度差异太大，降低相似度
  const lengthDiff = Math.abs(s1.length - s2.length) / Math.max(s1.length, s2.length);
  similarity = similarity * (1 - lengthDiff * 0.5);
  
  return similarity;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, categoryId } = body;
    
    if (!question || question.length < 1) {
      return NextResponse.json(
        { error: '问题不能为空' },
        { status: 400 }
      );
    }
    
    // 获取知识库条目
    let knowledgeItems = await prisma.knowledgeBase.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // 如果提供了分类ID，优先考虑该分类下的条目
    if (categoryId) {
      // 先对分类相同的项目进行处理
      const categorizedItems = knowledgeItems.filter(item => item.categoryId === categoryId);
      const otherItems = knowledgeItems.filter(item => item.categoryId !== categoryId);
      
      // 给同分类的项目增加相似度权重
      knowledgeItems = [
        ...categorizedItems,
        ...otherItems,
      ];
    }
    
    // 计算相似度并排序
    const suggestedAnswers = knowledgeItems.map(item => {
      const similarity = calculateSimilarity(question, item.question);
      
      // 如果是同一分类，增加相似度权重
      const categoryBoost = (item.categoryId === categoryId) ? 0.2 : 0;
      const finalSimilarity = Math.min(similarity + categoryBoost, 1);
      
      return {
        id: item.id,
        question: item.question,
        answer: item.answer,
        categoryId: item.categoryId,
        categoryName: item.category?.name,
        similarity: finalSimilarity,
      };
    })
    .filter(item => item.similarity > 0.1) // 只返回相似度大于10%的结果
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3); // 最多返回3个建议
    
    return NextResponse.json(suggestedAnswers);
  } catch (error) {
    console.error('获取问题建议失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
