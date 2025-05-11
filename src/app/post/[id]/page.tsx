"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import CommentSection from "@/components/CommentSection";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

// Make sure this matches the interface in CommentSection.tsx
interface Author {
  id: string;
  username: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  editCount: number;
  author: Author;
  category: {
    id: string;
    name: string;
  };
  comments: Comment[];
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${postId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '获取帖子失败');
        }
        
        const data = await response.json();
        setPost(data.post);
        setEditedTitle(data.post.title);
        setEditedContent(data.post.content);
      } catch (error) {
        console.error('加载帖子失败:', error);
        setError(error instanceof Error ? error.message : '加载帖子失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  const handleEdit = () => {
    if (post && session?.user?.id === post.authorId) {
      if (post.editCount >= 2) {
        toast.error('您已达到编辑次数上限 (2次)');
        return;
      }
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      toast.error('标题和内容不能为空');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '更新帖子失败');
      }
      
      setPost(data.post);
      setIsEditing(false);
      toast.success('帖子更新成功');
      router.refresh();
    } catch (error) {
      console.error('更新帖子失败:', error);
      toast.error(error instanceof Error ? error.message : '更新帖子失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (post) {
      setEditedTitle(post.title);
      setEditedContent(post.content);
      setIsEditing(false);
    }
  };

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

  // 检查当前用户是否为帖子作者
  const isAuthor = post && session?.user?.id === post.authorId;

  if (loading && !post) {
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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center py-10">{error || '找不到该帖子'}</div>
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
        {/* 帖子导航 */}
        <div className="mb-4 text-sm breadcrumbs bg-white p-3 rounded-lg shadow">
          <Link href="/" className="text-blue-500 hover:underline">
            首页
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/category/${post.category.id}`} className="text-blue-500 hover:underline">
            {post.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">帖子详情</span>
        </div>

        {/* 帖子内容 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          {isEditing ? (
            <>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  标题
                </label>
                <input
                  type="text"
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  内容
                </label>
                <textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                  rows={10}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? '保存中...' : '保存修改'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                {isAuthor && (
                  <div>
                    {post.editCount < 2 ? (
                      <button
                        onClick={handleEdit}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        编辑 (剩余{2 - post.editCount}次)
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-sm">
                        已达编辑上限
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span>{post.author.username}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(post.createdAt)}</span>
                {post.updatedAt !== post.createdAt && (
                  <>
                    <span className="mx-2">•</span>
                    <span>已编辑 {formatDate(post.updatedAt)}</span>
                  </>
                )}
                <span className="mx-2">•</span>
                <span className="text-blue-500">{post.category.name}</span>
              </div>
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-line">{post.content}</p>
              </div>
            </>
          )}
        </div>

        {/* 评论区 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <CommentSection postId={postId} initialComments={post.comments} />
        </div>
      </div>
    </div>
  );
}
