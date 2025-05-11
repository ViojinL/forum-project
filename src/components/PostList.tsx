"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
  _count: {
    comments: number;
  };
}

const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/posts');
        
        if (!response.ok) {
          throw new Error('获取帖子列表失败');
        }
        
        const data = await response.json();
        
        if (data && data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
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
  }, []);

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
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">最新帖子</h2>
      
      {loading ? (
        <div className="text-center py-10">加载中...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10">暂无帖子，快来发布第一个帖子吧！</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border-b pb-6 last:border-b-0">
              <Link href={`/post/${post.id}`} className="block">
                <h3 className="text-xl font-semibold hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
              </Link>
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <span>{post.author?.username || "匿名用户"}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(post.createdAt)}</span>
                <span className="mx-2">•</span>
                <span>
                  {post._count?.comments || 0} 评论
                </span>
              </div>
              <p className="mt-3 text-gray-600 line-clamp-2">
                {post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}
              </p>
              <div className="mt-4">
                <Link
                  href={`/post/${post.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  查看全文
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;
