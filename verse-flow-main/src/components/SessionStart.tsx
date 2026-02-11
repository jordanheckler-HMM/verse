import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SessionData, GENRES } from '@/types/song';

interface SessionStartProps {
  onStart: (data: SessionData) => void;
}

export function SessionStart({ onStart }: SessionStartProps) {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [referenceText, setReferenceText] = useState('');

  const handleStart = () => {
    onStart({
      name: name || 'Untitled Session',
      genre,
      mood,
      referenceText: referenceText || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
              <Music2 className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Verse</h1>
          </motion.div>
          <p className="text-muted-foreground">
            Your private songwriting studio
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass rounded-2xl p-8 space-y-6"
        >
          {/* Session Name */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Session name</label>
            <Input
              placeholder="Untitled Session"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Genre</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.slice(0, 8).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(genre === g ? '' : g)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                    genre === g
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'bg-secondary text-muted-foreground border border-transparent hover:border-border hover:text-foreground'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Mood / Vibe</label>
            <Input
              placeholder="e.g., melancholic, energetic, nostalgic..."
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              Reference lyrics
              <span className="text-xs text-muted-foreground/60">(optional)</span>
            </label>
            <Textarea
              placeholder="Paste lyrics or notes for style matching..."
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full mt-4"
          >
            <Sparkles className="w-4 h-4" />
            Start Writing
          </Button>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground/60 mt-6"
        >
          Your session stays private. Lyra adapts to your style.
        </motion.p>
      </motion.div>
    </div>
  );
}
