'use client';

import React, { useState, useEffect } from 'react';
import { useKeyboard } from '@/providers/keyboard-provider';
import { useCommand } from '@/hooks/use-command';
import { CommandDefinition } from '@/lib/keyboard/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Keyboard, HelpCircle } from 'lucide-react';

export default function HelpOverlay() {
  const keyboard = useKeyboard();
  const [isOpen, setIsOpen] = useState(false);
  const [groupedCommands, setGroupedCommands] = useState<Record<string, CommandDefinition[]>>({});

  // Register command to toggle help cheat sheet
  useCommand('system.help-overlay', () => {
    setIsOpen(true);
  });

  useEffect(() => {
    if (!isOpen) return;

    // Retrieve all active commands
    const allDefs = keyboard.bus.getDefinitions();
    
    // Group active commands by category
    const activeDefs = allDefs.filter(def => 
      keyboard.context.isCommandActive(def.contexts) &&
      keyboard.permission.canExecute(def) &&
      def.defaultShortcut // Only display commands that have physical keybindings
    );

    const groups: Record<string, CommandDefinition[]> = {};
    activeDefs.forEach(cmd => {
      const category = cmd.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    });

    setGroupedCommands(groups);
  }, [isOpen, keyboard]);

  useEffect(() => {
    if (isOpen) {
      keyboard.focus.push('help-overlay');
    } else {
      keyboard.focus.pop('help-overlay');
    }
  }, [isOpen, keyboard]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-border/60 pb-3 mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Keyboard className="h-5 w-5 text-primary" />
            <span>Keyboard Shortcuts Guide</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Below is a list of active commands available in your current workspace context.
          </DialogDescription>
        </DialogHeader>

        {Object.keys(groupedCommands).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <HelpCircle className="h-8 w-8 text-muted-foreground/45 mb-2" />
            <p className="text-sm font-medium">No shortcuts available in this context</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/40 pb-1.5 mb-2">
                  {category}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {commands.map(cmd => (
                    <div
                      key={cmd.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-semibold text-foreground truncate">{cmd.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{cmd.description}</p>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-1">
                        {cmd.defaultShortcut?.split('+').map((key, idx) => (
                          <React.Fragment key={key + idx}>
                            {idx > 0 && <span className="text-[10px] text-muted-foreground font-mono">+</span>}
                            <kbd className="font-mono text-[10px] font-bold rounded bg-muted/80 border border-border px-1.5 py-0.5 text-foreground shadow-sm">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 border-t border-border/50 pt-4 text-center text-[10px] text-muted-foreground">
          Press <kbd className="font-mono bg-muted/80 px-1.5 py-0.5 rounded border">Esc</kbd> or click outside to dismiss this guide.
        </div>
      </DialogContent>
    </Dialog>
  );
}
