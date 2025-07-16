"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Test431Page() {
  const [isSimulating, setIsSimulating] = useState(false);

  const simulatelargeHeaders = () => {
    setIsSimulating(true);
    
    // 创建大量的localStorage数据来增加请求头大小
    const largeData = 'x'.repeat(1000);
    
    // 设置大量cookie
    for (let i = 0; i < 50; i++) {
      document.cookie = `test_cookie_${i}=${largeData}; path=/`;
    }
    
    // 刷新页面触发中间件检查
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const clearTestData = () => {
    // 清理测试cookie
    for (let i = 0; i < 50; i++) {
      document.cookie = `test_cookie_${i}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
    alert('测试数据已清理');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            431错误测试页面
          </h1>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">测试说明</h3>
            <p className="text-yellow-700 text-sm">
              此页面用于测试431错误处理机制。点击下方按钮将模拟创建大量cookie数据，
              触发中间件的431错误检测，然后自动重定向到错误处理页面。
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={simulatelargeHeaders}
              disabled={isSimulating}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSimulating ? '正在模拟431错误...' : '🧪 模拟431错误'}
            </button>

            <button
              onClick={clearTestData}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700"
            >
              🧹 清理测试数据
            </button>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">快速链接</h3>
              <div className="grid grid-cols-1 gap-2">
                <Link 
                  href="/debug-headers"
                  className="text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  🔍 检查当前请求头状态
                </Link>
                <Link 
                  href="/clear-all"
                  className="text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  🔧 清理所有数据
                </Link>
                <Link 
                  href="/error-431"
                  className="text-center bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  ⚠️ 查看431错误页面
                </Link>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-500 text-sm"
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