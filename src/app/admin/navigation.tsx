'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}

export default function AdminNavigation() {
  return (
    <nav className="bg-white shadow-md rounded-lg p-2 mb-6">
      <div className="flex flex-wrap gap-2">
        <NavLink href="/admin">仪表盘</NavLink>
        <NavLink href="/admin/users">用户管理</NavLink>
        <NavLink href="/admin/categories">板块管理</NavLink>
        <NavLink href="/admin/posts">帖子管理</NavLink>
        <NavLink href="/admin/ai-moderation">AI内容审核</NavLink>
      </div>
    </nav>
  );
}
