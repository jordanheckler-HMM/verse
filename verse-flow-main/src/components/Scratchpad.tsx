import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScratchpadProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function Scratchpad({ content, onContentChange }: ScratchpadProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-border/50 bg-card/30">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">Scratch Notes</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Quick notes, rhymes, fragments..."
                className="w-full h-[96px] bg-secondary/50 border border-border/70 rounded-md px-2.5 py-2 font-mono text-xs leading-snug resize-none focus:outline-none focus:ring-1 focus:ring-accent/20 placeholder:text-muted-foreground/40"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
