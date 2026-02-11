/**
 * Lyra Engine Module
 * 
 * AI collaborator powered by local Ollama.
 * Never auto-edits - only proposes changes.
 */

import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  LyraMessage,
  LyraResponse,
  LyraSuggestion,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaConnectionError,
  SessionData,
} from '../types';
import { sessionManager } from './SessionManager';
import { OLLAMA_CONFIG, getOllamaUrl } from '../config/ollama';

/**
 * LyraEngine - AI collaborator integration
 * 
 * Responsibilities:
 * - Communicate with local Ollama API
 * - Construct context-aware prompts
 * - Parse responses for suggestions
 * - Maintain conversation history
 * - NEVER auto-apply changes
 */
export class LyraEngine {
  
  /**
   * Sends a message to Lyra and gets response
   * @param sessionId - Session identifier
   * @param userMessage - User's message/request
   * @returns Lyra response with optional suggestion
   */
  async sendMessage(sessionId: string, userMessage: string): Promise<LyraResponse> {
    const session = sessionManager.getSessionOrThrow(sessionId);
    
    this.appendUserMessage(session, userMessage);
    
    // Construct prompt with full context
    const prompt = this.constructPrompt(session);
    
    // Call Ollama
    const response = await this.callOllama(prompt);
    
    // Parse response
    const parsed = this.parseResponse(response);

    return this.appendLyraResponse(sessionId, session, parsed);
  }

  /**
   * Sends a message to Lyra and streams response chunks
   * @param sessionId - Session identifier
   * @param userMessage - User's message/request
   * @param onChunk - Callback for streamed chunks
   * @returns Final Lyra response after stream completes
   */
  async sendMessageStream(
    sessionId: string,
    userMessage: string,
    onChunk: (chunk: string) => void,
    options?: { signal?: AbortSignal }
  ): Promise<LyraResponse> {
    const session = sessionManager.getSessionOrThrow(sessionId);

    this.appendUserMessage(session, userMessage);

    const prompt = this.constructPrompt(session);
    const response = await this.callOllamaStream(prompt, onChunk, options);
    const parsed = this.parseResponse(response);

    return this.appendLyraResponse(sessionId, session, parsed);
  }

  /**
   * Constructs a context-aware prompt for Ollama
   * @param session - Current session data
   * @returns Complete prompt string
   */
  constructPrompt(session: SessionData): string {
    const { metadata, sections, conversationHistory, musicContext } = session;
    
    // System prompt defining Lyra's identity and rules
    const systemPrompt = `You are Lyra, an AI songwriting collaborator. You help songwriters brainstorm ideas and refine their lyrics with creativity and respect.

CRITICAL RULES:
1. NEVER directly edit or rewrite lyrics - only provide suggestions and ideas
2. Help brainstorm concepts, themes, rhyme schemes, and lyrical approaches
3. Be aware of section types and instances (e.g., "Chorus 1" vs "Chorus 2")
4. Be creative but respectful of the writer's voice
5. Keep responses concise and actionable
6. Use musical context (key, BPM, chords) to inform suggestions about syllable density and cadence
7. NEVER suggest or modify chord progressions unless explicitly asked
8. Format your responses with markdown for clarity:
   - Use **bold** for emphasis
   - Use bullet points (- or *) for lists
   - Use > for important notes or quotes
9. The user will manually edit their lyrics based on your suggestions

When providing lyrical ideas or alternatives, simply present them naturally in your response without special formatting tags.`;

    // Context about the song
    let contextSection = `
SONG CONTEXT:
Genre: ${metadata.genre}
Mood: ${metadata.mood}
${metadata.styleReference ? `Style Reference: ${metadata.styleReference}` : ''}`;

    // Add musical context if available
    if (musicContext) {
      const musicalInfo: string[] = [];
      if (musicContext.key) {
        musicalInfo.push(`Key: ${musicContext.key}`);
      }
      if (musicContext.bpm) {
        musicalInfo.push(`Tempo: ${musicContext.bpm} BPM`);
      }
      if (musicalInfo.length > 0) {
        contextSection += `\n\nMUSICAL CONTEXT:\n${musicalInfo.join('\n')}`;
      }
    }

    // Helper to find chord progression by ID
    const findProgression = (progressionId?: string) => {
      if (!progressionId || !musicContext?.chordProgressions) return null;
      return musicContext.chordProgressions.find(p => p.id === progressionId);
    };

    // Current timeline/sections with chord progressions
    const timelineSection = sections.length > 0 
      ? `
CURRENT TIMELINE (${sections.length} sections):
${sections.map((s, index) => {
  const progression = findProgression(s.chordProgressionId);
  return `${index + 1}. ${s.label} (${s.type})
${progression ? `Chords: ${progression.chords.join(' – ')}` : ''}
${s.content ? s.content : '(empty)'}
---`;
}).join('\n')}
`
      : '\nCURRENT TIMELINE: (no sections yet)\n';

    // Full conversation history for complete chat context
    const historySection = conversationHistory.length > 0
      ? `
CONVERSATION HISTORY (oldest to newest):
${conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Lyra'}: ${msg.content}`).join('\n')}
`
      : '';

    // Combine all parts
    const fullPrompt = `${systemPrompt}
${contextSection}
${timelineSection}
${historySection}

