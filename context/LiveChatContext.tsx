import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type Sender = 'user' | 'support';

export interface ChatMessage {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
}

interface LiveChatContextValue {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string) => void;
  clearChat: () => void;
}

const LiveChatContext = createContext<LiveChatContextValue | undefined>(undefined);

const initialMessage: ChatMessage = {
  id: 'support-welcome',
  text: 'Hi there! I am Ledgerly Support. How can I help you today?',
  sender: 'support',
  timestamp: Date.now(),
};

const cannedReplies = [
  'Thanks for the details. I can help with that.',
  'Got it. Let me check and get you the right steps.',
  'That makes sense. Are you seeing any error messages?',
  'Happy to help. What device and app version are you using?',
  'Thanks for reaching out. I am here with you.',
];

const keywordReplies: { keyword: string; response: string }[] = [
  {
    keyword: 'invoice',
    response: 'For invoices, open Invoices and tap + to create a new one. Need help with a specific step?',
  },
  {
    keyword: 'receipt',
    response: 'For receipts, go to Receipts and tap + to add a new receipt. I can walk you through it.',
  },
  {
    keyword: 'backup',
    response: 'Backups are in Settings > Data & Storage. You can run a backup now from there.',
  },
  {
    keyword: 'payment',
    response: 'Payment methods live in Settings > Account > Payment Methods.',
  },
  {
    keyword: 'export',
    response: 'Exports are in Settings > Data & Storage > Export Data. Choose CSV, PDF, or Excel.',
  },
];

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function LiveChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  const getReplyForMessage = (text: string) => {
    const lower = text.toLowerCase();
    const match = keywordReplies.find(({ keyword }) => lower.includes(keyword));
    if (match) {
      return match.response;
    }
    return cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      text: trimmed,
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const timeoutId = setTimeout(() => {
      const supportMessage: ChatMessage = {
        id: createId(),
        text: getReplyForMessage(trimmed),
        sender: 'support',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, supportMessage]);
      setIsTyping(false);
    }, 900);

    timeoutsRef.current.push(timeoutId);
  };

  const clearChat = () => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current = [];
    setIsTyping(false);
    setMessages([initialMessage]);
  };

  return (
    <LiveChatContext.Provider value={{ messages, isTyping, sendMessage, clearChat }}>
      {children}
    </LiveChatContext.Provider>
  );
}

export function useLiveChat() {
  const context = useContext(LiveChatContext);
  if (!context) {
    throw new Error('useLiveChat must be used within a LiveChatProvider');
  }
  return context;
}
