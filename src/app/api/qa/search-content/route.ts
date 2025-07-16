import { NextRequest, NextResponse } from 'next/server';
import { ContentIndexer } from '@/services/contentIndexer';

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
    
    // 从论坛内容中搜索相关信息
    const searchResults = await ContentIndexer.searchContent(question, categoryId);
    
    // 生成回答
    let answer = '';
    if (searchResults.length > 0) {
      answer = ContentIndexer.generateAnswer(searchResults);
      
      // 返回搜索结果和生成的回答
      return NextResponse.json({
        answer,
        searchResults,
        source: 'content'
      });
    } else {
      // 如果没有找到相关内容，返回空结果
      return NextResponse.json({
        answer: '',
        searchResults: [],
        source: 'content'
      });
    }
  } catch (error) {
    console.error('搜索内容失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
