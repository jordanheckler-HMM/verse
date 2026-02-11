export type SectionType = 'verse' | 'chorus' | 'prechorus' | 'bridge' | 'hook' | 'outro' | 'intro';

export type SectionStatus = 'draft' | 'working' | 'final';

export interface ChordProgression {
  id: string;
  name: string;
  chords: string[];
}

export interface MusicContext {
  key?: string;
  bpm?: number;
  chordProgressions?: ChordProgression[];
}

export interface Section {
  id: string;
  type: SectionType;
  label: string;
  content: string;
  isCollapsed: boolean;
  status?: SectionStatus;
  previewingSuggestionId?: string;
  chordProgressionId?: string;
}

export interface SessionMetadata {
  genre: string;
  mood: string;
  styleReference?: string;
}

export interface SessionData {
  name: string;
  genre: string;
  mood: string;
  referenceText?: string;
}

export interface LyraResponse {
  message: LyraMessage;
  suggestion?: LyraSuggestion;
}

export interface LyraMessage {
  id: string;
  role: 'user' | 'lyra';
  content: string;
  timestamp: Date;
  suggestion?: LyraSuggestion;
}

export interface LyraSuggestion {
  id: string;
  targetSectionId: string;
  originalContent: string;
  suggestedContent: string;
  status: 'pending' | 'applied' | 'rejected' | 'editing';
  createdAt: Date;
}

export const SECTION_LABELS: Record<SectionType, string> = {
  verse: 'Verse',
  chorus: 'Chorus',
  prechorus: 'Pre-Chorus',
  bridge: 'Bridge',
  hook: 'Hook',
  outro: 'Outro',
  intro: 'Intro',
};

export const GENRES = [
  'Pop',
  'Rock',
  'Hip-Hop',
  'R&B',
  'Country',
  'Electronic',
  'Indie',
  'Folk',
  'Jazz',
  'Soul',
  'Alternative',
  'Metal',
];

/**
 * Project types for persistence
 */
export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  timeline: {
    sections: Section[];
  };
  scratchpad: string;
  metadata: {
    genre?: string;
    mood?: string;
    referenceText?: string;
  };
  musicContext?: MusicContext;
  uiState?: {
    selectedSectionId?: string;
    scrollPosition?: number;
  };
}

export interface ProjectListItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}
