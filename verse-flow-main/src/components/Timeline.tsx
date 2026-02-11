import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Section, SectionType, SECTION_LABELS, ChordProgression } from '@/types/song';
import { TimelineBlock } from './TimelineBlock';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimelineProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  onAskLyra: (sectionId: string, content: string) => void;
  chordProgressions: ChordProgression[];
}

const sectionTypes: SectionType[] = ['verse', 'chorus', 'prechorus', 'bridge', 'hook', 'outro'];

const sectionButtonColors: Record<SectionType, string> = {
  verse: 'hover:border-section-verse/50 hover:bg-section-verse/10',
  chorus: 'hover:border-section-chorus/50 hover:bg-section-chorus/10',
  prechorus: 'hover:border-section-prechorus/50 hover:bg-section-prechorus/10',
  bridge: 'hover:border-section-bridge/50 hover:bg-section-bridge/10',
  hook: 'hover:border-section-hook/50 hover:bg-section-hook/10',
  outro: 'hover:border-section-outro/50 hover:bg-section-outro/10',
};

export function Timeline({ sections, onSectionsChange, onAskLyra, chordProgressions }: TimelineProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      onSectionsChange(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const addSection = (type: SectionType) => {
    const typeCount = sections.filter((s) => s.type === type).length;
    const label = typeCount === 0 ? SECTION_LABELS[type] : `${SECTION_LABELS[type]} ${typeCount + 1}`;
    
    const newSection: Section = {
      id: `${type}-${Date.now()}`,
      type,
      label,
      content: '',
      isCollapsed: false,
    };
    
    onSectionsChange([...sections, newSection]);
    setShowAddMenu(false);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    onSectionsChange(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const duplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;

    const typeCount = sections.filter((s) => s.type === section.type).length;
    const newSection: Section = {
      ...section,
      id: `${section.type}-${Date.now()}`,
      label: `${SECTION_LABELS[section.type]} ${typeCount + 1}`,
    };

    const index = sections.findIndex((s) => s.id === id);
    const newSections = [...sections];
    newSections.splice(index + 1, 0, newSection);
    onSectionsChange(newSections);
  };

  const deleteSection = (id: string) => {
    onSectionsChange(sections.filter((s) => s.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <h2 className="text-xs font-semibold text-muted-foreground tracking-wide">Timeline</h2>
        <div className="relative">
          <Button
            variant="section"
            size="sm"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            <Plus className="w-4 h-4" />
            Add Section
          </Button>

          <AnimatePresence>
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 z-50 bg-popover border border-border/80 rounded-md p-1 min-w-[150px]"
              >
                {sectionTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    className={cn(
                      'w-full px-2.5 py-1.5 text-xs text-left rounded border border-transparent transition-colors',
                      sectionButtonColors[type]
                    )}
                  >
                    {SECTION_LABELS[type]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-40 text-center"
          >
            <div className="w-10 h-10 rounded-md bg-secondary/40 border border-border/60 flex items-center justify-center mb-2.5">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No sections yet</p>
            <p className="text-xs text-muted-foreground/60">
              Add a section to start writing
            </p>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence mode="popLayout">
                {sections.map((section) => (
                  <TimelineBlock
                    key={section.id}
                    section={section}
                    onUpdate={updateSection}
                    onDuplicate={duplicateSection}
                    onDelete={deleteSection}
                    onAskLyra={onAskLyra}
                    chordProgressions={chordProgressions}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
