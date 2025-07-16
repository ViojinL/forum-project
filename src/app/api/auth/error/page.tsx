"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'unknown';
  
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'CredentialsSignin':
        return '用户名或密码错误';
      case 'EmailSignin':
        return '邮箱验证失败';
      case 'OAuthSignin':
        return '第三方登录失败';
      case 'OAuthCallback':
        return '第三方回调失败';
      case 'OAuthCreateAccount':
        return '创建账户失败';
      case 'EmailCreateAccount':
        return '邮箱创建账户失败';
      case 'Callback':
        return '回调错误';
      case 'OAuthAccountNotLinked':
        return '该邮箱已与其他账户关联';
      case 'EmailSend':
        return '邮件发送失败';
      case 'CredentialsSignup':
        return '注册失败';
      case 'SessionRequired':
        return '需要登录';
      case 'AccessDenied':
        return '访问被拒绝';
      case 'Verification':
        return '验证失败';
      default:
        return '未知错误';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white font-bold text-xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            认证失败
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-2xl sm:px-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <div className="font-medium">登录失败</div>
                <div className="text-sm mt-1">错误代码: {error}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">可能的解决方案：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>检查用户名和密码是否正确</li>
                <li>清除浏览器缓存和Cookie</li>
                <li>稍后重试</li>
                <li>如果问题持续，请联系管理员</li>
              </ul>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Link 
                href="/login" 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                重新登录
              </Link>
              
              <Link 
                href="/clear-cookies" 
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                清除缓存
              </Link>
              
              <Link 
                href="/" 
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
} 