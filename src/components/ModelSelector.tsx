import React from 'react';
import { AIModel } from '../types';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModelSelectorProps {
  selectedModel: AIModel;
  onSelect: (model: AIModel) => void;
}

const models: { id: AIModel; name: string; description: string }[] = [
  { id: 'gpt', name: 'GPT-4', description: 'OpenAI\'s most capable model' },
  { id: 'claude', name: 'Claude 3', description: 'Anthropic\'s helpful assistant' },
  { id: 'gemini', name: 'Gemini Pro', description: 'Google\'s multimodal model' },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelect }) => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg hidden sm:inline-block">Sentinels 360</span>
      </div>
      
      <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />

      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors text-sm font-medium">
          <span className="text-white/60">Model:</span>
          <span className="text-white">{models.find(m => m.id === selectedModel)?.name}</span>
          <ChevronDown className="w-4 h-4 text-white/40" />
        </button>
        
        <div className="absolute top-full left-0 mt-1 w-56 bg-[#202123] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model.id)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg",
                selectedModel === model.id && "bg-white/5"
              )}
            >
              <div className="font-medium text-white">{model.name}</div>
              <div className="text-xs text-white/40">{model.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
