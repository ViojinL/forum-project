'use client';

import Navbar from "@/components/Navbar";
import PostList from "@/components/PostList";
import HotPosts from "@/components/HotPosts";
import AnnouncementModal from "@/components/AnnouncementModal";
import IntroductionModal from "@/components/IntroductionModal";
import { useEffect, useState } from "react";
import Link from "next/link";

// 定义分类类型
interface Category {
  id: string;
  name: string;
  description?: string;
}

// 添加分类组件
const CategoryNav = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data && data.categories) {
            setCategories(data.categories);
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="bg-blue-600 px-4 py-3 text-white font-medium">
        板块分类
      </div>
      <div className="p-2 flex flex-wrap gap-2">
        {categories.length > 0 ? (
          categories.map((category: Category) => (
            <Link 
              key={category.id} 
              href={`/category/${category.id}`}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm transition-colors"
            >
              {category.name}
            </Link>
          ))
        ) : (
          <div className="text-gray-500 p-2">加载分类中...</div>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <AnnouncementModal />
      <IntroductionModal />
      
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* 分类导航 */}
            <CategoryNav />
            {/* 帖子列表 */}
            <PostList />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <HotPosts />
            
            {/* 社区统计卡片 */}
            <div className="bg-white p-5 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">社区统计</h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">384</div>
                  <div className="text-sm text-gray-600">会员</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">1,293</div>
                  <div className="text-sm text-gray-600">帖子</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">5,721</div>
                  <div className="text-sm text-gray-600">评论</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">42</div>
                  <div className="text-sm text-gray-600">今日新帖</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
