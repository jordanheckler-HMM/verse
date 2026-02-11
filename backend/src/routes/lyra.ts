/**
 * Lyra Routes
 * 
 * Handles AI collaborator messaging
 */

import { Router, Request, Response } from 'express';
import { lyraEngine } from '../modules/LyraEngine';
import { sessionManager } from '../modules/SessionManager';
import { SendLyraMessageRequest } from '../types';

export const lyraRouter = Router();

/**
 * POST /api/lyra/message
 * Sends a message to Lyra
 * Returns proposal only - never auto-applies
 */
lyraRouter.post('/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body as SendLyraMessageRequest;
    
    if (!sessionId || !message) {
      res.status(400).json({ 
        error: 'Missing required fields: sessionId, message' 
      });
      return;
    }
    
    // Send message to Lyra
    const response = await lyraEngine.sendMessage(sessionId, message);
    
    res.json(response);
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    if (error.name === 'OllamaConnectionError') {
      res.status(503).json({ 
        error: error.message,
        hint: 'Make sure Ollama is running with the lyra-general model' 
      });
      return;
    }
    
    console.error('[LyraRouter] Error processing message:', error);
    res.status(500).json({ 
      error: 'Failed to process message' 
    });
  }
});

/**
 * GET /api/lyra/health
 * Checks Ollama connection status
 */
lyraRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const isConnected = await lyraEngine.testConnection();
    
    if (!isConnected) {
      res.status(503).json({ 
        status: 'offline',
        message: 'Cannot connect to Ollama',
        hint: 'Start Ollama with: ollama serve'
      });
      return;
    }
    
    res.json({ 
      status: 'ready',
      message: 'Lyra is ready',
      model: 'lyra-general',
      streaming: false
    });
  } catch (error) {
    console.error('[LyraRouter] Error checking health:', error);
    res.status(500).json({ 
      error: 'Failed to check Lyra health' 
    });
  }
});

/**
 * POST /api/lyra/reset
 * Flushes Lyra session memory and optionally reinitializes with new project context
 * Used when switching projects to isolate AI memory
 */
lyraRouter.post('/reset', async (req: Request, res: Response) => {
  try {
    const { sessionId, metadata } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Missing required field: sessionId' });
      return;
    }
    
    if (metadata) {
      // Reinitialize with new project context
      sessionManager.reinitializeSession(sessionId, metadata);
    } else {
      // Just flush conversation history
      sessionManager.flushSession(sessionId);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[LyraRouter] Error resetting session:', error);
    res.status(500).json({ error: 'Failed to reset session' });
  }
});

/**
 * POST /api/lyra/music-context
 * Updates the musical context for a session
 * This allows Lyra to provide context-aware suggestions
 */
lyraRouter.post('/music-context', async (req: Request, res: Response) => {
  try {
    const { sessionId, musicContext } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Missing required field: sessionId' });
      return;
    }
    
    sessionManager.updateMusicContext(sessionId, musicContext);
    
    res.json({ success: true });
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[LyraRouter] Error updating music context:', error);
    res.status(500).json({ error: 'Failed to update music context' });
  }
});

/**
 * POST /debug/lyra-confirm
 * Debug route to verify model identity
 * Sends a specific prompt to confirm we're using the correct model
 */
lyraRouter.post('/debug/confirm', async (_req: Request, res: Response) => {
  try {
    console.log('[LyraRouter] Debug confirmation requested');
    const response = await lyraEngine.verifyModelIdentity();
    
    res.json({
      success: true,
      modelResponse: response,
      expectedResponse: 'LYRA_MODEL_CONFIRMATION_92741',
      isMatch: response.trim() === 'LYRA_MODEL_CONFIRMATION_92741'
    });
  } catch (error: any) {
    console.error('[LyraRouter] Error in debug confirmation:', error);
    
    if (error.name === 'OllamaConnectionError') {
      res.status(503).json({ 
        error: error.message 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to verify model identity',
      details: error.message
    });
  }
});

