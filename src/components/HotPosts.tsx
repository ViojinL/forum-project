"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HotPost {
  id: string;
  title: string;
  author: {
    username: string;
    avatar?: string | null;
  };
  _count: {
    comments: number;
  };
}

const HotPosts = () => {
  const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotPosts = async () => {
      try {
        const response = await fetch('/api/posts/hot');
        if (response.ok) {
          const data = await response.json();
          setHotPosts(data.posts || []);
        }
      } catch (error) {
        console.error('获取热门帖子失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotPosts();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门帖子</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">热门帖子</h3>
      
      {hotPosts.length > 0 ? (
        <div className="space-y-3">
          {hotPosts.map((post, index) => (
            <Link 
              key={post.id} 
              href={`/post/${post.id}`}
              className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 group"
            >
              {/* 排名 */}
              <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-600'
              }`}>
                {index + 1}
              </div>
              
              {/* 帖子信息 */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 mb-1">
                  {post.title}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{post.author.username}</span>
                  <span>•</span>
                  <span>{post._count.comments} 评论</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">暂无热门帖子</p>
        </div>
      )}
    </div>
  );
};

export default HotPosts;
