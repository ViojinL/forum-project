"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";

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
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 编辑状态和表单数据
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    contactInfo: "",
    signature: "",
    avatar: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
            avatar: data.user.avatar || "",
          });
          if (data.user.avatar) {
            setAvatarPreview(data.user.avatar);
          }
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

  // 处理头像上传
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrentUser || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 限制文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const avatarDataUrl = event.target.result as string;
        setAvatarPreview(avatarDataUrl);
        setFormData(prev => ({
          ...prev,
          avatar: avatarDataUrl
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // 触发文件选择对话框
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
      
      // 如果需要刷新session（更新了头像或用户名）
      if (data.needsSessionRefresh) {
        console.log('头像或用户名已更新，刷新页面以更新导航栏显示');
        // 使用数据库session策略，session会自动更新，只需刷新页面
        // 使用 Next.js 的路由刷新而不是 window.location.reload()
        router.refresh();
      }
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
      <div className="container mx-auto py-8 px-4">
        {/* 面包屑导航 - 统一样式 */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              首页
            </Link>
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              用户信息
            </span>
          </nav>
        </div>

        {/* 用户信息卡片 - 统一样式 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {isEditing && isCurrentUser ? (
            // 编辑模式
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">编辑个人信息</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">头像</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100 border-2 border-gray-200">
                      {avatarPreview ? (
                        <Image 
                          src={avatarPreview} 
                          alt="头像预览" 
                          fill 
                          sizes="(max-width: 80px) 100vw, 80px"
                          className="object-cover" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex items-center justify-center h-full w-full bg-gray-600 text-white font-semibold text-lg">
                                  ${formData.username.charAt(0).toUpperCase()}
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gray-600 text-white font-semibold text-lg">
                          {formData.username ? formData.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                      >
                        更换头像
                      </button>
                      <p className="text-xs text-gray-500 mt-1">建议上传正方形图片，最大不超过2MB</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">联系方式</label>
                <input
                  type="text"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  placeholder="您的联系方式，如邮箱、微信等"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">个性签名</label>
                <textarea
                  name="signature"
                  value={formData.signature}
                  onChange={handleInputChange}
                  placeholder="您的个性签名"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  保存修改
                </button>
              </div>
            </form>
          ) : (
            // 显示模式
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-100 border-2 border-gray-200 mr-4">
                    {user.avatar ? (
                      <Image 
                        src={user.avatar} 
                        alt={`${user.username}的头像`} 
                        fill 
                        sizes="(max-width: 64px) 100vw, 64px"
                        className="object-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex items-center justify-center h-full w-full bg-gray-600 text-white font-semibold text-lg">
                                ${user.username.charAt(0).toUpperCase()}
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gray-600 text-white font-semibold text-lg">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                    {user.email && (
                      <p className="text-gray-600 mt-1">{user.email}</p>
                    )}
                    {user.signature && (
                      <p className="text-gray-500 text-sm mt-1 italic">"{user.signature}"</p>
                    )}
                  </div>
                </div>
                
                {isCurrentUser && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    编辑资料
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    基本信息
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">注册时间</p>
                      <p className="font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">联系方式</p>
                      <p className="font-medium">{user.contactInfo || '未设置'}</p>
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
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    活跃度统计
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">发布帖子</p>
                      <p className="font-medium text-blue-600">{user._count?.posts || 0} 篇</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">发表评论</p>
                      <p className="font-medium text-green-600">{user._count?.comments || 0} 条</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">账号状态</p>
                      {user.banUntil && new Date(user.banUntil) > new Date() ? (
                        <p className="font-medium text-red-600">
                          已限制发帖评论至 {formatDate(user.banUntil)}
                        </p>
                      ) : user.creditScore !== undefined && user.creditScore < 80 ? (
                        <p className="font-medium text-orange-600">
                          信用积分不足，限制发帖评论24小时
                        </p>
                      ) : (
                        <p className="font-medium text-green-600">正常</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

