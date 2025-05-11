"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
  category: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
}

// 使用 Suspense 包裹的搜索参数组件
function SearchParamsHandler({ setQuery }: { setQuery: (query: string) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams, setQuery]);
  
  return null;
}

// 带 Suspense 的包裹组件
function SearchParamsWrapper({ setQuery }: { setQuery: (query: string) => void }) {
  return (
    <Suspense fallback={null}>
      <SearchParamsHandler setQuery={setQuery} />
    </Suspense>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 渲染搜索参数组件
  const searchParamsElement = <SearchParamsWrapper setQuery={setQuery} />;

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "搜索失败");
        }
        
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error("搜索失败:", error);
        setError(error instanceof Error ? error.message : "搜索失败，请稍后再试");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  // Format date helper function
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

  // Highlight search terms in text
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() ? 
        <span key={i} className="bg-yellow-200 font-medium">{part}</span> : part
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      {searchParamsElement}
      <main className="container mx-auto py-8 px-4">
        {/* Navigation breadcrumbs */}
        <div className="mb-4 text-sm breadcrumbs">
          <Link href="/" className="text-blue-500 hover:underline">
            首页
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">搜索结果</span>
        </div>

        {/* Search info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h1 className="text-xl font-bold mb-2">搜索: &ldquo;{query}&rdquo;</h1>
          {!loading && <p className="text-gray-600">找到 {posts.length} 条结果</p>}
        </div>

        {/* Search results */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em]"></div>
              <p className="mt-2">正在搜索...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-2">出错了</div>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                重试
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              未找到与&ldquo;{query}&rdquo;相关的帖子
            </div>
          ) : (
            <div className="divide-y">
              {posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50">
                  <Link href={`/post/${post.id}`} className="block">
                    <h3 className="text-lg font-semibold hover:text-blue-600 mb-2">
                      {highlightText(post.title, query)}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {highlightText(post.content, query)}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span>{post.author.username}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span>•</span>
                      <Link href={`/category/${post.category.id}`} className="text-blue-500 hover:underline">
                        {post.category.name}
                      </Link>
                    </div>
                    <div>
                      <span>{post._count.comments} 评论</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
