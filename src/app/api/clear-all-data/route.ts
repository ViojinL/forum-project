import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('开始强制清理所有数据...');
    
    // 获取所有cookie
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: '所有数据已强制清理',
      clearedCookies: allCookies.length,
      clearedSessions: 0
    });

    // 清除所有cookie
    allCookies.forEach((cookie) => {
      response.cookies.delete(cookie.name);
      // 多路径清除
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/api',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    // 清除所有可能的NextAuth cookies
    const authCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'authjs.session-token',
      'authjs.csrf-token',
      'authjs.callback-url',
      'next-auth.pkce.code_verifier',
      'next-auth.state',
      'next-auth.nonce'
    ];

    authCookies.forEach(cookieName => {
      response.cookies.delete(cookieName);
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    // 清除数据库中的所有session
    try {
      const deletedSessions = await prisma.session.deleteMany({});
      console.log(`删除了 ${deletedSessions.count} 个数据库session`);
      
      // 也清除Account表中的token
      await prisma.account.updateMany({
        data: {
          refresh_token: null,
          access_token: null,
          id_token: null,
        }
      });
      
      response.headers.set('X-Cleared-Sessions', deletedSessions.count.toString());
    } catch (dbError) {
      console.error('清理数据库session时出错:', dbError);
    }

    // 设置强制不缓存的响应头
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    console.log('强制清理完成');
    return response;

  } catch (error) {
    console.error('清理数据错误:', error);
    const response = NextResponse.json(
      { 
        success: false, 
        error: '清理数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
    
    // 即使出错也尝试清理cookie
    const authCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'authjs.session-token',
      'authjs.csrf-token',
      'authjs.callback-url'
    ];

    authCookies.forEach(cookieName => {
      response.cookies.delete(cookieName);
      response.cookies.set(cookieName, '', {
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

export async function GET(request: NextRequest) {
  // GET请求也执行清理
  return POST(request);
} 