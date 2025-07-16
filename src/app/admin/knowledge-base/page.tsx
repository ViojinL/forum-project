'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  categoryName?: string;
  timesUsed: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function KnowledgeBasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    question: '',
    answer: '',
    categoryId: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // 验证是否为管理员
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || !session.user.isAdmin) {
      toast.error('需要管理员权限');
      router.push('/');
    } else {
      fetchItems();
      fetchCategories();
    }
  }, [session, status, router]);

  // 获取所有知识库条目
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/knowledge-base');
      
      if (!response.ok) {
        throw new Error('获取知识库失败');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('加载知识库失败:', error);
      toast.error('加载知识库失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有分类
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('获取分类失败');
      }
      
      const data = await response.json();
      // API 返回的分类数据包含在 categories 属性中
      setCategories(data.categories || []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  // 保存知识库条目
  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question || !formData.answer) {
      toast.error('问题和答案不能为空');
      return;
    }
    
    try {
      setSaving(true);
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `/api/admin/knowledge-base/${formData.id}` 
        : '/api/admin/knowledge-base';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: formData.question,
          answer: formData.answer,
          categoryId: formData.categoryId || null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }
      
      toast.success(isEditing ? '更新成功' : '添加成功');
      resetForm();
      fetchItems();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('保存知识库条目失败:', error);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // 删除知识库条目
  const deleteItem = async (id: string) => {
    if (!confirm('确定要删除这个知识库条目吗？')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/knowledge-base/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除失败');
      }
      
      toast.success('删除成功');
      fetchItems();
    } catch (error) {
      console.error('删除知识库条目失败:', error);
      toast.error('删除失败，请稍后再试');
    }
  };

  // 编辑知识库条目
  const editItem = (item: KnowledgeItem) => {
    setFormData({
      id: item.id,
      question: item.question,
      answer: item.answer,
      categoryId: item.categoryId || '',
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      id: '',
      question: '',
      answer: '',
      categoryId: '',
    });
    setIsEditing(false);
    setShowForm(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">知识库管理</h1>
        <div className="text-center p-8">加载中...</div>
      </div>
    );
  }

  if (!session || !session.user.isAdmin) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">知识库管理</h1>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            添加新条目
          </button>
        ) : (
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            取消
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? '编辑知识库条目' : '添加新知识库条目'}
          </h2>
          <form onSubmit={saveItem}>
            <div className="mb-4">
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                问题
              </label>
              <input
                type="text"
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入常见问题..."
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                答案
              </label>
              <textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入回答内容..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                分类 (可选)
              </label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- 不分类 --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 mr-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? '保存中...' : isEditing ? '更新' : '添加'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  问题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    暂无知识库条目
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.question}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.categoryName || '未分类'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.timesUsed}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => editItem(item)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">关于知识库管理</h2>
        <p className="mb-4">
          知识库用于自动回答论坛中的常见问题。系统会对用户提出的问题进行分析，从知识库中找到最匹配的答案。
        </p>
        <p className="mb-4">
          添加效果良好的知识库条目可以：
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>减轻管理员和活跃用户的回答负担</li>
          <li>提高用户体验，让用户更快获得答案</li>
          <li>保持论坛内容的一致性</li>
        </ul>
        <p className="text-sm text-gray-500">
          提示：为知识库条目添加分类可以提高匹配精度，系统会优先匹配与问题所在板块相关的知识库条目。
        </p>
      </div>
    </div>
  );
}
