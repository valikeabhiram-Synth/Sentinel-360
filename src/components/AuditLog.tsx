import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, ShieldCheck, Clock, Activity } from 'lucide-react';
import { AuditLogEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLogProps {
  logs: AuditLogEntry[];
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <motion.div 
          initial={false}
          animate={{ height: isExpanded ? '300px' : '40px' }}
          className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-t-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-4 h-10 w-full hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-mono font-medium text-white/70 uppercase tracking-wider">
                Sentinels 360 Audit Log
              </span>
              {logs.length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/30 font-mono">
                {logs.length} EVENTS RECORDED
              </span>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronUp className="w-4 h-4 text-white/40" />}
            </div>
          </button>

          {/* Log Content */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px]">
            <AnimatePresence initial={false}>
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/20 italic">
                  No security events recorded in this session
                </div>
              ) : (
                <div className="space-y-1">
                  {[...logs].reverse().map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-2 rounded hover:bg-white/5 group border-l-2 border-transparent hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex items-center gap-2 text-white/30 shrink-0 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`uppercase font-bold ${
                            log.type === 'success' ? 'text-emerald-500' : 
                            log.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                            [{log.action}]
                          </span>
                          <span className="text-white/80 truncate">{log.details}</span>
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
