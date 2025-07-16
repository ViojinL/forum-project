import { serialize, parse } from 'cookie';

// 设置短期cookie选项，避免cookie过大
export const cookieOptions = {
  maxAge: 6 * 60 * 60, // 6小时而不是一周，减少cookie大小
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

// 获取cookie的辅助函数
export function getCookie(cookieStr: string, name: string) {
  const cookies = parse(cookieStr || '');
  return cookies[name];
}

// 生成清除cookie的字符串
export function getClearCookieString(name: string) {
  return serialize(name, '', {
    maxAge: -1,
    path: '/',
  });
}

// 客户端清除cookie的方法 - 增强版
export function clientClearCookies() {
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    // 清除不同路径和域名的cookie
    const domains = [
      window.location.hostname,
      '.' + window.location.hostname,
      'localhost',
      '.localhost'
    ];
    
    const paths = ['/', '/api', '/auth'];
    
    for (const domain of domains) {
      for (const path of paths) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
      }
    }
  }
  
  // 清除localStorage和sessionStorage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.log('清理存储时出错:', error);
  }
}
