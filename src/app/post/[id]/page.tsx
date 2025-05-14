"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import CommentSection from "@/components/CommentSection";
import Image from "next/image"; 
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

// 更新该接口以与CommentSection组件中的定义匹配
interface Author {
  id: string;
  username: string;
  avatar?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  author: Author;
  editCount: number;
  isViolation?: boolean;
  parentId?: string | null;
  parent?: Comment | null;
  replies?: Comment[];
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
  isViolation?: boolean;
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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板!');
    } catch (err) {
      console.error('复制失败: ', err);
      toast.error('复制链接失败，请重试');
    }
  };

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        {/* 帖子导航 */}
        <div className="mb-4 text-sm breadcrumbs bg-white p-4 rounded-lg shadow flex items-center flex-wrap">
          <Link href="/" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            首页
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href={`/category/${post.category.id}`} className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {post.category.name}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            帖子详情
          </span>
        </div>

        {/* 帖子内容 */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          {isEditing ? (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">编辑帖子</h2>
              <div className="mb-5">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  标题
                </label>
                <input
                  type="text"
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  maxLength={100}
                  placeholder="输入帖子标题..."
                />
              </div>
              <div className="mb-5">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  内容
                </label>
                <textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[250px] shadow-sm"
                  placeholder="分享你的想法..."
                  rows={12}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      保存中...
                    </>
                  ) : '保存修改'}
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* 帖子头部信息 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold text-gray-900 break-words">{post.title}</h1>
                  {isAuthor && (
                    <div>
                      {post.editCount < 2 ? (
                        <button
                          onClick={handleEdit}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          编辑 (剩余{2 - post.editCount}次)
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          已达编辑上限
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mt-4 flex-wrap">
                  <Link href={`/user/${post.author.id}`} className="flex items-center mr-4 text-blue-600 hover:text-blue-800 transition-colors">
                    {post.author.avatar ? (
                      <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2">
                        <Image 
                          src={post.author.avatar} 
                          alt={post.author.username}
                          width={24}
                          height={24}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    <span>{post.author.username}</span>
                  </Link>
                  
                  <span className="flex items-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDate(post.createdAt)}</span>
                  </span>
                  
                  {post.updatedAt !== post.createdAt && (
                    <span className="flex items-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>已编辑 {formatDate(post.updatedAt)}</span>
                    </span>
                  )}
                  
                  <Link href={`/category/${post.category.id}`} className="flex items-center">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs hover:bg-blue-100 transition-colors">
                      {post.category.name}
                    </span>
                  </Link>
                </div>
              </div>
              
              {/* 帖子内容 */}
              <div className="p-6">
                <article className="prose prose-blue max-w-none mb-6 text-gray-800">
                  <ReactMarkdown>
                    {typeof window !== 'undefined' ? DOMPurify.sanitize(post.content) : post.content}
                  </ReactMarkdown>
                </article>
              </div>
              
              {/* 帖子底部分享区 */}
              <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {post.comments.length} 条评论
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleShare} 
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    分享
                  </button>
                  <a href="#comment-section" className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    参与讨论
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 评论区 */}
        <div id="comment-section" className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">评论区</h2>
          <CommentSection postId={postId} initialComments={post.comments} />
        </div>
      </div>
    </div>
  );
}
