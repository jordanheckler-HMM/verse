import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Send, Sparkles } from 'lucide-react';
import { LyraMessage, Section } from '@/types/song';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface LyraPanelProps {
  messages: LyraMessage[];
  onSendMessage: (content: string) => void;
  sections: Section[];
  isThinking: boolean;
  onCollapse?: () => void;
}

export function LyraPanel({
  messages,
  onSendMessage,
  sections,
  isThinking,
  onCollapse,
}: LyraPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full border-l border-border/60 flex flex-col bg-card/35">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-lyra-subtle flex items-center justify-center border border-border/60">
          <Sparkles className="w-3.5 h-3.5 text-accent/80" />
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-wide">Lyra</h2>
          <p className="text-[11px] text-muted-foreground">Brainstorming partner</p>
        </div>
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-6 w-6"
            onClick={onCollapse}
            title="Collapse Lyra panel"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-3"
          >
            <div className="w-9 h-9 rounded-md bg-lyra-subtle/40 border border-border/60 flex items-center justify-center mb-2.5">
              <Sparkles className="w-4 h-4 text-accent/60" />
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Ask me anything about your lyrics
            </p>
            <div className="space-y-1 text-[11px] text-muted-foreground/60">
              <p>"Help me brainstorm ideas for Chorus 2"</p>
              <p>"Give me some darker alternatives"</p>
              <p>"What rhymes work with 'fire'?"</p>
            </div>
          </motion.div>
        ) : (
          <>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'rounded-md p-2.5 border',
                  message.role === 'user'
                    ? 'bg-secondary/45 border-border/70 ml-2'
                    : 'bg-card border-border/70 mr-2'
                )}
              >
                {message.role === 'lyra' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3 text-accent/80" />
                    <span className="text-[11px] text-muted-foreground font-semibold">Lyra</span>
                  </div>
                )}
                <div className="text-xs leading-snug prose prose-xs prose-invert max-w-none">
                  {message.role === 'lyra' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li className="ml-1.5">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l border-border pl-2 italic text-muted-foreground">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Thinking indicator */}
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 text-xs p-2 text-muted-foreground"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Lyra is thinking...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-border/50">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Lyra for ideas..."
            rows={2}
            className="w-full bg-secondary/60 border border-border/70 rounded-md px-2.5 py-2 pr-10 text-xs leading-snug resize-none focus:outline-none focus:ring-1 focus:ring-accent/20 placeholder:text-muted-foreground/50"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1.5 bottom-1.5 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
