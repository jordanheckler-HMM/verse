/**
 * Suggestion Pipeline Module
 * 
 * Manages the approve/reject workflow for Lyra's proposals.
 * Ensures suggestions NEVER auto-apply.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  LyraSuggestion,
  Section,
  SuggestionNotFoundError,
} from '../types';
import { sessionManager } from './SessionManager';
import { timelineEngine } from './TimelineEngine';

/**
 * SuggestionPipeline - Manages suggestion lifecycle
 * 
 * Responsibilities:
 * - Store pending suggestions in memory
 * - Apply approved suggestions to timeline
 * - Track suggestion status (pending → applied/rejected)
 * - Maintain suggestion-session association
 * 
 * CRITICAL: Suggestions NEVER auto-apply
 */
export class SuggestionPipeline {
  // Map of suggestion ID to session ID for fast lookup
  private suggestionToSession: Map<string, string>;

  constructor() {
    this.suggestionToSession = new Map();
  }

  /**
   * Creates and stores a new suggestion
   * @param sessionId - Session identifier
   * @param targetSectionId - Section to be modified
   * @param originalContent - Current lyrics
   * @param suggestedContent - Proposed lyrics
   * @returns Created suggestion
   */
  createSuggestion(
    sessionId: string,
    targetSectionId: string,
    originalContent: string,
    suggestedContent: string
  ): LyraSuggestion {
    sessionManager.getSessionOrThrow(sessionId);
    
    const suggestion: LyraSuggestion = {
      id: uuidv4(),
      targetSectionId,
      originalContent,
      suggestedContent,
      status: 'pending',
      createdAt: new Date(),
    };
    
    // Store suggestion-session mapping
    this.suggestionToSession.set(suggestion.id, sessionId);
    
    console.log(`[SuggestionPipeline] Created suggestion: ${suggestion.id}`);
    return suggestion;
  }

  /**
   * Applies an approved suggestion to the timeline
   * @param sessionId - Session identifier
   * @param suggestionId - Suggestion identifier
   * @returns Updated section
   */
  applySuggestion(sessionId: string, suggestionId: string): Section {
    const session = sessionManager.getSessionOrThrow(sessionId);
    
    // Find suggestion in conversation history
    const suggestion = this.findSuggestion(session.conversationHistory, suggestionId);
    
    // Validate suggestion is pending
    if (suggestion.status !== 'pending') {
      throw new Error(`Suggestion ${suggestionId} is not pending (status: ${suggestion.status})`);
    }
    
    // Apply changes to timeline
    const updatedSection = timelineEngine.updateSection(
      sessionId,
      suggestion.targetSectionId,
      { content: suggestion.suggestedContent }
    );
    
    // Update suggestion status
    suggestion.status = 'applied';
    
    console.log(`[SuggestionPipeline] Applied suggestion: ${suggestionId}`);
    return updatedSection;
  }

  /**
   * Rejects a suggestion
   * @param sessionId - Session identifier
   * @param suggestionId - Suggestion identifier
   */
  rejectSuggestion(sessionId: string, suggestionId: string): void {
    const session = sessionManager.getSessionOrThrow(sessionId);
    
    // Find suggestion in conversation history
    const suggestion = this.findSuggestion(session.conversationHistory, suggestionId);
    
    // Validate suggestion is pending
    if (suggestion.status !== 'pending') {
      throw new Error(`Suggestion ${suggestionId} is not pending (status: ${suggestion.status})`);
    }
    
    // Update suggestion status
    suggestion.status = 'rejected';
    
    console.log(`[SuggestionPipeline] Rejected suggestion: ${suggestionId}`);
  }

  /**
   * Gets a suggestion by ID
   * @param suggestionId - Suggestion identifier
   * @returns Suggestion and its session ID
   */
  getSuggestion(suggestionId: string): { suggestion: LyraSuggestion; sessionId: string } | null {
    const sessionId = this.suggestionToSession.get(suggestionId);
    if (!sessionId) {
      return null;
    }
    
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      // Session was ended, clean up mapping
      this.suggestionToSession.delete(suggestionId);
      return null;
    }
    
    try {
      const suggestion = this.findSuggestion(session.conversationHistory, suggestionId);
      return { suggestion, sessionId };
    } catch {
      return null;
    }
  }

  /**
   * Gets all pending suggestions for a session
   * @param sessionId - Session identifier
   * @returns Array of pending suggestions
   */
  getPendingSuggestions(sessionId: string): LyraSuggestion[] {
    const session = sessionManager.getSessionOrThrow(sessionId);
    
    const suggestions: LyraSuggestion[] = [];
    for (const message of session.conversationHistory) {
      if (message.suggestion && message.suggestion.status === 'pending') {
        suggestions.push(message.suggestion);
      }
    }
    
    return suggestions;
  }

  /**
   * Cleans up suggestion mappings for a session
   * Called when a session ends
   * @param sessionId - Session identifier
   */
  cleanupSession(sessionId: string): void {
    // Remove all suggestion mappings for this session
    const toRemove: string[] = [];
    for (const [suggestionId, sid] of this.suggestionToSession.entries()) {
      if (sid === sessionId) {
        toRemove.push(suggestionId);
      }
    }
    
    for (const suggestionId of toRemove) {
      this.suggestionToSession.delete(suggestionId);
    }
    
    console.log(`[SuggestionPipeline] Cleaned up ${toRemove.length} suggestions for session ${sessionId}`);
  }

  /**
   * Helper: Finds suggestion in conversation history
   * @param conversationHistory - Array of messages
   * @param suggestionId - Suggestion identifier
   * @returns Found suggestion
   */
  private findSuggestion(
    conversationHistory: Array<{ suggestion?: LyraSuggestion }>,
    suggestionId: string
  ): LyraSuggestion {
    for (const message of conversationHistory) {
      if (message.suggestion && message.suggestion.id === suggestionId) {
        return message.suggestion;
      }
    }
    
    throw new SuggestionNotFoundError(suggestionId);
  }
}

// Singleton instance
export const suggestionPipeline = new SuggestionPipeline();
