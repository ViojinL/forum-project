import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 检查所有请求头大小
  const cookieHeader = request.headers.get('cookie') || '';
  const userAgent = request.headers.get('user-agent') || '';
  const authorization = request.headers.get('authorization') || '';
  
  // 计算总请求头大小
  let totalHeaderSize = 0;
  request.headers.forEach((value, key) => {
    totalHeaderSize += key.length + value.length + 4; // +4 for ": " and "\r\n"
  });
  
  // 如果总请求头大小超过6KB或cookie超过3KB，重定向到431错误页面
  if (totalHeaderSize > 6144 || cookieHeader.length > 3072) {
    console.warn('检测到431错误风险:', {
      totalSize: totalHeaderSize,
      cookieSize: cookieHeader.length,
      path: request.nextUrl.pathname
    });
    
    // 不是错误处理相关页面则重定向到431错误页面
    if (!request.nextUrl.pathname.includes('error-431') && 
        !request.nextUrl.pathname.includes('clear') && 
        !request.nextUrl.pathname.includes('debug-headers') &&
        !request.nextUrl.pathname.includes('_next')) {
      
      const response = NextResponse.redirect(new URL('/error-431', request.url));
      
      // 强制清除所有可能的cookie
      const cookieNames = [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.csrf-token',
        'authjs.session-token',
        'authjs.csrf-token',
        'authjs.callback-url'
      ];
      
      cookieNames.forEach(name => {
        response.cookies.delete(name);
        response.cookies.set(name, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      });
      
      return response;
    }
  }
  
  // 设置更严格的缓存控制
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     * - api/auth (避免无限重定向)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}; 