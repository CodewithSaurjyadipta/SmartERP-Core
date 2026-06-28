'use client';

import React, { useState, useEffect } from 'react';
import { useKeyboard } from '@/providers/keyboard-provider';
import { TelemetryLog } from '@/lib/keyboard/types';
import { Terminal, Shield, Eye, Layers } from 'lucide-react';

export default function KeyboardDebugPanel() {
  const keyboard = useKeyboard();
  const [isOpen, setIsOpen] = useState(false);
  const [contextStack, setContextStack] = useState<string[]>([]);
  const [focusPath, setFocusPath] = useState<string[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);

  useEffect(() => {
    // Only register listener in development mode
    if (process.env.NODE_ENV !== 'development') return;

    setContextStack(keyboard.context.getStack());
    setFocusPath(keyboard.focus.getPath());
    setLogs(keyboard.logger.getLogs());

    const unsubContext = keyboard.context.subscribe(setContextStack);
    const unsubFocus = keyboard.focus.subscribe(setFocusPath);
    const unsubLogger = keyboard.logger.subscribe(setLogs);

    return () => {
      unsubContext();
      unsubFocus();
      unsubLogger();
    };
  }, [keyboard]);

  // Hide entirely in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* HUD Toggle Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-xs font-mono text-emerald-400 hover:bg-slate-800 transition-all duration-200 shadow-xl"
        title="Toggle Keyboard Debugger HUD"
      >
        <Terminal className="h-3.5 w-3.5" />
        <span>Kbd HUD</span>
        <span className={`inline-block h-2 w-2 rounded-full ${logs.length > 0 && logs[0].status === 'success' ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`} />
      </button>

      {/* Expanded HUD Monitor */}
      {isOpen && (
        <div className="mt-2 w-96 rounded-xl border border-slate-700 bg-slate-950/95 p-4 font-mono text-xs shadow-2xl backdrop-blur-xl animate-in fade-in-50 slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="font-bold text-slate-300">Keyboard Framework HUD</span>
            <button 
              onClick={() => keyboard.logger.clear()}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline"
            >
              Clear Logs
            </button>
          </div>

          <div className="space-y-4">
            {/* Active Context Stack */}
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>Context Stack:</span>
              </div>
              <div className="flex flex-wrap gap-1 rounded bg-slate-900 p-1.5 border border-slate-800 min-h-8">
                {contextStack.map((ctx, idx) => (
                  <span
                    key={ctx}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${idx === contextStack.length - 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                  >
                    {ctx}
                  </span>
                ))}
              </div>
            </div>

            {/* Focus Path */}
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                <span>Focus Stack:</span>
              </div>
              <div className="flex flex-wrap gap-1 rounded bg-slate-900 p-1.5 border border-slate-800 min-h-8">
                {focusPath.map((f, idx) => (
                  <span
                    key={f}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${idx === focusPath.length - 1 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Telemetry Logger */}
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Command Execution Log:</span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded bg-slate-900 border border-slate-800 p-2 space-y-1">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic py-2 text-center">No commands executed yet</div>
                ) : (
                  logs.map((log, idx) => (
                    <div
                      key={log.timestamp + idx}
                      className="flex items-start justify-between border-b border-slate-800/40 pb-1 text-[10px]"
                    >
                      <div className="truncate pr-2">
                        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="font-bold text-slate-300">{log.commandId}</span>
                        {log.error && (
                          <div className="text-red-400 text-[9px] mt-0.5 whitespace-pre-wrap">{log.error}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`rounded px-1 text-[9px] font-bold ${
                            log.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : log.status === 'blocked_context'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {log.status}
                        </span>
                        {log.latency !== undefined && (
                          <div className="text-slate-500 text-[8px] mt-0.5">{log.latency}ms</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
