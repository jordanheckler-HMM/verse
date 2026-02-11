/**
 * Timeline Routes
 * 
 * Handles section CRUD operations
 */

import { Router, Request, Response } from 'express';
import { timelineEngine } from '../modules/TimelineEngine';
import { 
  AddSectionRequest, 
  UpdateSectionRequest, 
  ReorderSectionsRequest 
} from '../types';

export const timelineRouter = Router();

/**
 * POST /api/timeline/section
 * Adds a new section
 */
timelineRouter.post('/section', (req: Request, res: Response) => {
  try {
    const { sessionId, type, label } = req.body as AddSectionRequest;
    
    if (!sessionId || !type || !label) {
      res.status(400).json({ 
        error: 'Missing required fields: sessionId, type, label' 
      });
      return;
    }
    
    const section = timelineEngine.addSection(sessionId, type, label);
    
    res.status(201).json(section);
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[TimelineRouter] Error adding section:', error);
    res.status(500).json({ 
      error: 'Failed to add section' 
    });
  }
});

/**
 * PUT /api/timeline/section/:sectionId
 * Updates a section
 */
timelineRouter.put('/section/:sectionId', (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { sessionId, content, label } = req.body as UpdateSectionRequest & { sessionId: string };
    
    if (!sessionId) {
      res.status(400).json({ 
        error: 'Missing required field: sessionId' 
      });
      return;
    }
    
    if (content === undefined && label === undefined) {
      res.status(400).json({ 
        error: 'Must provide at least one field to update: content or label' 
      });
      return;
    }
    
    const section = timelineEngine.updateSection(sessionId, sectionId, { content, label });
    
    res.json(section);
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError' || error.name === 'SectionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[TimelineRouter] Error updating section:', error);
    res.status(500).json({ 
      error: 'Failed to update section' 
    });
  }
});

/**
 * DELETE /api/timeline/section/:sectionId
 * Deletes a section
 */
timelineRouter.delete('/section/:sectionId', (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { sessionId } = req.query;
    
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ 
        error: 'Missing required query parameter: sessionId' 
      });
      return;
    }
    
    timelineEngine.deleteSection(sessionId, sectionId);
    
    res.json({ 
      message: 'Section deleted successfully' 
    });
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError' || error.name === 'SectionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[TimelineRouter] Error deleting section:', error);
    res.status(500).json({ 
      error: 'Failed to delete section' 
    });
  }
});

/**
 * POST /api/timeline/reorder
 * Reorders sections
 */
timelineRouter.post('/reorder', (req: Request, res: Response) => {
  try {
    const { sessionId, sectionIds } = req.body as ReorderSectionsRequest;
    
    if (!sessionId || !sectionIds || !Array.isArray(sectionIds)) {
      res.status(400).json({ 
        error: 'Missing or invalid required fields: sessionId, sectionIds (array)' 
      });
      return;
    }
    
    const sections = timelineEngine.reorderSections(sessionId, sectionIds);
    
    res.json(sections);
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError' || error.name === 'SectionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[TimelineRouter] Error reordering sections:', error);
    res.status(500).json({ 
      error: 'Failed to reorder sections' 
    });
  }
});

/**
 * POST /api/timeline/section/:sectionId/duplicate
 * Duplicates a section
 */
timelineRouter.post('/section/:sectionId/duplicate', (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ 
        error: 'Missing required field: sessionId' 
      });
      return;
    }
    
    const section = timelineEngine.duplicateSection(sessionId, sectionId);
    
    res.status(201).json(section);
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError' || error.name === 'SectionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[TimelineRouter] Error duplicating section:', error);
    res.status(500).json({ 
      error: 'Failed to duplicate section' 
    });
  }
});

/**
 * GET /api/timeline/sections
 * Gets all sections for a session
 */
timelineRouter.get('/sections', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ 
        error: 'Missing required query parameter: sessionId' 
      });
      return;
    }
    
    const sections = timelineEngine.getSections(sessionId);
    
    res.json(sections);
  } catch (error: any) {
    if (error.name === 'SessionNotFoundError') {
      res.status(404).json({ error: error.message });
      return;
    }
    
    console.error('[TimelineRouter] Error getting sections:', error);
    res.status(500).json({ 
      error: 'Failed to get sections' 
    });
  }
});

