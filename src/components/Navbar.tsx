"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import SearchBar from "./SearchBar";

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

  return (
    <nav className="bg-blue-500 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-white text-xl font-bold">
            校园论坛
          </Link>
          
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-white hover:text-gray-200"
            >
              板块分类
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                {isLoading ? (
                  <div className="block px-4 py-2 text-sm text-gray-500">加载中...</div>
                ) : categories.length > 0 ? (
                  categories.map(category => (
                    <Link
                      key={category.id}
                      href={`/category/${category.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))
                ) : (
                  <div className="block px-4 py-2 text-sm text-gray-500">暂无分类</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <SearchBar />
          </div>
          
          {session ? (
            <div className="flex items-center space-x-2">
              <Link href="/create-post" className="text-white hover:text-gray-200 text-sm">
                发帖
              </Link>
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="text-white hover:text-gray-200 text-sm flex items-center"
                >
                  <span>{session.user?.username || session.user?.name}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      href={`/user/${session.user?.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      个人资料
                    </Link>
                    <Link 
                      href="/user/inbox"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>我的收件箱</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    {/* Admin link - only show for admin users */}
                    {session.user?.isAdmin && (
                      <Link 
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        管理员控制台
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      退出
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login" className="text-white hover:text-gray-200 text-sm">
                登录/注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
