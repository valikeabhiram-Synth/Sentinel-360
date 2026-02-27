import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, ShieldAlert } from 'lucide-react';
import { AIModel } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
  model: AIModel;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, model }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || file) && !isLoading) {
      onSend(text, file || undefined);
      setText('');
      setFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const styles = {
    gpt: "bg-[#40414f] text-white border-white/10 focus-within:border-emerald-500/50",
    claude: "bg-white text-stone-900 border-stone-200 shadow-sm focus-within:border-orange-500/50",
    gemini: "bg-white text-gray-900 border-gray-200 shadow-lg focus-within:border-blue-500/50",
  }[model];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-black/20 to-transparent pt-10 pb-6 px-4">
      <div className="max-w-3xl mx-auto relative">
        <form 
          onSubmit={handleSubmit}
          className={cn(
            "relative flex flex-col rounded-xl border transition-all duration-200",
            styles
          )}
        >
          {file && (
            <div className="px-4 py-2 flex items-center justify-between border-b border-white/5 bg-white/5 rounded-t-xl">
              <div className="flex items-center gap-2 text-xs">
                <Paperclip className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Metadata will be stripped
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setFile(null)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="flex items-end p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.csv"
            />
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={`Message ${model.toUpperCase()}...`}
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 max-h-40 min-h-[44px]"
              rows={1}
            />
            
            <button
              type="submit"
              disabled={(!text.trim() && !file) || isLoading}
              className={cn(
                "p-2 rounded-lg transition-all",
                (text.trim() || file) && !isLoading 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                  : "text-white/20 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
        
        <div className="mt-2 text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium flex items-center justify-center gap-2">
            <ShieldAlert className="w-3 h-3" />
            Sentinels 360 Active: All data is sanitized before leaving your browser
          </p>
        </div>
      </div>
    </div>
  );
};
