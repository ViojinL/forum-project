'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HeaderDebugData {
  totalHeaderSize: number;
  cookieSize: number;
  headerCount: number;
  cookieCount: number;
  largestCookies: Array<{
    name: string;
    size: number;
    value: string;
  }>;
  recommendations: string[];
  headers?: Record<string, string>;
}

export default function DebugHeadersPage() {
  const [data, setData] = useState<HeaderDebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/debug-headers')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || '获取数据失败');
        }
      })
      .catch(err => {
        setError('网络请求失败: ' + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSizeColor = (size: number, threshold: number) => {
    if (size > threshold) return 'text-red-600';
    if (size > threshold * 0.7) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在分析请求头...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">分析失败</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">请求头诊断</h1>
          <p className="text-gray-600">分析当前请求头大小，帮助诊断431错误</p>
        </div>

        {data && (
          <div className="space-y-6">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">总请求头大小</h3>
                <p className={`text-2xl font-bold ${getSizeColor(data.totalHeaderSize, 8192)}`}>
                  {formatBytes(data.totalHeaderSize)}
                </p>
                <p className="text-xs text-gray-400 mt-1">建议 &lt; 8KB</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Cookie大小</h3>
                <p className={`text-2xl font-bold ${getSizeColor(data.cookieSize, 4096)}`}>
                  {formatBytes(data.cookieSize)}
                </p>
                <p className="text-xs text-gray-400 mt-1">建议 &lt; 4KB</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">请求头数量</h3>
                <p className="text-2xl font-bold text-blue-600">{data.headerCount}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Cookie数量</h3>
                <p className={`text-2xl font-bold ${data.cookieCount > 20 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.cookieCount}
                </p>
                <p className="text-xs text-gray-400 mt-1">建议 &lt; 20个</p>
              </div>
            </div>

            {/* 建议 */}
            {data.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ 建议</h3>
                <ul className="space-y-2">
                  {data.recommendations.map((rec, index) => (
                    <li key={index} className="text-yellow-700 flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 最大的Cookie */}
            {data.largestCookies.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">最大的Cookie</h3>
                  <p className="text-sm text-gray-600">按大小排序的前10个cookie</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大小</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">值（预览）</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.largestCookies.map((cookie, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cookie.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={getSizeColor(cookie.size, 200)}>
                              {formatBytes(cookie.size)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {cookie.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/clear-cookies"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                清理所有数据
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                重新分析
              </button>
              <Link 
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                返回首页
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 