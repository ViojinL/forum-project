"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Error431Page() {
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();

  useEffect(() => {
    // 倒计时自动跳转到修复页面
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/clear-all');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">⚠️</span>
          </div>
          <h1 className="text-4xl font-bold text-red-900 mb-4">
            431错误
          </h1>
          <h2 className="text-xl text-red-700 mb-6">
            Request Header Fields Too Large
          </h2>
          <p className="text-red-600 mb-8">
            您的请求头过大，这通常是由于Cookie数据过多导致的。
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-lg border border-red-200 sm:rounded-2xl sm:px-10">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⏱️</span>
              <span className="font-semibold">自动修复倒计时</span>
            </div>
            <p className="text-sm mt-1">
              {countdown}秒后将自动跳转到修复页面
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-blue-500 mr-2">💡</span>
              <span className="font-semibold">问题说明</span>
            </div>
            <p className="text-sm mt-2">
              431错误表示您的浏览器发送的请求头过大。这通常是由以下原因造成的：
            </p>
            <ul className="text-sm mt-2 ml-4 space-y-1">
              <li>• Cookie数据过多</li>
              <li>• 认证token过大</li>
              <li>• 浏览器缓存问题</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Link 
              href="/clear-all"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              🔧 立即修复431错误
            </Link>
            
            <Link 
              href="/debug-headers"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              🔍 诊断请求头信息
            </Link>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 text-center mb-3">
                手动解决方案：
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <button
                  onClick={() => {
                    // 清理localStorage
                    localStorage.clear();
                    alert('localStorage已清理');
                  }}
                  className="px-3 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  清理本地存储
                </button>
                <button
                  onClick={() => {
                    // 清理cookie
                    document.cookie.split(";").forEach(function(c) { 
                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                    });
                    alert('Cookie已清理');
                  }}
                  className="px-3 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  清理Cookie
                </button>
              </div>
            </div>

            <div className="text-center">
              <Link 
                href="/"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                ← 返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 