import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 分析请求头
    const headers: Record<string, string> = {};
    let totalSize = 0;
    
    request.headers.forEach((value, key) => {
      headers[key] = value;
      totalSize += key.length + value.length + 4; // +4 for ": " and "\r\n"
    });
    
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieSize = cookieHeader.length;
    
    // 分析cookie
    const cookies = cookieHeader.split(';').map(c => c.trim()).filter(c => c);
    
    // 判断是否可能出现431错误
    const risk431 = totalSize > 8192 || cookieSize > 4096;
    
    return NextResponse.json({
      success: true,
      status: risk431 ? 'RISK' : 'OK',
      message: risk431 ? '可能出现431错误' : '正常，无431错误风险',
      data: {
        totalHeaderSize: totalSize,
        cookieSize: cookieSize,
        cookieCount: cookies.length,
        headerCount: Object.keys(headers).length,
        risk431: risk431,
        recommendations: [
          totalSize > 8192 ? "请求头总大小超过8KB，建议清理" : null,
          cookieSize > 4096 ? "Cookie大小超过4KB，建议清理" : null,
          cookies.length > 20 ? "Cookie数量过多，建议清理" : null,
        ].filter(Boolean),
      }
    });
    
  } catch (error) {
    console.error('测试431错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'ERROR',
        message: '测试失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // POST请求也执行相同的测试
  return GET(request);
} 