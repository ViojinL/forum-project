"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from 'next/dynamic';
import ContentRenderer from './ContentRenderer';

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

interface Post {
  id: string;
  title: string;
  content: string;
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  createdAt: string;
  _count: {
    comments: number;
  };
}

interface PostListProps {
  sortBy?: 'latest' | 'top' | 'new';
}

const PostList = ({ sortBy = 'latest' }: PostListProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 20;

  // 创建内容预览函数
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
    fetchPosts(currentPage);
  }, [currentPage, sortBy]);

  const fetchPosts = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?page=${page}&limit=${postsPerPage}&sort=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setTotalPages(Math.ceil((data.total || 0) / postsPerPage));
      }
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length > 0 ? (
        posts.map((post) => (
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
                    <Link href={`/category/${post.category.id}`}>
                      <span className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                        {post.category.name}
                      </span>
                    </Link>
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
                    {post._count.comments}
                  </span>
                </div>
                <Link 
                  href={`/post/${post.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  阅读更多
                </Link>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无帖子</h3>
          <p className="text-gray-500 mb-4">还没有人发布帖子，成为第一个发帖的人吧！</p>
          <Link 
            href="/create-post"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            发布帖子
          </Link>
        </div>
      )}
      
      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            上一页
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default PostList;
