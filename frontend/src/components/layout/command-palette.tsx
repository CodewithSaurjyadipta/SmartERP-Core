'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useKeyboard } from '@/providers/keyboard-provider';
import { useCommand } from '@/hooks/use-command';
import { CommandDefinition } from '@/lib/keyboard/types';
import { Search, CornerDownLeft, Sparkles, Command } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function CommandPalette() {
  const keyboard = useKeyboard();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filteredCommands, setFilteredCommands] = useState<CommandDefinition[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 1. Register command to open palette
  useCommand('system.command-palette', () => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  });

  // 2. Fetch and filter commands dynamically based on search query and context active states
  useEffect(() => {
    if (!isOpen) return;

    const allCommands = keyboard.bus.getDefinitions();
    
    // Filter by active context & permission permissions
    const activeCommands = allCommands.filter(cmd => 
      keyboard.context.isCommandActive(cmd.contexts) &&
      keyboard.permission.canExecute(cmd) &&
      cmd.id !== 'system.command-palette' // Omit toggle option from list
    );

    // Filter by search query
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
      setFilteredCommands(activeCommands);
      return;
    }

    const matches = activeCommands.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(lowerQuery);
      const matchDesc = cmd.description.toLowerCase().includes(lowerQuery);
      const matchCategory = cmd.category.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery)) || false;

      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });

    setFilteredCommands(matches);
    setSelectedIndex(0);
  }, [query, isOpen, keyboard]);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      // Focus stack mapping
      keyboard.focus.push('command-palette');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      keyboard.focus.pop('command-palette');
    }
  }, [isOpen, keyboard]);

  // Key navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      triggerCommand(filteredCommands[selectedIndex]);
    }
  };

  const triggerCommand = (command: CommandDefinition) => {
    setIsOpen(false);
    // Execute command on manager
    setTimeout(() => {
      keyboard.dispatch(command.id).catch(err => {
        console.error(`Error from command palette [${command.id}]:`, err);
      });
    }, 100);
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl border border-border/80 bg-card/95 p-0 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col overflow-hidden rounded-lg outline-none" onKeyDown={handleKeyDown}>
          
          {/* Header Search Field */}
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search actions, files, sheets..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-6 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-0 focus:outline-none"
            />
            <div className="flex items-center gap-1 shrink-0 rounded bg-muted/65 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground font-mono">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </div>

          {/* Body Command Options */}
          <div 
            ref={listRef}
            className="max-h-[330px] overflow-y-auto p-2 space-y-0.5"
          >
            {filteredCommands.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Sparkles className="h-6 w-6 text-muted-foreground/45 mb-2" />
                <p className="text-sm font-medium">No commands found</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Try searching for other keywords</p>
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => triggerCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition-all duration-150 ${
                      isSelected 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-foreground border border-transparent hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold bg-muted/60 px-1.5 py-0.5 rounded">
                        {cmd.category}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-medium leading-none">{cmd.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-none">{cmd.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {cmd.defaultShortcut && (
                        <span className={`font-mono text-[10px] rounded px-1.5 py-0.5 ${
                          isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {cmd.defaultShortcut}
                        </span>
                      )}
                      {isSelected && (
                        <CornerDownLeft className="h-3 w-3 text-primary animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts hint */}
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Use <kbd className="font-mono bg-muted/80 px-1 rounded">↑↓</kbd> to navigate</span>
              <span><kbd className="font-mono bg-muted/80 px-1 rounded">Enter</kbd> to execute</span>
            </div>
            <span><kbd className="font-mono bg-muted/80 px-1 rounded">Esc</kbd> to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
