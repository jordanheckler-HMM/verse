import { useState } from 'react';
import { Music, ChevronDown } from 'lucide-react';
import { MusicContext } from '@/types/song';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SongContextBarProps {
  musicContext?: MusicContext;
  onUpdate: (context: MusicContext) => void;
  onManageProgressions: () => void;
  metadata?: {
    genre?: string;
    mood?: string;
    referenceText?: string;
  };
  onMetadataUpdate?: (metadata: { genre?: string; mood?: string; referenceText?: string }) => void;
}

export function SongContextBar({ 
  musicContext, 
  onUpdate,
  onManageProgressions,
  metadata,
  onMetadataUpdate
}: SongContextBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [editingBpm, setEditingBpm] = useState(false);
  const [editingGenre, setEditingGenre] = useState(false);
  const [editingMood, setEditingMood] = useState(false);
  const [editingStyle, setEditingStyle] = useState(false);
  const [localKey, setLocalKey] = useState(musicContext?.key || '');
  const [localBpm, setLocalBpm] = useState(musicContext?.bpm?.toString() || '');
  const [localGenre, setLocalGenre] = useState(metadata?.genre || '');
  const [localMood, setLocalMood] = useState(metadata?.mood || '');
  const [localStyle, setLocalStyle] = useState(metadata?.referenceText || '');

  const hasContent = musicContext?.key || musicContext?.bpm || (musicContext?.chordProgressions && musicContext.chordProgressions.length > 0) || metadata?.genre || metadata?.mood || metadata?.referenceText;

  const handleKeyBlur = () => {
    setEditingKey(false);
    onUpdate({
      ...musicContext,
      key: localKey.trim() || undefined,
    });
  };

  const handleBpmBlur = () => {
    setEditingBpm(false);
    const bpmNum = parseInt(localBpm, 10);
    onUpdate({
      ...musicContext,
      bpm: isNaN(bpmNum) ? undefined : bpmNum,
    });
  };

  const handleGenreBlur = () => {
    setEditingGenre(false);
    if (onMetadataUpdate) {
      onMetadataUpdate({
        ...metadata,
        genre: localGenre.trim() || undefined,
      });
    }
  };

  const handleMoodBlur = () => {
    setEditingMood(false);
    if (onMetadataUpdate) {
      onMetadataUpdate({
        ...metadata,
        mood: localMood.trim() || undefined,
      });
    }
  };

  const handleStyleBlur = () => {
    setEditingStyle(false);
    if (onMetadataUpdate) {
      onMetadataUpdate({
        ...metadata,
        referenceText: localStyle.trim() || undefined,
      });
    }
  };

  // If no content and collapsed, show minimal placeholder
  if (isCollapsed && !hasContent) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="w-full h-7 border-b border-border/30 flex items-center justify-center hover:bg-secondary/20 transition-colors group"
      >
        <Music className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground/60" />
        <span className="text-[11px] text-muted-foreground/40 ml-1.5 group-hover:text-muted-foreground/60">
          Add musical context
        </span>
      </button>
    );
  }

  return (
    <div className={cn(
      "w-full border-b border-border/30 bg-card/20 transition-all",
      isCollapsed ? "h-7" : "h-auto"
    )}>
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full h-full px-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors text-[11px] text-muted-foreground"
        >
          <Music className="w-3 h-3" />
          {metadata?.genre && <span>{metadata.genre}</span>}
          {metadata?.mood && <span>{metadata.mood}</span>}
          {musicContext?.key && <span>Key: {musicContext.key}</span>}
          {musicContext?.bpm && <span>BPM: {musicContext.bpm}</span>}
          {musicContext?.chordProgressions && musicContext.chordProgressions.length > 0 && (
            <span>{musicContext.chordProgressions.length} progression{musicContext.chordProgressions.length !== 1 ? 's' : ''}</span>
          )}
        </button>
      ) : (
        <div className="px-3 py-2">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Icon */}
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-muted-foreground" />
              <button
                onClick={() => setIsCollapsed(true)}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Genre */}
            <div className="flex items-center gap-2">
              <label htmlFor="song-genre" className="text-xs text-muted-foreground/70">Genre:</label>
              {editingGenre ? (
                <input
                  id="song-genre"
                  value={localGenre}
                  onChange={(e) => setLocalGenre(e.target.value)}
                  onBlur={handleGenreBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenreBlur();
                    if (e.key === 'Escape') {
                      setLocalGenre(metadata?.genre || '');
                      setEditingGenre(false);
                    }
                  }}
                  placeholder="Pop, Rock, etc."
                  aria-label="Song genre"
                  className="w-24 px-2 py-1 text-[11px] bg-secondary/50 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-accent/50"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setLocalGenre(metadata?.genre || '');
                    setEditingGenre(true);
                  }}
                  aria-label={metadata?.genre ? `Genre: ${metadata.genre}. Click to edit.` : 'Set genre'}
                  className="px-2 py-1 text-[11px] rounded hover:bg-secondary/50 transition-colors min-w-[56px] text-left"
                >
                  {metadata?.genre || <span className="text-muted-foreground/40">None</span>}
                </button>
              )}
            </div>

            {/* Mood */}
            <div className="flex items-center gap-2">
              <label htmlFor="song-mood" className="text-xs text-muted-foreground/70">Mood:</label>
              {editingMood ? (
                <input
                  id="song-mood"
                  value={localMood}
                  onChange={(e) => setLocalMood(e.target.value)}
                  onBlur={handleMoodBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleMoodBlur();
                    if (e.key === 'Escape') {
                      setLocalMood(metadata?.mood || '');
                      setEditingMood(false);
                    }
                  }}
                  placeholder="Upbeat, Sad, etc."
                  aria-label="Song mood"
                  className="w-24 px-2 py-1 text-[11px] bg-secondary/50 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-accent/50"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setLocalMood(metadata?.mood || '');
                    setEditingMood(true);
                  }}
                  aria-label={metadata?.mood ? `Mood: ${metadata.mood}. Click to edit.` : 'Set mood'}
                  className="px-2 py-1 text-[11px] rounded hover:bg-secondary/50 transition-colors min-w-[56px] text-left"
                >
                  {metadata?.mood || <span className="text-muted-foreground/40">None</span>}
                </button>
              )}
            </div>

            {/* Key */}
            <div className="flex items-center gap-2">
              <label htmlFor="song-key" className="text-xs text-muted-foreground/70">Key:</label>
              {editingKey ? (
                <input
                  id="song-key"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  onBlur={handleKeyBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleKeyBlur();
                    if (e.key === 'Escape') {
                      setLocalKey(musicContext?.key || '');
                      setEditingKey(false);
                    }
                  }}
                  placeholder="C Major"
                  aria-label="Song key"
                  className="w-20 px-2 py-1 text-[11px] bg-secondary/50 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-accent/50"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setLocalKey(musicContext?.key || '');
                    setEditingKey(true);
                  }}
                  aria-label={musicContext?.key ? `Song key: ${musicContext.key}. Click to edit.` : 'Set song key'}
                  className="px-2 py-1 text-[11px] rounded hover:bg-secondary/50 transition-colors min-w-[50px] text-left"
                >
                  {musicContext?.key || <span className="text-muted-foreground/40">None</span>}
                </button>
              )}
            </div>

            {/* BPM */}
            <div className="flex items-center gap-2">
              <label htmlFor="song-bpm" className="text-xs text-muted-foreground/70">BPM:</label>
              {editingBpm ? (
                <input
                  id="song-bpm"
                  type="number"
                  min="1"
                  max="300"
                  value={localBpm}
                  onChange={(e) => setLocalBpm(e.target.value)}
                  onBlur={handleBpmBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBpmBlur();
                    if (e.key === 'Escape') {
                      setLocalBpm(musicContext?.bpm?.toString() || '');
                      setEditingBpm(false);
                    }
                  }}
                  placeholder="92"
                  aria-label="Song tempo in beats per minute"
                  className="w-14 px-2 py-1 text-[11px] bg-secondary/50 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-accent/50"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setLocalBpm(musicContext?.bpm?.toString() || '');
                    setEditingBpm(true);
                  }}
                  aria-label={musicContext?.bpm ? `Song tempo: ${musicContext.bpm} BPM. Click to edit.` : 'Set song tempo'}
                  className="px-2 py-1 text-[11px] rounded hover:bg-secondary/50 transition-colors min-w-[36px] text-left"
                >
                  {musicContext?.bpm || <span className="text-muted-foreground/40">None</span>}
                </button>
              )}
            </div>

            {/* Chord Progressions */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground/70">Chords:</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={onManageProgressions}
                className="h-6 text-[11px]"
                aria-label={
                  musicContext?.chordProgressions && musicContext.chordProgressions.length > 0
                    ? `Manage ${musicContext.chordProgressions.length} chord progression${musicContext.chordProgressions.length !== 1 ? 's' : ''}`
                    : 'Manage chord progressions'
                }
              >
                {musicContext?.chordProgressions && musicContext.chordProgressions.length > 0 ? (
                  <>
                    {musicContext.chordProgressions.length} progression{musicContext.chordProgressions.length !== 1 ? 's' : ''}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <span className="text-muted-foreground/60">Manage</span>
                )}
              </Button>
            </div>
          </div>

          {/* Style Reference (full width on second row) */}
          {(editingStyle || metadata?.referenceText) && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="flex items-start gap-2">
                <label htmlFor="song-style" className="text-[11px] text-muted-foreground/70 pt-1">Style:</label>
                {editingStyle ? (
                  <input
                    id="song-style"
                    value={localStyle}
                    onChange={(e) => setLocalStyle(e.target.value)}
                    onBlur={handleStyleBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStyleBlur();
                      if (e.key === 'Escape') {
                        setLocalStyle(metadata?.referenceText || '');
                        setEditingStyle(false);
                      }
                    }}
                    placeholder='e.g., "Think early Taylor Swift"'
                    aria-label="Style reference"
                    className="flex-1 px-2 py-1 text-[11px] bg-secondary/50 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-accent/50"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setLocalStyle(metadata?.referenceText || '');
                      setEditingStyle(true);
                    }}
                    aria-label={metadata?.referenceText ? `Style: ${metadata.referenceText}. Click to edit.` : 'Set style reference'}
                    className="flex-1 px-2 py-1 text-[11px] rounded hover:bg-secondary/50 transition-colors text-left"
                  >
                    {metadata?.referenceText || <span className="text-muted-foreground/40 italic">Add style reference...</span>}
                  </button>
                )}
              </div>
            </div>
          )}
          {!editingStyle && !metadata?.referenceText && (
            <button
              onClick={() => setEditingStyle(true)}
              className="mt-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
            >
              + Add style reference
            </button>
          )}
        </div>
      )}
    </div>
  );
}
