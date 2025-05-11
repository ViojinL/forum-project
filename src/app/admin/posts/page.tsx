import { Suspense } from "react";
import AdminPostsList from "@/components/admin/AdminPostsList";

export default function AdminPostsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">帖子管理</h2>
      </div>
      
      <Suspense fallback={<div>加载中...</div>}>
        <AdminPostsList />
      </Suspense>
    </div>
  );
} 