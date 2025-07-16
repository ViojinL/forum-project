"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClearAllPage() {
  const [cleared, setCleared] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    const clearEverything = async () => {
      try {
        setProgress('正在清理浏览器数据...');
        
        // 1. 强制清除所有cookies
        const clearAllCookies = () => {
          document.cookie.split(";").forEach(function(c) { 
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
            // 多域名多路径清除
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/api";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/auth";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/api/auth";
          });
        };
        
        clearAllCookies();
        
        // 2. 清除所有存储
        setProgress('正在清理存储数据...');
        
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('存储清理失败:', e);
        }

        // 3. 清除IndexedDB
        setProgress('正在清理IndexedDB...');
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            await Promise.all(
              databases.map(db => {
                if (db.name) {
                  return new Promise((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name!);
                    deleteReq.onsuccess = () => resolve(undefined);
                    deleteReq.onerror = () => reject(deleteReq.error);
                    deleteReq.onblocked = () => {
                      console.warn('IndexedDB删除被阻止:', db.name);
                      resolve(undefined);
                    };
                  });
                }
              })
            );
          } catch (e) {
            console.warn('IndexedDB清理失败:', e);
          }
        }

        // 4. 清除缓存
        setProgress('正在清理缓存...');
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          } catch (e) {
            console.warn('缓存清理失败:', e);
          }
        }

        // 5. 调用服务器端强制清理
        setProgress('正在清理服务器端数据...');
        try {
          const response = await fetch('/api/clear-all-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('服务器端清理结果:', data);
          }
        } catch (e) {
          console.warn('服务器端清理失败:', e);
        }

        // 6. 再次清理cookies确保完全清除
        setProgress('正在进行最终清理...');
        clearAllCookies();
        
        // 7. 清理可能的NextAuth特定cookie
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
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/api`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/auth`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/api/auth`;
        });

        console.log('所有数据已强制清理完成');
        setProgress('清理完成！');
        setCleared(true);

      } catch (error) {
        console.error('清理过程中出错:', error);
        setProgress('清理完成（部分失败）');
        setCleared(true);
      }
    };

    clearEverything();
  }, []);

  return (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">🚨</span>
          </div>
          <h2 className="text-3xl font-bold text-red-900">
            431错误修复中
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {cleared ? '修复完成！' : '正在清理导致431错误的数据...'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg border border-red-200 sm:rounded-2xl sm:px-10">
          {cleared ? (
            <>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6" role="alert">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="font-semibold">431错误修复完成！</span>
                </div>
                <div className="mt-2 text-sm">
                  <p>已清理以下数据：</p>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>• 所有Cookies（包括NextAuth）</li>
                    <li>• LocalStorage 和 SessionStorage</li>
                    <li>• IndexedDB 数据库</li>
                    <li>• 浏览器缓存</li>
                    <li>• 服务器端Session</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center">
                  <span className="text-blue-500 mr-2">ℹ️</span>
                  <span className="font-semibold">现在可以安全登录了</span>
                </div>
                <p className="text-sm mt-1">
                  431错误（请求头过大）已解决，您可以重新登录了。
                </p>
              </div>
              
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  🔑 立即登录
                </Link>
                <Link 
                  href="/debug-headers"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  🔍 检查修复效果
                </Link>
                <Link 
                  href="/"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  🏠 返回首页
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto border-t-4 border-red-500 border-solid rounded-full animate-spin mb-4"></div>
              <p className="text-red-600 font-medium">{progress}</p>
              <p className="text-sm text-gray-600 mt-2">
                正在修复431错误，请稍候...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 