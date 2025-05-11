"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  email: string;
  contactInfo?: string;
  signature?: string;
  avatar?: string;
  creditScore?: number;
  banUntil?: string;
  createdAt: string;
  _count: {
    posts: number;
    comments: number;
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { data: session } = useSession();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 编辑状态和表单数据
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    contactInfo: "",
    signature: "",
  });
  
  // 是否是当前登录用户的个人页面
  const isCurrentUser = session?.user?.id === userId;
  
  useEffect(() => {
    // 监听权限变化，确保非当前用户永远不能编辑他人资料
    if (!isCurrentUser && isEditing) {
      setIsEditing(false);
    }
  }, [isCurrentUser, isEditing]);
  
  useEffect(() => {
    // 获取用户信息
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        console.log('正在获取用户信息, 用户ID:', userId);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "获取用户信息失败");
        }
        
        const data = await response.json();
        console.log('获取到的用户信息:', data);
        setUser(data.user);
        
        // 如果是编辑模式，初始化表单数据
        if (isCurrentUser) {
          setFormData({
            username: data.user.username || "",
            contactInfo: data.user.contactInfo || "",
            signature: data.user.signature || "",
          });
        }
      } catch (error) {
        console.error("加载用户信息失败:", error);
        setError(error instanceof Error ? error.message : "加载用户信息失败，请稍后再试");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, isCurrentUser]);

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 如果不是当前用户，禁止输入
    if (!isCurrentUser) return;
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交更新的个人信息
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 再次检查权限
    if (!isCurrentUser) {
      setError("您无权编辑该用户信息");
      setIsEditing(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新用户信息失败");
      }

      const data = await response.json();
      setUser(prev => prev ? { ...prev, ...data.user } : data.user);
      setIsEditing(false);
    } catch (error) {
      console.error("更新用户信息失败:", error);
      alert(error instanceof Error ? error.message : "更新用户信息失败，请稍后再试");
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center py-10">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center py-10">{error || "找不到该用户"}</div>
            <div className="text-center">
              <Link href="/" className="text-blue-500 hover:underline">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto py-8">
        {/* 导航 */}
        <div className="mb-4 text-sm breadcrumbs">
          <Link href="/" className="text-blue-500 hover:underline">
            首页
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">用户信息</span>
        </div>

        {/* 用户信息卡片 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          {isEditing && isCurrentUser ? (
            // 编辑模式
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">编辑个人信息</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
                <input
                  type="text"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  placeholder="您的联系方式，如邮箱、微信等"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个性签名</label>
                <textarea
                  name="signature"
                  value={formData.signature}
                  onChange={handleInputChange}
                  placeholder="您的个性签名"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  保存修改
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            // 显示模式
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{user.username}</h2>
                  {user.email && (
                    <p className="text-gray-600 mt-1">{user.email}</p>
                  )}
                </div>
                {isCurrentUser && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    编辑个人资料
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">个人信息</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">注册时间</p>
                      <p>{formatDate(user.createdAt)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">帖子/评论数</p>
                      <p className="font-medium">{user._count?.posts || 0} 帖子 / {user._count?.comments || 0} 评论</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">信用积分</p>
                      <p className={`font-medium ${
                        user.creditScore !== undefined && user.creditScore < 80 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {user.creditScore !== undefined ? user.creditScore : 100} 分
                      </p>
                    </div>
                    
                    {user.banUntil && new Date(user.banUntil) > new Date() ? (
                      <div>
                        <p className="text-sm text-gray-500">账号状态</p>
                        <p className="font-medium text-red-600">
                          已限制发帖评论至 {formatDate(user.banUntil)}
                        </p>
                      </div>
                    ) : user.creditScore !== undefined && user.creditScore < 80 ? (
                      <div>
                        <p className="text-sm text-gray-500">账号状态</p>
                        <p className="font-medium text-orange-600">
                          信用积分不足，限制发帖评论24小时
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">账号状态</p>
                        <p className="font-medium text-green-600">正常</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">论坛活动</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">发帖数量</p>
                      <p>{user._count.posts} 篇</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">评论数量</p>
                      <p>{user._count.comments} 条</p>
                    </div>
                    
                    {user.signature ? (
                      <div>
                        <p className="text-sm text-gray-500">个性签名</p>
                        <p className="italic">{user.signature}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">个性签名</p>
                        <p className="text-gray-400 italic">该用户还没有设置个性签名</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 基本信息部分 */}
        <div className="bg-gray-50 p-4 rounded-lg mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">用户信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">注册时间</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">帖子/评论数</p>
              <p className="font-medium">{user._count?.posts || 0} 帖子 / {user._count?.comments || 0} 评论</p>
            </div>
            {/* 添加信用积分和封禁状态 */}
            <div>
              <p className="text-sm text-gray-500">信用积分</p>
              <p className={`font-medium ${
                user.creditScore !== undefined && user.creditScore < 80 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {user.creditScore !== undefined ? user.creditScore : 100} 分
              </p>
            </div>
            {user.banUntil && new Date(user.banUntil) > new Date() ? (
              <div>
                <p className="text-sm text-gray-500">账号状态</p>
                <p className="font-medium text-red-600">
                  已限制发帖评论至 {formatDate(user.banUntil)}
                </p>
              </div>
            ) : user.creditScore !== undefined && user.creditScore < 80 ? (
              <div>
                <p className="text-sm text-gray-500">账号状态</p>
                <p className="font-medium text-orange-600">
                  信用积分不足，限制发帖评论24小时
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">账号状态</p>
                <p className="font-medium text-green-600">正常</p>
              </div>
            )}
          </div>
          
          {/* 信用积分说明 */}
          {isCurrentUser && (
            <div className="mt-4 text-sm bg-blue-50 p-3 rounded">
              <h4 className="font-medium text-blue-700">信用积分说明：</h4>
              <ul className="list-disc list-inside mt-1 text-gray-600 space-y-1">
                <li>初始信用积分为100分</li>
                <li>发布违规内容将被扣分：帖子-5分，评论-1分</li>
                <li>信用积分低于80分将限制发帖评论权限24小时</li>
                <li>请遵守社区规则，维护良好的讨论环境</li>
              </ul>
            </div>
          )}
        </div>
        
        {/* 用户帖子列表将在这里添加 */}
      </div>
    </div>
  );
}

