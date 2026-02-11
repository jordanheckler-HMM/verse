/**
 * Session Manager Module
 * 
 * Manages session lifecycle entirely in memory.
 * No persistence - all data destroyed on session end.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  SessionData, 
  SessionMetadata, 
  SessionNotFoundError,
  MusicContext
} from '../types';

/**
 * SessionManager - Singleton managing all active sessions
 * 
 * Responsibilities:
 * - Create new sessions with unique IDs
 * - Store session data in memory (Map)
 * - Destroy sessions completely
 * - Validate session existence
 */
export class SessionManager {
  private sessions: Map<string, SessionData>;

  constructor() {
    this.sessions = new Map();
  }

  /**
   * Creates a new session with provided metadata
   * @param metadata - Genre, mood, and optional style reference
   * @returns Session ID
   */
  createSession(metadata: SessionMetadata): string {
    const sessionId = uuidv4();
    
    const sessionData: SessionData = {
      sessionId,
      metadata,
      sections: [],
      conversationHistory: [],
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, sessionData);
    
    console.log(`[SessionManager] Created session: ${sessionId}`);
    return sessionId;
  }

  /**
   * Retrieves session data by ID
   * @param sessionId - Session identifier
   * @returns Session data or null if not found
   */
  getSession(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Retrieves session data or throws error
   * @param sessionId - Session identifier
   * @returns Session data
   * @throws SessionNotFoundError if session doesn't exist
   */
  getSessionOrThrow(sessionId: string): SessionData {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  /**
   * Ends a session and destroys all associated data
   * @param sessionId - Session identifier
   * @returns true if session was deleted, false if not found
   */
  endSession(sessionId: string): boolean {
    const existed = this.sessions.has(sessionId);
    
    if (existed) {
      // Explicitly clear all data before deleting
      const session = this.sessions.get(sessionId);
      if (session) {
        session.sections = [];
        session.conversationHistory = [];
      }
      
      this.sessions.delete(sessionId);
      console.log(`[SessionManager] Ended session: ${sessionId}`);
    }
    
    return existed;
  }

  /**
   * Updates session metadata
   * @param sessionId - Session identifier
   * @param metadata - Partial metadata to update
   */
  updateSessionMetadata(
    sessionId: string, 
    metadata: Partial<SessionMetadata>
  ): void {
    const session = this.getSessionOrThrow(sessionId);
    
    session.metadata = {
      ...session.metadata,
      ...metadata,
    };
    
    console.log(`[SessionManager] Updated metadata for session: ${sessionId}`);
  }

  /**
   * Checks if a session exists
   * @param sessionId - Session identifier
   * @returns true if session exists
   */
  sessionExists(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Gets count of active sessions
   * @returns Number of active sessions
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Lists all active session IDs (for debugging)
   * @returns Array of session IDs
   */
  listActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Clears all sessions (for testing/cleanup)
   * WARNING: This destroys all session data
   */
  clearAllSessions(): void {
    const count = this.sessions.size;
    this.sessions.clear();
    console.log(`[SessionManager] Cleared all sessions (${count} removed)`);
  }

  /**
   * Flushes Lyra conversation history for a session
   * Used when switching projects to isolate AI memory
   * @param sessionId - Session identifier
   */
  flushSession(sessionId: string): void {
    const session = this.getSessionOrThrow(sessionId);
    session.conversationHistory = [];
    console.log(`[SessionManager] Flushed conversation history for session: ${sessionId}`);
  }

  /**
   * Reinitializes a session with new project context
   * Clears conversation history and updates metadata
   * @param sessionId - Session identifier
   * @param metadata - New metadata from project
   */
  reinitializeSession(sessionId: string, metadata: SessionMetadata): void {
    const session = this.getSessionOrThrow(sessionId);
    
    // Clear conversation history
    session.conversationHistory = [];
    
    // Update metadata
    session.metadata = metadata;
    
    console.log(`[SessionManager] Reinitialized session: ${sessionId} with new project context`);
  }

  /**
   * Updates the musical context for a session
   * @param sessionId - Session identifier
   * @param musicContext - Musical context (key, BPM, chord progressions)
   */
  updateMusicContext(sessionId: string, musicContext?: MusicContext): void {
    const session = this.getSessionOrThrow(sessionId);
    session.musicContext = musicContext;
    console.log(`[SessionManager] Updated music context for session: ${sessionId}`);
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

