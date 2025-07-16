"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <div className={`relative rounded-lg bg-gray-100 border transition-colors duration-200 ${
        isFocused 
          ? 'border-blue-500 bg-white' 
          : 'border-transparent hover:bg-gray-200'
      }`}>
        <input
          type="text"
          placeholder="搜索帖子..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-4 py-2 pr-10 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none"
        />
        
        <button
          type="submit"
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-colors duration-200 ${
            query.trim() 
              ? 'text-blue-500 hover:bg-blue-50' 
              : 'text-gray-400'
          }`}
          disabled={!query.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
