"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface HotPost {
  id: string;
  title: string;
  commentCount: number;
}

const HotPosts = () => {
  const [posts, setPosts] = useState<HotPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHotPosts = async () => {
      try {
        const response = await fetch('/api/posts/hot');
        if (response.ok) {
          const data = await response.json();
          if (data && data.posts && Array.isArray(data.posts)) {
            setPosts(data.posts);
          }
        }
      } catch (error) {
        console.error('获取热门帖子失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotPosts();
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">热门帖子</h2>
      {isLoading ? (
        <div className="text-center py-4">加载中...</div>
      ) : posts.length > 0 ? (
        <div className="space-y-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block p-2 hover:bg-gray-50 rounded-md"
            >
              <div className="flex justify-between items-center">
                <span className="line-clamp-1">{post.title}</span>
                <span className="text-gray-500 text-sm ml-2 whitespace-nowrap">{post.commentCount} 评论</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">暂无热门帖子</div>
      )}
    </div>
  );
};

export default HotPosts;
