import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = {};
    let totalSize = 0;
    
    // 收集所有请求头
    request.headers.forEach((value, key) => {
      headers[key] = value;
      totalSize += key.length + value.length + 4; // +4 for ": " and "\r\n"
    });
    
    // 计算cookie大小
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieSize = cookieHeader.length;
    
    // 分析cookie
    const cookies = cookieHeader.split(';').map(c => c.trim()).filter(c => c);
    const cookieAnalysis = cookies.map(cookie => {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('=');
      return {
        name: name?.trim() || '',
        size: cookie.length,
        value: value?.substring(0, 50) + (value?.length > 50 ? '...' : '') // 截断显示
      };
    }).sort((a, b) => b.size - a.size); // 按大小排序
    
    return NextResponse.json({
      success: true,
      data: {
        totalHeaderSize: totalSize,
        cookieSize: cookieSize,
        headerCount: Object.keys(headers).length,
        cookieCount: cookies.length,
        largestCookies: cookieAnalysis.slice(0, 10), // 显示最大的10个cookie
        recommendations: [
          totalSize > 8192 ? "请求头总大小超过8KB，建议清理cookie" : null,
          cookieSize > 4096 ? "Cookie大小超过4KB，建议清理" : null,
          cookies.length > 20 ? "Cookie数量过多，建议清理" : null,
        ].filter(Boolean),
        headers: process.env.NODE_ENV === 'development' ? headers : undefined, // 只在开发环境显示
      }
    });
    
  } catch (error) {
    console.error('Debug headers error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取请求头信息失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 