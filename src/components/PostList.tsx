"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from 'next/dynamic';

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
}

// 移除了未使用的Category接口

const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/posts?page=${currentPage}&sort=${sortBy}`);
        
        if (!response.ok) {
          throw new Error('获取帖子列表失败');
        }
        
        const data = await response.json();
        
        if (data && data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
          setTotalPages(data.totalPages || 1);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error('获取帖子列表失败:', err);
        setError('获取帖子列表失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, sortBy]);

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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 标题栏和排序选项 */}
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">帖子列表</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setSortBy('newest')} 
            className={`px-3 py-1 rounded-md text-sm ${sortBy === 'newest' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            最新
          </button>
          <button 
            onClick={() => setSortBy('popular')} 
            className={`px-3 py-1 rounded-md text-sm ${sortBy === 'popular' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            热门
          </button>
        </div>
      </div>
      
      {/* 帖子列表内容 */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-500">正在加载帖子...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="text-red-500 text-lg mb-2">出错了！</div>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            刷新页面
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-gray-500 mb-4">这里还没有帖子，来发布第一个吧！</p>
          <Link href="/post/create" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            发布帖子
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                {/* 帖子标题 */}
                <Link href={`/post/${post.id}`}>
                  <h3 className="text-xl font-semibold hover:text-blue-600 transition-colors line-clamp-1 group">
                    {post.title}
                    <span className="inline-block ml-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </h3>
                </Link>
                
                {/* 帖子信息栏 */}
                <div className="flex items-center text-sm text-gray-500 mt-2 flex-wrap">
                  {/* 作者信息 */}
                  <Link href={`/user/${post.author?.id}`} className="flex items-center hover:text-blue-600 mr-3">
                    {post.author?.avatar ? (
                      <div className="relative h-5 w-5 rounded-full overflow-hidden mr-1">
                        <Image 
                          src={post.author.avatar} 
                          alt={post.author?.username || "用户"}
                          width={20}
                          height={20}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="mr-1 text-gray-400">喵</span>
                    )}
                    <span>{post.author?.username || "匿名用户"}</span>
                  </Link>
                  
                  {/* 发布时间 */}
                  <span className="flex items-center mr-3">
                    {formatDate(post.createdAt)}
                  </span>
                  
                  {/* 分类标签 */}
                  {post.category && (
                    <Link href={`/category/${post.category.id}`} className="mr-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs hover:bg-blue-100 transition-colors">
                        {post.category.name}
                      </span>
                    </Link>
                  )}
                  
                  {/* 评论数 */}
                  <span className="flex items-center">
                    <span className="text-gray-400 mr-1">💬</span>
                    {post._count?.comments || 0}
                  </span>
                </div>
                
                {/* 帖子内容预览 */}
                <div className="mt-3 text-gray-600 line-clamp-2 text-sm prose prose-sm max-w-none break-words">
                  <ReactMarkdown
                    components={{
                      a: ({...props}) => {
                        // Basic sanitization for preview, more robust sanitization is on the post page
                        const sanitizedHref = props.href ? props.href.replace(/javascript:/gi, '') : ''; 
                        if (sanitizedHref && (sanitizedHref.startsWith('http://') || sanitizedHref.startsWith('https://') || sanitizedHref.startsWith('/'))) {
                          return <a {...props} href={sanitizedHref} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />;
                        }
                        return <>{props.children}</>; 
                      }
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
                
                {/* 阅读更多按钮 */}
                <div className="mt-3">
                  <Link href={`/post/${post.id}`} className="text-blue-600 text-sm hover:text-blue-800 hover:underline">
                    阅读更多...
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {/* 分页导航 */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex justify-center">
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  上一页
                </button>
                
                {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostList;
