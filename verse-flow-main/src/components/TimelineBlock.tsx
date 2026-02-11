import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, ChevronDown, ChevronUp, Sparkles, Trash2, Circle, X, Music } from 'lucide-react';
import { Section, SectionType, SectionStatus, SECTION_LABELS, ChordProgression } from '@/types/song';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimelineBlockProps {
  section: Section;
  onUpdate: (id: string, updates: Partial<Section>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAskLyra: (sectionId: string, content: string) => void;
  chordProgressions: ChordProgression[];
}

const sectionColors: Record<SectionType, string> = {
  verse: 'bg-section-verse',
  chorus: 'bg-section-chorus',
  prechorus: 'bg-section-prechorus',
  bridge: 'bg-section-bridge',
  hook: 'bg-section-hook',
  outro: 'bg-section-outro',
};

const sectionBorders: Record<SectionType, string> = {
  verse: 'border-l-section-verse',
  chorus: 'border-l-section-chorus',
  prechorus: 'border-l-section-prechorus',
  bridge: 'border-l-section-bridge',
  hook: 'border-l-section-hook',
  outro: 'border-l-section-outro',
};

export function TimelineBlock({
  section,
  onUpdate,
  onDuplicate,
  onDelete,
  onAskLyra,
  chordProgressions,
}: TimelineBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [localLabel, setLocalLabel] = useState(section.label);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showChordMenu, setShowChordMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Count syllables (rough approximation)
  const countSyllables = (text: string): number => {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
    return words.reduce((count, word) => {
      const matches = word.match(/[aeiouy]+/g);
      return count + (matches ? matches.length : 1);
    }, 0);
  };

  const lineCount = section.content.split('\n').filter(l => l.trim()).length;
  const syllableCount = countSyllables(section.content);

  useEffect(() => {
    if (editingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [editingLabel]);

  const handleLabelBlur = () => {
    setEditingLabel(false);
    if (localLabel.trim()) {
      onUpdate(section.id, { label: localLabel.trim() });
    } else {
      setLocalLabel(section.label);
    }
  };

  const statusConfig: Record<SectionStatus, { color: string; label: string }> = {
    draft: { color: 'text-muted-foreground', label: 'Draft' },
    working: { color: 'text-amber-400', label: 'Working' },
    final: { color: 'text-green-400', label: 'Final' },
  };

  const handleStatusChange = (status: SectionStatus | undefined) => {
    onUpdate(section.id, { status });
    setShowStatusMenu(false);
  };

  const handleChordProgressionChange = (progressionId: string | undefined) => {
    onUpdate(section.id, { chordProgressionId: progressionId });
    setShowChordMenu(false);
  };

  const selectedProgression = chordProgressions.find(p => p.id === section.chordProgressionId);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'timeline-block group relative bg-card rounded-md border border-border/70 overflow-hidden',
        'border-l-4',
        sectionBorders[section.type],
        isDragging && 'opacity-70 border-accent/40 z-50'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/50" onClick={() => {
        if (showStatusMenu) {
          setShowStatusMenu(false);
        }
        if (showChordMenu) {
          setShowChordMenu(false);
        }
      }}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Section accent dot */}
        <div className={cn('w-2 h-2 rounded-full', sectionColors[section.type])} />

        {/* Status marker */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusMenu(!showStatusMenu);
              setShowChordMenu(false);
            }}
            className="p-0.5 hover:bg-secondary/50 rounded transition-colors"
            title={section.status ? statusConfig[section.status].label : 'Set status'}
          >
            <Circle
              className={cn(
                'w-3 h-3',
                section.status ? statusConfig[section.status].color : 'text-muted-foreground/30'
              )}
              fill={section.status ? 'currentColor' : 'none'}
            />
          </button>

          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border/80 rounded-md p-1 min-w-[110px]"
              >
                <button
                  onClick={() => handleStatusChange(undefined)}
                  className="w-full px-2 py-1 text-[11px] text-left rounded hover:bg-secondary transition-colors flex items-center gap-1.5"
                >
                  <Circle className="w-3 h-3 text-muted-foreground/30" fill="none" />
                  <span>None</span>
                </button>
                {(Object.keys(statusConfig) as SectionStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="w-full px-2 py-1 text-[11px] text-left rounded hover:bg-secondary transition-colors flex items-center gap-1.5"
                  >
                    <Circle
                      className={cn('w-3 h-3', statusConfig[status].color)}
                      fill="currentColor"
                    />
                    <span>{statusConfig[status].label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chord progression selector */}
        {chordProgressions.length > 0 && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowChordMenu(!showChordMenu);
                setShowStatusMenu(false);
              }}
              className="px-2 py-0.5 text-xs rounded hover:bg-secondary/50 transition-colors flex items-center gap-1"
              title={selectedProgression ? `Chords: ${selectedProgression.name}` : 'No chords assigned'}
              aria-label={selectedProgression ? `Section chords: ${selectedProgression.name}. Click to change.` : 'Assign chord progression to this section'}
              aria-expanded={showChordMenu}
            >
              <Music className={cn(
                'w-3 h-3',
                selectedProgression ? 'text-muted-foreground' : 'text-muted-foreground/40'
              )} />
              {selectedProgression && (
                <span className="text-muted-foreground/70">{selectedProgression.name}</span>
              )}
            </button>

            <AnimatePresence>
              {showChordMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border/80 rounded-md p-1 min-w-[180px]"
                >
                  <button
                    onClick={() => handleChordProgressionChange(undefined)}
                    className="w-full px-2 py-1 text-[11px] text-left rounded hover:bg-secondary transition-colors"
                  >
                    <span className="text-muted-foreground/60">None</span>
                  </button>
                  {chordProgressions.map((progression) => (
                    <button
                      key={progression.id}
                      onClick={() => handleChordProgressionChange(progression.id)}
                      className={cn(
                        "w-full px-2 py-1.5 text-xs text-left rounded hover:bg-secondary transition-colors",
                        section.chordProgressionId === progression.id && "bg-secondary/50"
                      )}
                    >
                      <div className="font-medium mb-0.5 text-[11px]">{progression.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground/60">
                        {progression.chords.slice(0, 4).join(' ')}
                        {progression.chords.length > 4 && '...'}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Label */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {editingLabel ? (
            <input
              ref={labelInputRef}
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLabelBlur();
                if (e.key === 'Escape') {
                  setLocalLabel(section.label);
                  setEditingLabel(false);
                }
              }}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none border-b border-accent/50"
            />
          ) : (
            <>
              <button
                onClick={() => setEditingLabel(true)}
                className="text-xs font-medium hover:text-accent transition-colors"
              >
                {section.label}
              </button>
              {section.isCollapsed && section.content.trim() && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-[11px] text-muted-foreground/60 italic truncate">
                    {section.content.substring(0, 30).trim()}...
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{lineCount} lines</span>
          <span>{syllableCount} syl</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDuplicate(section.id)}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onUpdate(section.id, { isCollapsed: !section.isCollapsed })}
          >
            {section.isCollapsed ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(section.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!section.isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 relative">
              <textarea
                ref={textareaRef}
                value={section.content}
                onChange={(e) => onUpdate(section.id, { content: e.target.value })}
                placeholder="Start writing..."
                className="w-full min-h-[96px] bg-transparent font-mono text-xs leading-snug resize-none focus:outline-none placeholder:text-muted-foreground/40"
                onFocus={() => setIsEditing(true)}
                onBlur={() => setIsEditing(false)}
              />
            </div>

            {/* Footer actions */}
            <div className="px-3 pb-2 flex justify-end">
              <Button
                variant="lyra"
                size="sm"
                onClick={() => onAskLyra(section.id, section.content)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Sparkles className="w-3 h-3" />
                Ask Lyra
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
