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
      <div className="container mx-auto py-8">
        {/* 导航 */}
        <div className="mb-4 text-sm breadcrumbs">
          <Link href="/" className="text-blue-500 hover:underline">
            首页
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{category.name}</span>
        </div>

        {/* 板块信息 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <Link 
              href={`/create-post?category=${categoryId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              发布新帖
            </Link>
          </div>
          {category.description && (
            <p className="text-gray-600 mb-4">{category.description}</p>
          )}
        </div>

        {/* 帖子列表 */}
        <div className="bg-white rounded-lg shadow">
          {posts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              该板块还没有帖子，来发帖吧！
            </div>
          ) : (
            <div className="divide-y">
              {posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50">
                  <Link href={`/post/${post.id}`} className="block">
                    <h3 className="text-lg font-semibold hover:text-blue-600 mb-2">{post.title}</h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>
                      <span>{post.author.username}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div>
                      <span>{getCommentCount(post)} 评论</span>
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