Lyra:`;

    return fullPrompt;
  }

  /**
   * Parses Ollama response to extract message
   * @param response - Raw response from Ollama
   * @returns Parsed message
   */
  parseResponse(
    response: string
  ): { message: string; suggestion?: LyraSuggestion } {
    // Simply return the response as-is without parsing for suggestions
    return {
      message: response.trim(),
    };
  }

  /**
   * Calls Ollama API to generate response
   * @param prompt - Complete prompt string
   * @returns Generated response text
   */
  async callOllama(prompt: string): Promise<string> {
    const url = getOllamaUrl('generate');
    
    const request: OllamaGenerateRequest = {
      model: OLLAMA_CONFIG.model,
      prompt,
      stream: OLLAMA_CONFIG.stream,
      options: OLLAMA_CONFIG.options,
    };
    
    try {
      const response = await axios.post<OllamaGenerateResponse>(
        url,
        request,
        {
          timeout: OLLAMA_CONFIG.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.data || !response.data.response) {
        throw new OllamaConnectionError('Empty response from Ollama');
      }
      
      return response.data.response;
      
    } catch (error) {
      this.handleAxiosError(error);
      throw error;
    }
  }

  /**
   * Calls Ollama API with streaming enabled and emits chunks as they arrive
   * @param prompt - Complete prompt string
   * @param onChunk - Callback for streamed text chunks
   * @returns Complete generated response text
   */
  async callOllamaStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: { signal?: AbortSignal }
  ): Promise<string> {
    const url = getOllamaUrl('generate');

    const request: OllamaGenerateRequest = {
      model: OLLAMA_CONFIG.model,
      prompt,
      stream: true,
      options: OLLAMA_CONFIG.options,
    };

    try {
      const response = await axios.post<NodeJS.ReadableStream>(
        url,
        request,
        {
          timeout: OLLAMA_CONFIG.timeout,
          responseType: 'stream',
          signal: options?.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return await new Promise<string>((resolve, reject) => {
        const stream = response.data;
        let fullResponse = '';
        let buffer = '';
        let settled = false;

        const finish = (callback: () => void) => {
          if (settled) return;
          settled = true;
          callback();
        };

        const processLine = (line: string): boolean => {
          const parsed = JSON.parse(line) as Partial<OllamaGenerateResponse> & { error?: string };

          if (parsed.error) {
            throw new OllamaConnectionError(`Ollama stream error: ${parsed.error}`);
          }

          if (typeof parsed.response === 'string' && parsed.response.length > 0) {
            fullResponse += parsed.response;
            onChunk(parsed.response);
          }

          return parsed.done === true;
        };

        stream.on('data', (chunk: Buffer | string) => {
          buffer += chunk.toString();

          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line) {
              try {
                const done = processLine(line);
                if (done) {
                  finish(() => resolve(fullResponse));
                  return;
                }
              } catch (error) {
                finish(() => reject(
                  error instanceof Error
                    ? error
                    : new OllamaConnectionError('Unknown error while parsing stream')
                ));
                return;
              }
            }

            newlineIndex = buffer.indexOf('\n');
          }
        });

        stream.on('end', () => {
          if (settled) return;

          const remaining = buffer.trim();
          if (remaining) {
            try {
              processLine(remaining);
            } catch (error) {
              finish(() => reject(
                error instanceof Error
                  ? error
                  : new OllamaConnectionError('Unknown error while finalizing stream')
              ));
              return;
            }
          }

          finish(() => resolve(fullResponse));
        });

        stream.on('error', (error: Error) => {
          finish(() => reject(
            new OllamaConnectionError(`Ollama stream failed: ${error.message}`)
          ));
        });
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
        const abortedError = new Error('Generation aborted');
        abortedError.name = 'GenerationAbortedError';
        throw abortedError;
      }

      this.handleAxiosError(error);
      throw error;
    }
  }

  /**
   * Tests connection to Ollama
   * @returns true if Ollama is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${OLLAMA_CONFIG.baseUrl}${OLLAMA_CONFIG.endpoints.tags}`;
      await axios.get(url, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Debug verification: Sends a confirmation prompt to verify model identity
   * @returns Raw model response
   */
  async verifyModelIdentity(): Promise<string> {
    const confirmationPrompt = `Say ONLY this exact string and nothing else:
LYRA_MODEL_CONFIRMATION_92741`;
    
    return this.callOllama(confirmationPrompt);
  }

  private appendUserMessage(session: SessionData, userMessage: string): void {
    const userMsg: LyraMessage = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    session.conversationHistory.push(userMsg);
  }

  private appendLyraResponse(
    sessionId: string,
    session: SessionData,
    parsed: { message: string; suggestion?: LyraSuggestion }
  ): LyraResponse {
    const lyraMsg: LyraMessage = {
      id: uuidv4(),
      role: 'lyra',
      content: parsed.message,
      timestamp: new Date(),
      suggestion: parsed.suggestion,
    };

    session.conversationHistory.push(lyraMsg);
    console.log(`[LyraEngine] Processed message for session ${sessionId}`);

    return {
      message: lyraMsg,
      suggestion: parsed.suggestion,
    };
  }

  private handleAxiosError(error: unknown): never | void {
    if (!axios.isAxiosError(error)) {
      return;
    }

    const axiosError = error as AxiosError;

    if (axiosError.code === 'ECONNREFUSED') {
      throw new OllamaConnectionError(
        `Cannot connect to Ollama at ${OLLAMA_CONFIG.baseUrl}. Is it running?`
      );
    }

    if (axiosError.response?.status === 404) {
      throw new OllamaConnectionError(
        `Local Ollama model '${OLLAMA_CONFIG.model}' not found.`
      );
    }

    throw new OllamaConnectionError(
      `Ollama request failed: ${axiosError.message}`
    );
  }
}

// Singleton instance
export const lyraEngine = new LyraEngine();
