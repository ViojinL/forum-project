import { Suspense } from "react";
import AdminUsersList from "@/components/admin/AdminUsersList";

export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">用户管理</h2>
      </div>
      
      <Suspense fallback={<div>加载中...</div>}>
        <AdminUsersList />
      </Suspense>
    </div>
  );
} 