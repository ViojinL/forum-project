"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [banUntil, setBanUntil] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // 定义 Category 类型
  interface Category {
    id: string;
    name: string;
    description?: string;
  }
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    // 获取分类列表
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        } else {
          console.error('获取分类失败');
        }
      } catch (error) {
        console.error('获取分类出错:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

  // 使用 Suspense 包裹的组件来处理 URL 参数
  function CategoryFromUrl({ setCategoryId }: { setCategoryId: (id: string) => void }) {
    return (
      <Suspense fallback={null}>
        <CategoryFromUrlInner setCategoryId={setCategoryId} />
      </Suspense>
    );
  }

  function CategoryFromUrlInner({ setCategoryId }: { setCategoryId: (id: string) => void }) {
    const searchParams = useSearchParams();

    useEffect(() => {
      // 从URL参数中获取预选的分类
      const categoryFromUrl = searchParams.get('category');
      if (categoryFromUrl) {
        setCategoryId(categoryFromUrl);
      }
    }, [searchParams, setCategoryId]);
    
    return null;
  }

  // 渲染 CategoryFromUrl 组件
  const categoryUrlElement = <CategoryFromUrl setCategoryId={setCategoryId} />;

  useEffect(() => {
    // 如果用户已登录，获取其信用积分和封禁状态
    if (session?.user?.id) {
      const fetchUserInfo = async () => {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserCredits(data.user.creditScore || 100);
            
            if (data.user.banUntil && new Date(data.user.banUntil) > new Date()) {
              setBanUntil(data.user.banUntil);
            }
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
        }
      };
      
      fetchUserInfo();
    }
  }, [session]);

  // 如果用户未登录，重定向到登录页
  if (status === "unauthenticated") {
    router.push("/login?callbackUrl=/create-post");
    return null;
  }

  // 如果会话正在加载，显示加载状态
  if (status === "loading" || loadingCategories) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  // 如果用户被封禁，显示提示信息
  if (banUntil) {
    const banEndTime = new Date(banUntil);
    const timeLeft = Math.ceil((banEndTime.getTime() - Date.now()) / (1000 * 60 * 60));
    
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">暂时无法发帖</h1>
              <p className="mb-4">
                由于您的信用积分过低，您的发帖权限已被暂时限制。
              </p>
              <p className="mb-4">
                限制将于 {banEndTime.toLocaleString()} 解除（约 {timeLeft} 小时后）。
              </p>
              <p className="mb-4">
                当前信用积分: <span className="font-bold text-red-600">{userCredits}</span> 分（低于80分）
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果用户信用积分过低但尚未被封禁，显示警告
  const showCreditWarning = userCredits !== null && userCredits < 90;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim() || !categoryId) {
      setError("请填写所有必填字段");
      return;
    }

    try {
      setIsSubmitting(true);

      // 调用 API 发帖请求
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          categoryId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '发帖失败');
      }

      const data = await response.json();
      
      // 发帖成功后重定向到帖子详情页面
      router.push(`/post/${data.post.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "发帖时出现错误，请稍后重试";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="flex-1 p-4">
        {categoryUrlElement}
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">创建新帖子</h1>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {showCreditWarning && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p className="font-medium">您的信用积分较低: {userCredits} 分</p>
              <p>请注意：</p>
              <ul className="list-disc pl-5 mt-1">
                <li>信用积分低于80分将暂时无法发帖</li>
                <li>发布违规内容将被扣除信用积分</li>
                <li>帖子违规扣5分，评论违规扣1分</li>
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                选择板块 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- 请选择板块 --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              ></textarea>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? "发布中..." : "发布帖子"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
