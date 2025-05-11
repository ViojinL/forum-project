'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const [sessionString, setSessionString] = useState<string>('');

  useEffect(() => {
    if (session) {
      setSessionString(JSON.stringify(session, null, 2));
    }
  }, [session]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">会话调试</h1>
      
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          返回首页
        </Link>
      </div>
      
      <div className="mb-4">
        <p>状态: {status}</p>
      </div>
      
      {session ? (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">会话信息</h2>
            <div className="bg-gray-100 p-4 rounded overflow-auto">
              <pre>{sessionString}</pre>
            </div>
          </div>
          
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">用户信息</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p>用户名: {session.user?.username || session.user?.name || '未知'}</p>
              <p>邮箱: {session.user?.email || '未知'}</p>
              <p>ID: {session.user?.id || '未知'}</p>
              <p>是否管理员: {session.user?.isAdmin ? '是' : '否'}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-red-500">
          未登录，请先<Link href="/login" className="text-blue-600 hover:underline">登录</Link>
        </div>
      )}
    </div>
  );
} 