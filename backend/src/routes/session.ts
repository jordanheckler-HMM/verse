/**
 * Session Routes
 * 
 * Handles session lifecycle: start, end, get
 */

import { Router, Request, Response } from 'express';
import { sessionManager } from '../modules/SessionManager';
import { suggestionPipeline } from '../modules/SuggestionPipeline';
import { StartSessionRequest, Section } from '../types';

export const sessionRouter = Router();

/**
 * POST /api/session/start
 * Creates a new session
 */
sessionRouter.post('/start', (req: Request, res: Response) => {
  try {
    const { metadata } = req.body as StartSessionRequest;
    
    if (!metadata) {
      res.status(400).json({ 
        error: 'Missing required field: metadata' 
      });
      return;
    }
    
    // Provide defaults for missing metadata
    const sessionMetadata = {
      genre: metadata.genre || 'Unknown',
      mood: metadata.mood || 'Unknown',
      styleReference: metadata.styleReference
    };
    
    const sessionId = sessionManager.createSession(sessionMetadata);
    
    res.status(201).json({ 
      sessionId,
      message: 'Session created successfully' 
    });
  } catch (error) {
    console.error('[SessionRouter] Error creating session:', error);
    res.status(500).json({ 
      error: 'Failed to create session' 
    });
  }
});

/**
 * POST /api/session/end
 * Ends a session and destroys all data
 */
sessionRouter.post('/end', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ 
        error: 'Missing required field: sessionId' 
      });
      return;
    }
    
    // Clean up suggestions
    suggestionPipeline.cleanupSession(sessionId);
    
    // End session
    const existed = sessionManager.endSession(sessionId);
    
    if (!existed) {
      res.status(404).json({ 
        error: 'Session not found' 
      });
      return;
    }
    
    res.json({ 
      message: 'Session ended successfully' 
    });
  } catch (error) {
    console.error('[SessionRouter] Error ending session:', error);
    res.status(500).json({ 
      error: 'Failed to end session' 
    });
  }
});

/**
 * GET /api/session/:sessionId
 * Gets session data
 */
sessionRouter.get('/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      res.status(404).json({ 
        error: 'Session not found' 
      });
      return;
    }
    
    res.json(session);
  } catch (error) {
    console.error('[SessionRouter] Error getting session:', error);
    res.status(500).json({ 
      error: 'Failed to get session' 
    });
  }
});

/**
 * PUT /api/session/:sessionId/metadata
 * Updates session metadata
 */
sessionRouter.put('/:sessionId/metadata', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { metadata } = req.body;
    
    if (!metadata) {
      res.status(400).json({ 
        error: 'Missing required field: metadata' 
      });
      return;
    }
    
    sessionManager.updateSessionMetadata(sessionId, metadata);
    
    res.json({ 
      message: 'Metadata updated successfully' 
    });
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[SessionRouter] Error updating metadata:', error);
    res.status(500).json({ 
      error: 'Failed to update metadata' 
    });
  }
});

/**
 * POST /api/session/sync-sections
 * Syncs all sections from frontend to backend session
 * This ensures Lyra has access to current section content
 */
sessionRouter.post('/sync-sections', (req: Request, res: Response) => {
  try {
    const { sessionId, sections } = req.body as { sessionId: string; sections: Section[] };
    
    if (!sessionId) {
      res.status(400).json({ 
        error: 'Missing required field: sessionId' 
      });
      return;
    }
    
    if (!sections || !Array.isArray(sections)) {
      res.status(400).json({ 
        error: 'Missing or invalid field: sections (must be array)' 
      });
      return;
    }
    
    const session = sessionManager.getSessionOrThrow(sessionId);
    
    // Replace all sections with the synced ones
    session.sections = sections;
    
    console.log(`[SessionRouter] Synced ${sections.length} sections to session ${sessionId}`);
    
    res.json({ 
      message: 'Sections synced successfully',
      count: sections.length
    });
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[SessionRouter] Error syncing sections:', error);
    res.status(500).json({ 
      error: 'Failed to sync sections' 
    });
  }
});

