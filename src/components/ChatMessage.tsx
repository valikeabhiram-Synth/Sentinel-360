import React from 'react';
import { ChatMessage as ChatMessageType, AIModel } from '../types';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Bot, Shield } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatMessageProps {
  message: ChatMessageType;
  model: AIModel;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, model }) => {
  const isUser = message.role === 'user';
  
  // Model specific styles
  const styles = {
    gpt: {
      container: isUser ? "bg-transparent" : "bg-[#444654]",
      avatar: isUser ? "bg-[#5436DA]" : "bg-[#10A37F]",
      text: "text-gray-100",
      content: "max-w-3xl mx-auto px-4 py-6 flex gap-4 sm:gap-6",
    },
    claude: {
      container: "bg-transparent border-b border-black/5",
      avatar: isUser ? "bg-orange-600" : "bg-stone-800",
      text: "text-stone-800",
      content: "max-w-2xl mx-auto px-4 py-8 flex gap-4 sm:gap-6",
    },
    gemini: {
      container: isUser ? "bg-transparent" : "bg-blue-50/50",
      avatar: isUser ? "bg-blue-600" : "bg-gradient-to-br from-blue-400 to-purple-500",
      text: "text-gray-800",
      content: "max-w-4xl mx-auto px-4 py-6 flex gap-4 sm:gap-6",
    }
  }[model];

  return (
    <div className={cn("w-full transition-colors", styles.container)}>
      <div className={styles.content}>
        <div className={cn("w-8 h-8 rounded shrink-0 flex items-center justify-center text-white", styles.avatar)}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
        
        <div className={cn("flex-1 space-y-2 overflow-hidden", styles.text)}>
          {(message.isSanitizing || message.status) && (
            <div className="flex flex-col gap-1.5 mb-4">
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                <div className="relative">
                  <Shield className="w-4 h-4" />
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                </div>
                <span className="tracking-tight">Sentinels 360 Privacy Shield Active</span>
              </div>
              {message.status && (
                <div className="flex items-center gap-3 pl-6">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs font-mono text-emerald-500/70 uppercase tracking-widest">
                    {message.status}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {message.fileUrl && (
            <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/5 inline-block">
              <div className="flex items-center gap-2 mb-2 text-xs text-white/40">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>Sanitized Attachment: {message.fileName}</span>
              </div>
              {message.fileUrl.startsWith('blob:') && message.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img 
                  src={message.fileUrl} 
                  alt="Sanitized attachment" 
                  className="max-w-sm rounded border border-white/10 shadow-lg"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                  <Bot className="w-4 h-4" />
                  <span>File content sanitized and forwarded</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
