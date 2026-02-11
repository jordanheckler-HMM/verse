/**
 * Verse Backend API Client
 * 
 * Minimal example demonstrating how to integrate with the local backend.
 * Replace fetch calls with your preferred HTTP client (axios, etc.)
 */

import { 
  SessionMetadata, 
  Section, 
  SectionType, 
  LyraResponse,
  LyraSuggestion,
  Project,
  ProjectListItem
} from '../types/song';

type LyraStreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done'; response: LyraResponse }
  | { type: 'error'; error: string; hint?: string; status?: number };

// Backend configuration
const BACKEND_URL = 'http://localhost:3001';

/**
 * API Client for Verse Backend
 */
export class VerseApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  // =======================
  // Session Management
  // =======================

  /**
   * Starts a new session
   * @param metadata - Genre, mood, and optional style reference
   * @returns Session ID
   */
  async startSession(metadata: SessionMetadata): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      throw new Error('Failed to start session');
    }

    const data = await response.json();
    return data.sessionId;
  }

  /**
   * Ends a session (destroys all data)
   * @param sessionId - Session identifier
   */
  async endSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/session/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to end session');
    }
  }

  /**
   * Gets session data
   * @param sessionId - Session identifier
   * @returns Session data
   */
  async getSession(sessionId: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/session/${sessionId}`);

    if (!response.ok) {
      throw new Error('Failed to get session');
    }

    return response.json();
  }

  // =======================
  // Timeline Operations
  // =======================

  /**
   * Adds a new section to the timeline
   * @param sessionId - Session identifier
   * @param type - Section type (verse, chorus, etc.)
   * @param label - User-defined label
   * @returns Created section
   */
  async addSection(
    sessionId: string,
    type: SectionType,
    label: string
  ): Promise<Section> {
    const response = await fetch(`${this.baseUrl}/api/timeline/section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type, label }),
    });

    if (!response.ok) {
      throw new Error('Failed to add section');
    }

    return response.json();
  }

  /**
   * Updates a section's content or label
   * @param sessionId - Session identifier
   * @param sectionId - Section identifier
   * @param updates - Partial updates
   * @returns Updated section
   */
  async updateSection(
    sessionId: string,
    sectionId: string,
    updates: { content?: string; label?: string }
  ): Promise<Section> {
    const response = await fetch(`${this.baseUrl}/api/timeline/section/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to update section');
    }

    return response.json();
  }

  /**
   * Syncs all sections to the backend session
   * Replaces all sections in the session with the provided sections
   * @param sessionId - Session identifier
   * @param sections - Complete array of sections
   */
  async syncSections(sessionId: string, sections: Section[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/session/sync-sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, sections }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync sections');
    }
  }

  /**
   * Deletes a section
   * @param sessionId - Session identifier
   * @param sectionId - Section identifier
   */
  async deleteSection(sessionId: string, sectionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/timeline/section/${sectionId}?sessionId=${sessionId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error('Failed to delete section');
    }
  }

  /**
   * Reorders sections
   * @param sessionId - Session identifier
   * @param sectionIds - Array of section IDs in desired order
   * @returns Reordered sections
   */
  async reorderSections(sessionId: string, sectionIds: string[]): Promise<Section[]> {
    const response = await fetch(`${this.baseUrl}/api/timeline/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, sectionIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to reorder sections');
    }

    return response.json();
  }

  /**
   * Duplicates a section
   * @param sessionId - Session identifier
   * @param sectionId - Section identifier to duplicate
   * @returns New duplicate section
   */
  async duplicateSection(sessionId: string, sectionId: string): Promise<Section> {
    const response = await fetch(
      `${this.baseUrl}/api/timeline/section/${sectionId}/duplicate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to duplicate section');
    }

    return response.json();
  }

  /**
   * Gets all sections for a session
   * @param sessionId - Session identifier
   * @returns Array of sections
   */
  async getSections(sessionId: string): Promise<Section[]> {
    const response = await fetch(
      `${this.baseUrl}/api/timeline/sections?sessionId=${sessionId}`
    );

    if (!response.ok) {
      throw new Error('Failed to get sections');
    }

    return response.json();
  }

  // =======================
  // Lyra AI Collaboration
  // =======================

  /**
   * Sends a message to Lyra
   * Returns proposal only - never auto-applies
   * @param sessionId - Session identifier
   * @param message - User's message/request
   * @returns Lyra's response with optional suggestion
   */
  async sendLyraMessage(sessionId: string, message: string): Promise<LyraResponse> {
    const response = await fetch(`${this.baseUrl}/api/lyra/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message to Lyra');
    }

    return response.json();
  }

  /**
   * Sends a message to Lyra and streams response chunks
   * @param sessionId - Session identifier
   * @param message - User's message/request
   * @param onChunk - Callback invoked for each streamed text chunk
   * @returns Final Lyra response
   */
  async sendLyraMessageStream(
    sessionId: string,
    message: string,
    onChunk: (chunk: string) => void,
    options?: { signal?: AbortSignal }
  ): Promise<LyraResponse> {
    const response = await fetch(`${this.baseUrl}/api/lyra/message/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
      signal: options?.signal,
    });

    if (!response.ok) {
      let errorMessage = `Failed to send message to Lyra (${response.status})`;
      try {
        const error = await response.json();
        if (error?.error) {
          errorMessage = error.error;
        }
      } catch {
        // Ignore JSON parsing errors and keep fallback message.
      }

      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('Streaming is not supported in this environment');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResponse: LyraResponse | null = null;

    const processEventPayload = (payload: string): void => {
      if (!payload.trim()) {
        return;
      }

      const event = JSON.parse(payload) as LyraStreamEvent;

      if (event.type === 'chunk') {
        onChunk(event.content);
        return;
      }

      if (event.type === 'done') {
        finalResponse = event.response;
        return;
      }

      throw new Error(event.hint ? `${event.error}\n${event.hint}` : event.error);
    };

    const processEventBlock = (rawBlock: string): void => {
      const dataLines = rawBlock
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim());

      if (dataLines.length === 0) {
        return;
      }

      processEventPayload(dataLines.join('\n'));
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex !== -1) {
        const rawBlock = buffer.slice(0, separatorIndex).trim();
        buffer = buffer.slice(separatorIndex + 2);

        if (rawBlock) {
          processEventBlock(rawBlock);
        }

        separatorIndex = buffer.indexOf('\n\n');
      }
    }

    const remaining = buffer.trim();
    if (remaining) {
      processEventBlock(remaining);
    }

    if (!finalResponse) {
      throw new Error('Stream ended before receiving a final response');
    }

    return finalResponse;
  }

  /**
   * Checks Lyra/Ollama health status
   * @returns Health status
   */
  async checkLyraHealth(): Promise<{
    status: 'ready' | 'offline' | 'model_missing';
    message: string;
    hint?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/lyra/health`);
      return response.json();
    } catch {
      return {
        status: 'offline',
        message: 'Cannot connect to backend',
      };
    }
  }

  // =======================
  // Suggestion Approval
  // =======================

  /**
   * Applies a pending suggestion
   * @param sessionId - Session identifier
   * @param suggestionId - Suggestion identifier
   * @returns Updated section
   */
  async applySuggestion(sessionId: string, suggestionId: string): Promise<Section> {
    const response = await fetch(`${this.baseUrl}/api/approval/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, suggestionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to apply suggestion');
    }

    const data = await response.json();
    return data.section;
  }

  /**
   * Rejects a pending suggestion
   * @param sessionId - Session identifier
   * @param suggestionId - Suggestion identifier
   */
  async rejectSuggestion(sessionId: string, suggestionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/approval/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, suggestionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to reject suggestion');
    }
  }

  /**
   * Gets all pending suggestions for a session
   * @param sessionId - Session identifier
   * @returns Array of pending suggestions
   */
  async getPendingSuggestions(sessionId: string): Promise<LyraSuggestion[]> {
    const response = await fetch(
      `${this.baseUrl}/api/approval/pending?sessionId=${sessionId}`
    );

    if (!response.ok) {
      throw new Error('Failed to get pending suggestions');
    }

    return response.json();
  }

  // =======================
  // Health Check
  // =======================

  /**
   * Checks if backend is running
   * @returns true if backend is accessible
   */
  async isBackendRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // =======================
  // Project Management
  // =======================

  /**
   * Creates a new project
   * @param title - Project title
   * @param metadata - Optional session metadata
   * @returns Created project
   */
  async createProject(title: string, metadata?: SessionMetadata): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, metadata }),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    const data = await response.json();
    return data.project;
  }

  /**
   * Lists all projects
   * @returns Array of project metadata
   */
  async listProjects(): Promise<ProjectListItem[]> {
    const response = await fetch(`${this.baseUrl}/api/projects/list`);

    if (!response.ok) {
      throw new Error('Failed to list projects');
    }

    const data = await response.json();
    return data.projects;
  }

  /**
   * Loads a specific project
   * @param projectId - Project UUID
   * @returns Project object
   */
  async loadProject(projectId: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to load project');
    }

    const data = await response.json();
    return data.project;
  }

  /**
   * Saves project to backend
   * @param project - Project to save
   */
  async saveProject(project: Project): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    });

    if (!response.ok) {
      throw new Error('Failed to save project');
    }
  }

  /**
   * Deletes a project
   * @param projectId - Project UUID
   */
  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Gets currently active project ID
   * @returns Active project ID or null
   */
  async getActiveProjectId(): Promise<string | null> {
    const response = await fetch(`${this.baseUrl}/api/projects/active`);

    if (!response.ok) {
      throw new Error('Failed to get active project');
    }

    const data = await response.json();
    return data.projectId;
  }

  /**
   * Resets Lyra session memory
   * @param sessionId - Session identifier
   * @param metadata - Optional new metadata to reinitialize with
   */
  async resetLyraSession(sessionId: string, metadata?: SessionMetadata): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/lyra/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, metadata }),
    });

    if (!response.ok) {
      throw new Error('Failed to reset Lyra session');
    }
  }

  /**
   * Updates musical context for a session
   * @param sessionId - Session identifier
   * @param musicContext - Musical context (key, BPM, chord progressions)
   */
  async updateMusicContext(sessionId: string, musicContext?: import('../types/song').MusicContext): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/lyra/music-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, musicContext }),
    });

    if (!response.ok) {
      throw new Error('Failed to update music context');
    }
  }

  /**
   * Updates session metadata (genre, mood, style reference)
   * @param sessionId - Session identifier
   * @param metadata - Session metadata
   */
  async updateSessionMetadata(sessionId: string, metadata: SessionMetadata): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/session/${sessionId}/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      throw new Error('Failed to update session metadata');
    }
  }
}

// =======================
// Example Usage
// =======================

/**
 * Example: Complete workflow from session start to suggestion approval
 */
export async function exampleWorkflow() {
  const client = new VerseApiClient();

  // 1. Check backend is running
  const isRunning = await client.isBackendRunning();
  if (!isRunning) {
    console.error('Backend is not running!');
    return;
  }

  // 2. Start a session
  const sessionId = await client.startSession({
    genre: 'Pop',
    mood: 'Upbeat',
    referenceText: 'Think early Taylor Swift',
  });
  console.log('Session started:', sessionId);

  // 3. Add some sections
  const verse1 = await client.addSection(sessionId, 'verse', 'Verse 1');
  console.log('Added section:', verse1);

  const chorus = await client.addSection(sessionId, 'chorus', 'Chorus');
  console.log('Added section:', chorus);

  // 4. Update section with content
  await client.updateSection(sessionId, verse1.id, {
    content: 'Walking down the street\nFeeling incomplete\nWaiting for someone new',
  });

  // 5. Send message to Lyra
  const lyraResponse = await client.sendLyraMessage(
    sessionId,
    'Rewrite Verse 1 with more energy and optimism'
  );
  console.log('Lyra responded:', lyraResponse.message.content);

  // 6. If there's a suggestion, apply it
  if (lyraResponse.suggestion) {
    console.log('Suggestion received for:', lyraResponse.suggestion.targetSectionId);
    console.log('Suggested lyrics:', lyraResponse.suggestion.suggestedContent);
    
    // User decides to apply
    const updatedSection = await client.applySuggestion(
      sessionId,
      lyraResponse.suggestion.id
    );
    console.log('Suggestion applied! New lyrics:', updatedSection.lyrics);
  }

  // 7. End session (memory wiped)
  await client.endSession(sessionId);
  console.log('Session ended');
}

// Singleton instance
export const apiClient = new VerseApiClient();
