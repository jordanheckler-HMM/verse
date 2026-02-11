/**
 * Project Management Routes
 * Handles CRUD operations for song projects
 */

import { Router, Request, Response } from 'express';
import * as ProjectStorage from '../services/ProjectStorage';
import { Project, ProjectNotFoundError } from '../types';

const router = Router();

/**
 * POST /api/projects/create
 * Create a new project
 */
router.post('/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, metadata } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required and must be a string' });
      return;
    }

    const project = await ProjectStorage.createProject(title, metadata);
    ProjectStorage.setActiveProjectId(project.id);

    res.status(201).json({ project });
  } catch (error: any) {
    console.error('[Projects API] Create failed:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

/**
 * GET /api/projects/list
 * List all projects
 */
router.get('/list', async (_req: Request, res: Response): Promise<void> => {
  try {
    const projects = await ProjectStorage.listProjects();
    res.json({ projects });
  } catch (error: any) {
    console.error('[Projects API] List failed:', error);
    res.status(500).json({ error: error.message || 'Failed to list projects' });
  }
});

/**
 * GET /api/projects/active
 * Get currently active project ID
 */
router.get('/active', async (_req: Request, res: Response): Promise<void> => {
  try {
    const activeProjectId = ProjectStorage.getActiveProjectId();
    
    if (!activeProjectId) {
      res.json({ projectId: null });
      return;
    }

    // Verify the project still exists
    try {
      await ProjectStorage.loadProject(activeProjectId);
      res.json({ projectId: activeProjectId });
    } catch (error) {
      // Project was deleted, clear active project
      ProjectStorage.setActiveProjectId(null);
      res.json({ projectId: null });
    }
  } catch (error: any) {
    console.error('[Projects API] Get active failed:', error);
    res.status(500).json({ error: error.message || 'Failed to get active project' });
  }
});

/**
 * GET /api/projects/:id
 * Load a specific project
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await ProjectStorage.loadProject(id);
    ProjectStorage.setActiveProjectId(id);
    
    res.json({ project });
  } catch (error: any) {
    if (error instanceof ProjectNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('[Projects API] Load failed:', error);
    res.status(500).json({ error: error.message || 'Failed to load project' });
  }
});

/**
 * PUT /api/projects/:id
 * Update/save a project
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const projectData: Project = req.body.project;

    if (!projectData || projectData.id !== id) {
      res.status(400).json({ error: 'Invalid project data' });
      return;
    }

    await ProjectStorage.saveProject(projectData);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Projects API] Save failed:', error);
    res.status(500).json({ error: error.message || 'Failed to save project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await ProjectStorage.deleteProject(id);
    
    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof ProjectNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('[Projects API] Delete failed:', error);
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
});

export default router;
