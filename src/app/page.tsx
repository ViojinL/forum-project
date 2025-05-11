'use client';

import Navbar from "@/components/Navbar";
import PostList from "@/components/PostList";
import HotPosts from "@/components/HotPosts";
import AnnouncementModal from "@/components/AnnouncementModal";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />
      <AnnouncementModal />
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3">
            <PostList />
          </div>
          <div className="md:col-span-1">
            <HotPosts />
          </div>
        </div>
      </div>
    </main>
  );
}
