"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  category: {
    id: string;
    name: string;
  };
  _count?: {
    comments: number;
  };
  comments?: { id: string }[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 创建内容预览函数（与首页PostList相同）
  const createContentPreview = (content: string, maxLength: number = 150) => {
    // 检测是否包含图片
    const hasImages = /!\[.*?\]\(.*?\)/.test(content);
    
    // 移除markdown语法获取纯文本
    const textOnly = content
      .replace(/!\[.*?\]\(.*?\)/g, '[图片]') // 图片替换为 [图片]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接保留文本
      .replace(/[*_`~]/g, '') // 移除格式化符号
      .replace(/#+\s/g, '') // 移除标题符号
      .replace(/>\s/g, '') // 移除引用符号
      .replace(/\n/g, ' ') // 换行变空格
      .trim();
    
    return {
      text: textOnly.length > maxLength ? `${textOnly.substring(0, maxLength)}...` : textOnly,
      hasImages,
      isMarkdown: hasImages || /[*_`~#>]/.test(content)
    };
  };

  useEffect(() => {
    // 获取板块信息和帖子列表
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        console.log('正在获取分类数据，分类ID:', categoryId);
        
        // 从 API 获取分类信息
        const categoryResponse = await fetch(`/api/categories/${categoryId}`);
        if (!categoryResponse.ok) {
          const errorData = await categoryResponse.json();
          throw new Error(errorData.error || "获取分类信息失败");
        }
        const categoryData = await categoryResponse.json();
        console.log('获取到的分类数据:', categoryData);
        if (!categoryData.category) {
          throw new Error("找不到对应的板块");
        }
        setCategory(categoryData.category);
        
        // 从 API 获取帖子列表
        console.log('正在获取该分类的帖子列表');
        const postsResponse = await fetch(`/api/posts?categoryId=${categoryId}`);
        if (!postsResponse.ok) {
          const errorData = await postsResponse.json();
          throw new Error(errorData.error || "获取帖子列表失败");
        }
        const postsData = await postsResponse.json();
        console.log('获取到的帖子数据:', postsData);
        
        // 处理帖子数据，确保评论数的格式正确
        const processedPosts = postsData.posts.map((post: Post) => ({
          ...post,
          // 确保_count存在，如果不存在，则从comments数组计算
          _count: post._count || { 
            comments: post.comments ? post.comments.length : 0 
          }
        }));
        
        setPosts(processedPosts || []);
      } catch (error) {
        console.error("加载板块数据失败:", error);
        setErrorMessage(error instanceof Error ? error.message : "加载数据失败，请刷新页面重试");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categoryId]);

  // 格式化日期的辅助函数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 获取评论数的辅助函数，处理可能的数据结构差异
  const getCommentCount = (post: Post) => {
    if (post._count && typeof post._count.comments === 'number') {
      return post._count.comments;
    }
    if (post.comments && Array.isArray(post.comments)) {
      return post.comments.length;
    }
    return 0;
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

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center py-10">{errorMessage}</div>
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

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center py-10">板块不存在</div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {category.name}
            </span>
          </nav>
        </div>

        {/* 板块信息 - 统一卡片样式 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                {category.description && (
                  <p className="text-gray-600 mt-2">{category.description}</p>
                )}
              </div>
            </div>
            <Link 
              href={`/create-post?category=${categoryId}`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              发布新帖
            </Link>
          </div>
        </div>

        {/* 帖子列表 - 统一卡片样式 */}
        <div className="bg-gray-100">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">帖子列表</h2>
              </div>
              <div className="text-sm text-gray-600">
                {posts.length} 篇帖子
              </div>
            </div>
          </div>
          
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无帖子</h3>
              <p className="text-gray-600 mb-4">该板块还没有帖子，来发表第一篇帖子吧！</p>
              <Link 
                href={`/create-post?category=${categoryId}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                发布新帖
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-200">
                  <div className="p-4">
                    {/* 帖子头部信息 */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                        {post.author.avatar ? (
                          <img 
                            src={post.author.avatar} 
                            alt={post.author.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = post.author.username.charAt(0).toUpperCase();
                            }}
                          />
                        ) : (
                          post.author.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {post.author.username}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {category?.name || '未分类'}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 帖子标题和内容 */}
                    <Link href={`/post/${post.id}`} className="block group">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      {(() => {
                        const preview = createContentPreview(post.content);
                        
                        if (preview.hasImages) {
                          return (
                            <div className="mb-3">
                              <div className="text-gray-600 text-sm line-clamp-2 mb-2">
                                {preview.text}
                              </div>
                              <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-flex">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                包含图片
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                              {preview.text}
                            </p>
                          );
                        }
                      })()}
                    </Link>
                    
                    {/* 帖子底部信息 */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {getCommentCount(post)}
                        </span>
                      </div>
                      <Link 
                        href={`/post/${post.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        查看详情
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
