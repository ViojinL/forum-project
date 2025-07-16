"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
}

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data && data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 获取未读消息数量
  useEffect(() => {
    if (session?.user) {
      const fetchUnreadMessages = async () => {
        try {
          const response = await fetch('/api/user/inbox/unread-count');
          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.count);
          }
        } catch (error) {
          console.error('获取未读消息失败:', error);
        }
      };

      fetchUnreadMessages();
    }
  }, [session]);

  // Apple风格用户头像
  const UserAvatar = ({ user, size = 'sm' }: { user: any, size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12'
    };

    const textSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    // 默认头像
    const initial = (user?.username || user?.name || 'U').charAt(0).toUpperCase();
    
    return (
      <div className={`${sizeClasses[size]} bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold ${textSizeClasses[size]} overflow-hidden`}>
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.username || user.name || "用户头像"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = initial;
            }}
          />
        ) : (
          initial
        )}
      </div>
    );
  };

  return (
    <>
      {/* Apple风格导航栏 */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧：Logo和导航 */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🎓</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">校园论坛</span>
              </Link>
              
              {/* 板块分类 */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100/60 transition-colors duration-200"
                >
                  <span className="text-sm font-medium">板块分类</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Apple风格下拉菜单 */}
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-[100]">
                    {isLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        加载中...
                      </div>
                    ) : categories.length > 0 ? (
                      categories.map(category => (
                        <Link
                          key={category.id}
                          href={`/category/${category.id}`}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          {category.name}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">暂无分类</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：搜索和用户菜单 */}
            <div className="flex items-center space-x-4">
              {/* 搜索框 */}
              <div className="hidden md:block">
                <SearchBar />
              </div>
              
              {session ? (
                <div className="flex items-center space-x-3">
                  {/* 发帖按钮 */}
                  <Link 
                    href="/create-post" 
                    className="hidden sm:flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
                  >
                    发帖
                  </Link>
                  
                  {/* 用户菜单 */}
                  <div className="relative">
                    <button 
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100/60 transition-colors duration-200"
                    >
                      <UserAvatar user={session.user} size="md" />
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {session.user?.username || session.user?.name}
                        </div>
                        {session.user?.isAdmin && (
                          <div className="text-xs text-blue-600">管理员</div>
                        )}
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Apple风格用户下拉菜单 - 修复z-index */}
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-[100]">
                        {/* 用户信息头部 */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <UserAvatar user={session.user} size="md" />
                            <div>
                              <div className="font-medium text-gray-900">{session.user?.username || session.user?.name}</div>
                              <div className="text-sm text-gray-500">{session.user?.email}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 菜单项 */}
                        <div className="py-1">
                          <Link 
                            href={`/user/${session.user?.id}`}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <span className="mr-3">👤</span>
                            个人资料
                          </Link>
                          
                          <Link 
                            href="/user/inbox"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <span className="mr-3">📧</span>
                            我的收件箱
                            {unreadCount > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] h-5 flex items-center justify-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                          </Link>
                          
                          {/* 移动端发帖链接 */}
                          <Link 
                            href="/create-post"
                            className="flex sm:hidden items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <span className="mr-3">✏️</span>
                            发布帖子
                          </Link>
                          
                          {/* 管理员链接 */}
                          {session.user?.isAdmin && (
                            <>
                              <div className="border-t border-gray-100 my-1"></div>
                              <Link 
                                href="/admin"
                                className="flex items-center px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <span className="mr-3">⚙️</span>
                                管理员控制台
                              </Link>
                            </>
                          )}
                          
                          {/* 退出登录 */}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              signOut({ callbackUrl: "/" });
                            }}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                          >
                            <span className="mr-3">🚪</span>
                            退出登录
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link 
                  href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
                >
                  登录/注册
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* 遮罩层 - 点击外部关闭下拉菜单 */}
      {(isDropdownOpen || userMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsDropdownOpen(false);
            setUserMenuOpen(false);
          }}
        ></div>
      )}
    </>
  );
};

export default Navbar;
