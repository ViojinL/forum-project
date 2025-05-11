import { Suspense } from "react";
import AdminCommentsList from "@/components/admin/AdminCommentsList";

export default function AdminCommentsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">评论管理</h2>
      </div>
      
      <Suspense fallback={<div>加载中...</div>}>
        <AdminCommentsList />
      </Suspense>
    </div>
  );
} 