"use client";

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { clientClearCookies } from '@/lib/cookies';
import Link from 'next/link';

export default function ClearCookiesPage() {
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // 立即清除所有cookies
    clientClearCookies();
    
    // 如果用户已登录，执行登出操作
    signOut({ redirect: false }).then(() => {
      setCleared(true);
    }).catch(error => {
      console.error("登出错误:", error);
      setCleared(true); // 即使有错误也标记为已清理
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {cleared ? '已清除Cookies' : '正在清除Cookies...'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {cleared ? (
              <>
                <p className="mb-4 text-green-600">所有Cookies已成功清除！</p>
                <p className="mb-8 text-gray-600">
                  这应该已解决了请求头过大(431错误)的问题。现在您可以尝试重新登录。
                </p>
                <div className="flex flex-col space-y-4">
                  <Link 
                    href="/login" 
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    返回登录页面
                  </Link>
                  <Link 
                    href="/" 
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    返回首页
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-gray-600">正在清除Cookies，请稍候...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
