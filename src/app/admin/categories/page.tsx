"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    posts: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      const data = await response.json();
      
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("获取板块失败:", error);
      toast.error("获取板块失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      toast.error("板块名称不能为空");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      });
      
      if (response.ok) {
        toast.success("板块创建成功");
        setNewCategory({ name: "", description: "" });
        fetchCategories();
      } else {
        const data = await response.json();
        throw new Error(data.error || "创建板块失败");
      }
    } catch (error) {
      console.error("创建板块失败:", error);
      toast.error(error instanceof Error ? error.message : "创建板块失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("板块名称不能为空");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingCategory.name,
          description: editingCategory.description || "",
        }),
      });
      
      if (response.ok) {
        toast.success("板块更新成功");
        setEditingCategory(null);
        fetchCategories();
      } else {
        const data = await response.json();
        throw new Error(data.error || "更新板块失败");
      }
    } catch (error) {
      console.error("更新板块失败:", error);
      toast.error(error instanceof Error ? error.message : "更新板块失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("确定要删除这个板块吗？与之关联的所有帖子也将被删除！")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast.success("板块删除成功");
        fetchCategories();
      } else {
        const data = await response.json();
        throw new Error(data.error || "删除板块失败");
      }
    } catch (error) {
      console.error("删除板块失败:", error);
      toast.error(error instanceof Error ? error.message : "删除板块失败，请稍后再试");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">板块管理</h1>
      
      {/* 创建新板块表单 */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">创建新板块</h2>
        <form onSubmit={handleSubmitNewCategory} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              板块名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              板块描述
            </label>
            <textarea
              id="description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "创建中..." : "创建板块"}
            </button>
          </div>
        </form>
      </div>
      
      {/* 板块列表 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">所有板块</h2>
        
        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-4 text-gray-500">暂无板块，请创建新板块</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    板块名称
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    帖子数量
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory?.id === category.id ? (
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCategory?.id === category.id ? (
                        <textarea
                          value={editingCategory.description || ""}
                          onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                          rows={2}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                      ) : (
                        <div className="text-sm text-gray-500">{category.description || "无描述"}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category._count?.posts || 0} 篇
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingCategory?.id === category.id ? (
                        <div className="space-x-2">
                          <button
                            onClick={handleUpdateCategory}
                            disabled={isSubmitting}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleStartEdit(category)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 