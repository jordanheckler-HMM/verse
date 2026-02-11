/**
 * Timeline Engine Module
 * 
 * Manages timeline sections with full creative freedom.
 * No validation - users can structure songs however they want.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Section, 
  SectionType, 
  SectionNotFoundError 
} from '../types';
import { sessionManager } from './SessionManager';

/**
 * TimelineEngine - Manages section CRUD operations
 * 
 * Responsibilities:
 * - Add, update, delete sections
 * - Maintain section order
 * - Support unlimited sections of any type
 * - Allow duplicate section types (e.g., Verse 1, Verse 2)
 * - NO structure validation
 */
export class TimelineEngine {
  
  /**
   * Adds a new section to the timeline
   * @param sessionId - Session identifier
   * @param type - Section type (verse, chorus, etc.)
   * @param label - User-defined label
   * @param content - Initial lyrics (defaults to empty)
   * @returns Created section
   */
  addSection(
    sessionId: string,
    type: SectionType,
    label: string,
    content: string = ''
  ): Section {
    const session = sessionManager.getSessionOrThrow(sessionId);
    
    const section: Section = {
      id: uuidv4(),
      type,
      label,
      content,
      isCollapsed: false,
      status: undefined,
      previewingSuggestionId: undefined,
      chordProgressionId: undefined,
    };
    
    session.sections.push(section);
    
    console.log(`[TimelineEngine] Added section: ${section.id} (${type}) to session ${sessionId}`);
    return section;
  }

  /**
   * Updates an existing section
   * @param sessionId - Session identifier
   * @param sectionId - Section identifier
   * @param updates - Partial section updates (content, label)
   * @returns Updated section
   */
  updateSection(
    sessionId: string,
    sectionId: string,
    updates: { content?: string; label?: string }
  ): Section {
    const session = sessionManager.getSessionOrThrow(sessionId);
    const section = this.findSection(session.sections, sectionId);
    
    // Apply updates
    if (updates.content !== undefined) {
      section.content = updates.content;
    }
    if (updates.label !== undefined) {
      section.label = updates.label;
    }
    
    console.log(`[TimelineEngine] Updated section: ${sectionId}`);
    return section;
  }

  /**
   * Deletes a section from the timeline
   * @param sessionId - Session identifier
   * @param sectionId - Section identifier
   */
  deleteSection(sessionId: string, sectionId: string): void {
    const session = sessionManager.getSessionOrThrow(sessionId);
    
    const index = session.sections.findIndex(s => s.id === sectionId);
    if (index === -1) {
      throw new SectionNotFoundError(sectionId);
    }
    
    // Remove section
    session.sections.splice(index, 1);
    
    console.log(`[TimelineEngine] Deleted section: ${sectionId}`);
  }

  /**
   * Reorders sections based on provided ID array
   * @param sessionId - Session identifier
   * @param sectionIds - Array of section IDs in desired order
   * @returns Reordered sections array
   */
  reorderSections(sessionId: string, sectionIds: string[]): Section[] {
    const session = sessionManager.getSessionOrThrow(sessionId);
    
    // Validate all IDs exist
    const existingIds = new Set(session.sections.map(s => s.id));
    for (const id of sectionIds) {
      if (!existingIds.has(id)) {
        throw new SectionNotFoundError(id);
      }
    }
    
    // Ensure all sections are included (no additions or removals)
    if (sectionIds.length !== session.sections.length) {
      throw new Error('Section ID array must contain all section IDs');
    }
    
    // Create ID to section map
    const sectionMap = new Map(session.sections.map(s => [s.id, s]));
    
    // Reorder based on provided IDs
    session.sections = sectionIds.map(id => sectionMap.get(id)!);
    
    console.log(`[TimelineEngine] Reordered sections for session ${sessionId}`);
    return session.sections;
  }

  /**
   * Duplicates an existing section
   * @param sessionId - Session identifier
   * @param sectionId - Section identifier to duplicate
   * @returns Newly created duplicate section
   */
  duplicateSection(sessionId: string, sectionId: string): Section {
    const session = sessionManager.getSessionOrThrow(sessionId);
    const original = this.findSection(session.sections, sectionId);
    
    // Create duplicate with new ID
    const duplicate: Section = {
      id: uuidv4(),
      type: original.type,
      label: `${original.label} (Copy)`,
      content: original.content,
      isCollapsed: original.isCollapsed,
      status: original.status,
      previewingSuggestionId: undefined,
      chordProgressionId: original.chordProgressionId,
    };
    
    session.sections.push(duplicate);
    
    console.log(`[TimelineEngine] Duplicated section: ${sectionId} -> ${duplicate.id}`);
    return duplicate;
  }

  /**
   * Gets all sections for a session
   * @param sessionId - Session identifier
   * @returns Array of sections in order
   */
  getSections(sessionId: string): Section[] {
    const session = sessionManager.getSessionOrThrow(sessionId);
    return [...session.sections]; // Return copy to prevent external mutation
  }

  /**
   * Gets a single section by ID
   * @param sessionId - Session identifier
   * @param sectionId - Section identifier
   * @returns Section
   */
  getSection(sessionId: string, sectionId: string): Section {
    const session = sessionManager.getSessionOrThrow(sessionId);
    return this.findSection(session.sections, sectionId);
  }

  /**
   * Helper: Finds section in array or throws error
   * @param sections - Array of sections to search
   * @param sectionId - Section identifier
   * @returns Found section
   */
  private findSection(sections: Section[], sectionId: string): Section {
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      throw new SectionNotFoundError(sectionId);
    }
    return section;
  }

}

// Singleton instance
export const timelineEngine = new TimelineEngine();

