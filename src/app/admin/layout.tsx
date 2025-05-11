import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayoutComponent from "@/components/admin/AdminLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated and is admin
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin");
  }
  
  // @ts-ignore - We know isAdmin exists because we added it to the types
  if (!session.user.isAdmin) {
    redirect("/");
  }

  return (
    <AdminLayoutComponent>
      {children}
    </AdminLayoutComponent>
  );
} 