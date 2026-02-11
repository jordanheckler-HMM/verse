import { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { ChordProgression, MusicContext } from '@/types/song';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

interface ChordProgressionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  musicContext?: MusicContext;
  onUpdate: (context: MusicContext) => void;
}

export function ChordProgressionManager({
  isOpen,
  onClose,
  musicContext,
  onUpdate,
}: ChordProgressionManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingChords, setEditingChords] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newChords, setNewChords] = useState('');

  const progressions = musicContext?.chordProgressions || [];

  const parseChords = (input: string): string[] => {
    // Split by spaces, commas, or hyphens, filter empty
    return input
      .split(/[\s,\-–—]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
  };

  const handleStartEdit = (progression: ChordProgression) => {
    setEditingId(progression.id);
    setEditingName(progression.name);
    setEditingChords(progression.chords.join(' '));
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;

    const chords = parseChords(editingChords);
    if (chords.length === 0) return;

    const updatedProgressions = progressions.map(p =>
      p.id === editingId
        ? { ...p, name: editingName.trim(), chords }
        : p
    );

    onUpdate({
      ...musicContext,
      chordProgressions: updatedProgressions,
    });

    setEditingId(null);
    setEditingName('');
    setEditingChords('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingChords('');
  };

  const handleDelete = (id: string) => {
    const updatedProgressions = progressions.filter(p => p.id !== id);
    onUpdate({
      ...musicContext,
      chordProgressions: updatedProgressions,
    });
  };

  const handleAdd = () => {
    if (!newName.trim()) return;

    const chords = parseChords(newChords);
    if (chords.length === 0) return;

    const newProgression: ChordProgression = {
      id: uuidv4(),
      name: newName.trim(),
      chords,
    };

    onUpdate({
      ...musicContext,
      chordProgressions: [...progressions, newProgression],
    });

    setIsAdding(false);
    setNewName('');
    setNewChords('');
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewName('');
    setNewChords('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Chord Progressions</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {progressions.length === 0 && !isAdding ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <p className="mb-2">No chord progressions yet</p>
              <p className="text-xs text-muted-foreground/60">
                Add progressions to reference them in your sections
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {progressions.map((progression) => (
                <div
                  key={progression.id}
                  className="p-2.5 bg-card border border-border/70 rounded-md"
                >
                  {editingId === progression.id ? (
                    <div className="space-y-1.5">
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Progression name"
                        className="w-full px-2.5 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent/20"
                      />
                      <input
                        value={editingChords}
                        onChange={(e) => setEditingChords(e.target.value)}
                        placeholder="C G Am F"
                        className="w-full px-2.5 py-1.5 text-sm font-mono bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent/20"
                      />
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={!editingName.trim() || parseChords(editingChords).length === 0}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium mb-1">
                          {progression.name}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {progression.chords.join(' – ')}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleStartEdit(progression)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(progression.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new progression */}
          {isAdding ? (
            <div className="p-2.5 bg-secondary/40 border border-border rounded-md space-y-1.5">
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Progression name (e.g., Main Loop)"
                        aria-label="Progression name"
                        className="w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent/20"
                        autoFocus
                      />
                      <input
                        value={newChords}
                        onChange={(e) => setNewChords(e.target.value)}
                        placeholder="Chords (e.g., C G Am F)"
                        aria-label="Chord sequence"
                        className="w-full px-2.5 py-1.5 text-sm font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newName.trim() && parseChords(newChords).length > 0) {
                            handleAdd();
                          }
                        }}
                      />
              <p className="text-xs text-muted-foreground/60">
                Separate chords with spaces. No timing needed.
              </p>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newName.trim() || parseChords(newChords).length === 0}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelAdd}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Progression
            </Button>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
