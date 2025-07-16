'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import styles from './ChatWidget.module.css';

interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  timestamp: Date;
  loading?: boolean;
  metadata?: {
    confidence?: number;
    sources?: string[];
    suggestions?: string[];
    needsHumanReview?: boolean;
    messageType?: 'text' | 'suggestion' | 'followup' | 'error';
  };
}

interface ConversationContext {
  sessionId: string;
  previousQuestions: string[];
  userIntent: string;
  topicThread: string[];
  userProfile?: {
    preferredLanguage: string;
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
    interests: string[];
  };
}

interface SmartSuggestion {
  text: string;
  type: 'quick_reply' | 'follow_up' | 'related_topic';
  confidence: number;
}

export default function EnhancedChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1',
      isUser: false, 
      text: '你好！我是增强版智能助手，有什么可以帮助您的？', 
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    sessionId: `session_${Date.now()}`,
    previousQuestions: [],
    userIntent: '',
    topicThread: []
  });
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationHistoryRef = useRef<ChatMessage[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    conversationHistoryRef.current = messages;
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    
    const userQuestion = question.trim();
    setMessages(prev => [...prev, { 
      id: `msg_${Date.now()}`,
      isUser: true, 
      text: userQuestion, 
      timestamp: new Date() 
    }]);
    setQuestion('');
    setIsLoading(true);
    
    try {
      // 这里会调用增强的AI服务
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: `bot_${Date.now()}`,
          isUser: false, 
          text: '这是增强版AI助手的回答，具备更强的理解能力。', 
          timestamp: new Date(),
          metadata: {
            confidence: 0.85,
            needsHumanReview: false
          }
        }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isOpen ? '×' : '🤖'}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 w-96 bg-white rounded-xl shadow-2xl border overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
            <h3 className="font-semibold">增强版智能助手</h3>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.isUser 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  {message.metadata?.confidence && (
                    <div className="mt-1 text-xs opacity-70">
                      置信度: {(message.metadata.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="输入问题..."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 