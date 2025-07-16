'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface SuggestedAnswer {
  id: string;
  question: string;
  answer: string;
  similarity: number;
}

interface QuestionHelperProps {
  question: string;
  categoryId?: string;
  onSelectAnswer?: (answer: string) => void;
}

export default function QuestionHelper({ question, categoryId, onSelectAnswer }: QuestionHelperProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedAnswer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 当问题变化时，获取可能的答案
  useEffect(() => {
    if (!question || question.length < 10) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    fetchSuggestions();
  }, [question]);

  // 获取问题建议
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/qa/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          categoryId: categoryId || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error('获取建议失败');
      }
      
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('获取问题建议失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 使用建议的答案
  const useAnswer = async (suggestion: SuggestedAnswer) => {
    try {
      // 记录使用情况
      await fetch(`/api/qa/use/${suggestion.id}`, {
        method: 'POST',
      });
      
      // 调用回调函数更新表单
      if (onSelectAnswer) {
        onSelectAnswer(suggestion.answer);
      }
      
      // 隐藏建议
      setShowSuggestions(false);
    } catch (error) {
      console.error('记录使用情况失败:', error);
    }
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fadeIn">
      <div className="flex items-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-medium text-blue-700">找到可能的答案</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="bg-white p-3 rounded-md border border-blue-100 hover:border-blue-300 transition-colors">
            <div className="flex justify-between mb-2">
              <h4 className="font-medium text-gray-800">{suggestion.question}</h4>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                匹配度: {Math.round(suggestion.similarity * 100)}%
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{suggestion.answer.length > 150 ? `${suggestion.answer.substring(0, 150)}...` : suggestion.answer}</p>
            <div className="flex justify-end">
              <button
                onClick={() => useAnswer(suggestion)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
              >
                使用此答案
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
