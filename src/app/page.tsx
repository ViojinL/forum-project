'use client';

import Navbar from "@/components/Navbar";
import PostList from "@/components/PostList";
import HotPosts from "@/components/HotPosts";
import AnnouncementModal from "@/components/AnnouncementModal";
import IntroductionModal from "@/components/IntroductionModal";
import ChatWidget from "@/components/qa/ChatWidget";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 定义分类类型
interface Category {
  id: string;
  name: string;
  description?: string;
}

// Discourse风格左侧分类栏
const CategorySidebar = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // 使用 Next.js 路由跳转到搜索页面
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      {/* 分类标题 */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">分类</h2>
      </div>
      
      {/* 全部帖子 */}
      <div className="p-2">
        <Link 
          href="/"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-blue-50 rounded-lg mb-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          全部帖子
        </Link>
      </div>
      
      {/* 分类列表 */}
      <div className="p-2">
        <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">板块</h3>
        <div className="space-y-1">
          {categories.length > 0 ? (
            categories.map((category: Category) => (
              <Link 
                key={category.id} 
                href={`/category/${category.id}`}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate group-hover:text-blue-600">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-gray-500 truncate">{category.description}</div>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              加载中...
            </div>
          )}
        </div>
      </div>
      
      {/* 快速操作 */}
      <div className="p-2 mt-6">
        <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</h3>
        <div className="space-y-1">
          <Link 
            href="/create-post"
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            发布帖子
          </Link>
          
          {/* 搜索表单 */}
          <form onSubmit={handleSearch} className="px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索帖子..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSearching}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSearching ? '...' : '搜索'}
              </button>
            </div>
          </form>
          
          <Link 
            href="/user/inbox"
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            收件箱
          </Link>
        </div>
      </div>
    </div>
  );
};

// Discourse风格主内容区
const MainContent = () => {
  const [sortBy, setSortBy] = useState<'latest' | 'top' | 'new'>('latest');
  
  return (
    <div className="flex-1 bg-white">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">最新帖子</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${
                    sortBy === 'latest' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  最新
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${
                    sortBy === 'top' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  热门
                </button>
                <button
                  onClick={() => setSortBy('new')}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${
                    sortBy === 'new' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  新帖
                </button>
              </div>
            </div>
            <Link 
              href="/create-post"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              发布帖子
            </Link>
          </div>
        </div>
      </div>
      
      {/* 帖子列表 */}
      <div className="p-6">
        <PostList sortBy={sortBy} />
      </div>
    </div>
  );
};

// Discourse风格右侧栏
const RightSidebar = () => {
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    comments: 0,
    todayPosts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            users: data.users || 0,
            posts: data.posts || 0,
            comments: data.comments || 0,
            todayPosts: data.todayPosts || 0
          });
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 如果获取失败，保持默认值 0
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* 社区统计 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">社区统计</h3>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">用户</span>
                <span className="font-semibold text-gray-900">{stats.users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">帖子</span>
                <span className="font-semibold text-gray-900">{stats.posts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">评论</span>
                <span className="font-semibold text-gray-900">{stats.comments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">今日新帖</span>
                <span className="font-semibold text-blue-600">{stats.todayPosts}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 热门帖子 */}
        <HotPosts />
        
        {/* 在线用户 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">在线用户</h3>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>24 位用户在线</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />
      <AnnouncementModal />
      <IntroductionModal />
      
      {/* Discourse风格三栏布局 */}
      <div className="flex">
        {/* 左侧栏 */}
        <CategorySidebar />
        
        {/* 主内容区 */}
        <MainContent />
        
        {/* 右侧栏 */}
        <RightSidebar />
      </div>
      
      {/* 智能问答聊天窗口 */}
      <ChatWidget />
    </main>
  );
}
