/**
 * Core type definitions for Verse backend
 * Matches frontend types with backend-specific additions
 */

/**
 * Section types - extensible enum-like union
 * Supports all standard song structure elements plus intro
 */
export type SectionType = 
  | 'verse' 
  | 'chorus' 
  | 'prechorus' 
  | 'bridge' 
  | 'hook' 
  | 'outro' 
  | 'intro';

/**
 * Timeline section/block
 * Represents a single lyrical section in the song timeline
 */
export interface Section {
  id: string;
  type: SectionType;
  label: string;        // User-editable label (e.g., "Chorus 2 (Alt)")
  content: string;      // Actual lyrical content
  isCollapsed: boolean;
  status?: SectionStatus;
  previewingSuggestionId?: string;
  chordProgressionId?: string;  // Optional reference to chord progression
}

/**
 * Session metadata provided at session start
 * Used to inform Lyra's creative context
 */
export interface SessionMetadata {
  genre: string;
  mood: string;
  styleReference?: string;  // Optional reference lyrics or style description
}

/**
 * Complete session data structure
 * Lives entirely in memory - destroyed on session end
 */
export interface SessionData {
  sessionId: string;
  metadata: SessionMetadata;
  sections: Section[];
  conversationHistory: LyraMessage[];
  createdAt: Date;
  musicContext?: MusicContext;
}

/**
 * Message in Lyra conversation
 * Can be from user or from Lyra (with optional suggestion)
 */
export interface LyraMessage {
  id: string;
  role: 'user' | 'lyra';
  content: string;
  timestamp: Date;
  suggestion?: LyraSuggestion;
}

/**
 * Lyra's proposed change to a section
 * NEVER auto-applies - requires explicit user approval
 */
export interface LyraSuggestion {
  id: string;
  targetSectionId: string;
  originalContent: string;
  suggestedContent: string;
  status: 'pending' | 'applied' | 'rejected';
  createdAt: Date;
}

/**
 * Response from Lyra Engine after processing a message
 */
export interface LyraResponse {
  message: LyraMessage;
  suggestion?: LyraSuggestion;
}

/**
 * Request body types for API endpoints
 */
export interface StartSessionRequest {
  metadata: SessionMetadata;
}

export interface AddSectionRequest {
  sessionId: string;
  type: SectionType;
  label: string;
}

export interface UpdateSectionRequest {
  sessionId: string;
  content?: string;
  label?: string;
}

export interface ReorderSectionsRequest {
  sessionId: string;
  sectionIds: string[];
}

export interface SendLyraMessageRequest {
  sessionId: string;
  message: string;
}

export interface ApplySuggestionRequest {
  sessionId: string;
  suggestionId: string;
}

export interface RejectSuggestionRequest {
  sessionId: string;
  suggestionId: string;
}

/**
 * Ollama API request/response types
 */
export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Error types for better error handling
 */
export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

export class SectionNotFoundError extends Error {
  constructor(sectionId: string) {
    super(`Section not found: ${sectionId}`);
    this.name = 'SectionNotFoundError';
  }
}

export class SuggestionNotFoundError extends Error {
  constructor(suggestionId: string) {
    super(`Suggestion not found: ${suggestionId}`);
    this.name = 'SuggestionNotFoundError';
  }
}

export class OllamaConnectionError extends Error {
  constructor(message: string) {
    super(`Ollama connection error: ${message}`);
    this.name = 'OllamaConnectionError';
  }
}

/**
 * Project types for persistence
 */
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

export interface ProjectSection {
  id: string;
  type: SectionType;
  label: string;
  content: string;
  isCollapsed: boolean;
  status?: SectionStatus;
  previewingSuggestionId?: string;
  chordProgressionId?: string;
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  timeline: {
    sections: ProjectSection[];
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

export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
    this.name = 'ProjectNotFoundError';
  }
}

