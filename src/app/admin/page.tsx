"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    users: 0,
    categories: 0
  });

  // 在实际项目中，这里可以从API获取真实统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 模拟API调用，实际项目中可以替换为真实API
        // const response = await fetch('/api/admin/stats');
        // const data = await response.json();
        
        // 这里使用模拟数据，实际项目中应替换为真实数据
        setStats({
          posts: 3,
          comments: 3,
          users: 4,  // 包括管理员和普通用户
          categories: 4
        });
      } catch (error) {
        console.error("获取统计数据失败", error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: "帖子总数", 
      value: stats.posts, 
      icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
      color: "from-blue-400 to-blue-600",
      link: "/admin/posts"
    },
    { 
      title: "评论总数", 
      value: stats.comments, 
      icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
      color: "from-purple-400 to-purple-600",
      link: "/admin/comments"
    },
    { 
      title: "用户总数", 
      value: stats.users, 
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      color: "from-green-400 to-green-600",
      link: "/admin/users"
    },
    { 
      title: "板块总数", 
      value: stats.categories, 
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "from-amber-400 to-amber-600",
      link: "/admin/categories"
    }
  ];

  const adminFeatures = [
    { 
      title: "帖子管理", 
      description: "查看和管理所有帖子，删除违规内容",
      icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
      link: "/admin/posts",
      color: "text-blue-600"
    },
    { 
      title: "评论管理", 
      description: "查看和管理所有评论，删除违规内容",
      icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
      link: "/admin/comments",
      color: "text-purple-600"
    },
    { 
      title: "用户管理", 
      description: "管理用户，设置管理员权限和信用积分",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      link: "/admin/users",
      color: "text-green-600"
    },
    { 
      title: "板块管理", 
      description: "管理论坛板块，更新板块信息",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      link: "/admin/categories",
      color: "text-amber-600"
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          管理员控制台
        </h2>
        <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          今日: {new Date().toLocaleDateString('zh-CN')}
        </span>
      </div>

      {/* 统计卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Link 
            key={index} 
            href={card.link}
            className="block transform transition-all duration-300 hover:scale-105"
          >
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${card.color}`}></div>
              <div className="p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{card.title}</p>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 管理功能区域 */}
      <h3 className="text-xl font-semibold mb-5 text-gray-800">管理功能</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminFeatures.map((feature, index) => (
          <Link 
            key={index}
            href={feature.link} 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 ${feature.color}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* 系统信息区域 */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          系统信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
            <div className="mr-4 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">系统状态</p>
              <p className="text-sm font-medium">运行正常</p>
            </div>
          </div>
          <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
            <div className="mr-4 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">数据库</p>
              <p className="text-sm font-medium">连接正常</p>
            </div>
          </div>
          <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
            <div className="mr-4 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">上次更新</p>
              <p className="text-sm font-medium">{new Date().toLocaleTimeString('zh-CN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 