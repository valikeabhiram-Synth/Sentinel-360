import { useState, useEffect, useRef } from 'react';
import { AIModel, ChatMessage as ChatMessageType, SanitizedResult, AuditLogEntry } from './types';
import { ModelSelector } from './components/ModelSelector';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { AuditLog } from './components/AuditLog';
import { sanitizeText, stripFileMetadata } from './lib/privacy';
import { getChatResponse } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock } from 'lucide-react';

export default function App() {
  const [model, setModel] = useState<AIModel>('gpt');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addAuditLog = (action: string, details: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const newLog: AuditLogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      action,
      details,
      type,
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleSend = async (text: string, file?: File) => {
    const timestamp = Date.now();
    const messageId = Math.random().toString(36).substring(7);

    // 1. Add user message to UI immediately (showing it's being sanitized)
    const newUserMessage: ChatMessageType = {
      id: messageId,
      role: 'user',
      content: text,
      originalContent: text,
      model,
      timestamp,
      isSanitizing: true,
      status: 'Intercepting...',
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // 2. Interception & Sanitization Phase
      // Simulate a small delay for the "interception" feel
      await new Promise(resolve => setTimeout(resolve, 1200));

      let sanitizedText = text;
      let sanitizationResult: SanitizedResult = { text, matches: [] };
      let strippedFile: File | undefined = undefined;

      if (text) {
        addAuditLog('INTERCEPT', `Scanning user prompt for PII...`, 'info');
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: 'Scanning text for PII...' } : msg));
        sanitizationResult = sanitizeText(text);
        sanitizedText = sanitizationResult.text;
        
        if (sanitizationResult.matches.length > 0) {
          setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: 'Redacting sensitive data...' } : msg));
          addAuditLog('SANITIZE', `Masked ${sanitizationResult.matches.length} sensitive items in text`, 'success');
          sanitizationResult.matches.forEach(m => {
            addAuditLog('REDACT', `${m.rule} identified and replaced with ${m.placeholder}`, 'warning');
          });
        }
      }

      // Handle file metadata stripping and content masking if present
      if (file) {
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: `Processing ${file.name}...` } : msg));
        addAuditLog('FILE_UPLOAD', `Processing ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
        const isImage = file.type.startsWith('image/');
        
        if (isImage) {
          setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: 'Running OCR & Redaction...' } : msg));
          addAuditLog('OCR_START', `Running OCR on image to detect sensitive text`, 'info');
          // Update message to show OCR is happening
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: `[Sentinels 360: Running OCR and redacting sensitive data from ${file.name}...]` }
              : msg
          ));
        }

        strippedFile = await stripFileMetadata(file);
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: 'Stripping metadata...' } : msg));
        addAuditLog('METADATA_STRIP', `Removed EXIF and metadata from ${file.name}`, 'success');
        
        // Check if redaction actually happened (this is a bit tricky to detect from the file alone, 
        // but we can trust the logs from stripImageMetadata)
        
        // For text-based files, we also provide a preview/summary in the prompt
        const textTypes = ['text/plain', 'text/csv', 'application/json', 'text/markdown'];
        const isText = textTypes.includes(file.type) || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.csv') || 
                       file.name.endsWith('.json') || 
                       file.name.endsWith('.md');

        if (isText) {
          setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: 'Sanitizing file content...' } : msg));
          const sanitizedFileContent = await strippedFile.text();
          addAuditLog('FILE_SANITIZE', `Sanitized content inside ${file.name}`, 'success');
          sanitizedText += `\n\n[System Note: The attached file "${file.name}" has been sanitized. Sensitive data inside the file has been masked.]`;
          sanitizedText += `\n[Sanitized File Content Preview]:\n${sanitizedFileContent.substring(0, 1000)}${sanitizedFileContent.length > 1000 ? '...' : ''}`;
        } else {
          sanitizedText += `\n\n[System Note: The attached file "${file.name}" has been processed. Metadata has been stripped and PII masking applied where possible.]`;
        }
      }

      // 3. Update the user message in UI to show sanitized version
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: sanitizedText, 
              sanitizedContent: sanitizedText, 
              isSanitizing: false,
              status: 'Forwarding to AI...',
              fileUrl: strippedFile ? URL.createObjectURL(strippedFile) : undefined,
              fileName: file?.name
            }
          : msg
      ));

      // 4. Forward sanitized prompt and stripped file to LLM
      addAuditLog('FORWARD', `Sending sanitized payload to ${model.toUpperCase()}`, 'info');
      const response = await getChatResponse(sanitizedText, model, strippedFile);
      
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: undefined } : msg));

      // 6. Add assistant response
      const assistantMessage: ChatMessageType = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: response,
        model,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      addAuditLog('RESPONSE', `Received response from ${model.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error in chat flow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getThemeClass = () => {
    switch (model) {
      case 'gpt': return 'bg-[#343541] text-white';
      case 'claude': return 'bg-[#f5f5f0] text-stone-900';
      case 'gemini': return 'bg-white text-gray-900';
      default: return 'bg-[#050505]';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${getThemeClass()}`}>
      <ModelSelector selectedModel={model} onSelect={setModel} />
      
      <main className="flex-1 overflow-y-auto pb-40">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center p-8 mt-20 text-center space-y-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Shield className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black border-2 border-emerald-500 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              
              <div className="space-y-2 max-w-md">
                <h1 className="text-3xl font-bold tracking-tight">Sentinels 360</h1>
                <p className="text-sm opacity-60">
                  Your personal data never leaves this window. We automatically mask sensitive information like emails, cards, and keys before they reach the AI.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  "My email is test@example.com",
                  "Aadhaar: 1234 5678 9012",
                  "VID: 1234 5678 9012 3456",
                  "PAN: ABCDE1234F",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => handleSend(example)}
                    className="p-3 text-left text-xs rounded-lg border border-current opacity-40 hover:opacity-100 transition-opacity"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} model={model} />
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      <AuditLog logs={auditLogs} />
      
      <ChatInput 
        onSend={handleSend} 
        isLoading={isLoading} 
        model={model} 
      />
    </div>
  );
}
