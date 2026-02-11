/**
 * ProjectStorage Service
 * Handles local file system operations for project persistence
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectListItem, ProjectNotFoundError, SessionMetadata } from '../types';

const PROJECTS_DIR = process.env.VERSE_PROJECTS_DIR || path.join(__dirname, '../../projects');

/**
 * In-memory tracking of the currently active project
 */
let activeProjectId: string | null = null;

/**
 * Ensure the projects directory exists
 */
export async function ensureProjectsDirectory(): Promise<void> {
  try {
    await fs.access(PROJECTS_DIR);
  } catch {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
    console.log(`[ProjectStorage] Created projects directory: ${PROJECTS_DIR}`);
  }
}

/**
 * Create a new project
 * @param title - Project title
 * @param metadata - Optional session metadata
 * @returns New project object
 */
export async function createProject(
  title: string,
  metadata?: SessionMetadata
): Promise<Project> {
  await ensureProjectsDirectory();

  const now = new Date().toISOString();
  const project: Project = {
    id: uuidv4(),
    title,
    createdAt: now,
    updatedAt: now,
    timeline: {
      sections: [],
    },
    scratchpad: '',
    metadata: {
      genre: metadata?.genre,
      mood: metadata?.mood,
      referenceText: metadata?.styleReference,
    },
    uiState: {},
  };

  await saveProject(project);
  console.log(`[ProjectStorage] Created project: ${project.id} - "${title}"`);
  
  return project;
}

/**
 * Save project to disk
 * @param project - Project to save
 */
export async function saveProject(project: Project): Promise<void> {
  await ensureProjectsDirectory();

  // Update timestamp
  project.updatedAt = new Date().toISOString();

  const filePath = path.join(PROJECTS_DIR, `${project.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
  
  console.log(`[ProjectStorage] Saved project: ${project.id}`);
}

/**
 * Load project from disk
 * @param projectId - Project UUID
 * @returns Project object
 * @throws ProjectNotFoundError if project doesn't exist
 */
export async function loadProject(projectId: string): Promise<Project> {
  await ensureProjectsDirectory();

  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
  
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const project: Project = JSON.parse(data);
    console.log(`[ProjectStorage] Loaded project: ${projectId}`);
    return project;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new ProjectNotFoundError(projectId);
    }
    throw error;
  }
}

/**
 * List all projects
 * @returns Array of project metadata (sorted by updatedAt desc)
 */
export async function listProjects(): Promise<ProjectListItem[]> {
  await ensureProjectsDirectory();

  const files = await fs.readdir(PROJECTS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const projects: ProjectListItem[] = [];

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(PROJECTS_DIR, file);
      const data = await fs.readFile(filePath, 'utf-8');
      const project: Project = JSON.parse(data);
      
      projects.push({
        id: project.id,
        title: project.title,
        updatedAt: project.updatedAt,
        createdAt: project.createdAt,
      });
    } catch (error) {
      console.error(`[ProjectStorage] Failed to read project file ${file}:`, error);
      // Skip corrupted files
    }
  }

  // Sort by updatedAt descending (most recent first)
  projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  console.log(`[ProjectStorage] Listed ${projects.length} projects`);
  return projects;
}

/**
 * Delete project from disk
 * @param projectId - Project UUID
 * @throws ProjectNotFoundError if project doesn't exist
 */
export async function deleteProject(projectId: string): Promise<void> {
  await ensureProjectsDirectory();

  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
  
  try {
    await fs.unlink(filePath);
    console.log(`[ProjectStorage] Deleted project: ${projectId}`);
    
    // Clear active project if it was the deleted one
    if (activeProjectId === projectId) {
      activeProjectId = null;
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new ProjectNotFoundError(projectId);
    }
    throw error;
  }
}

/**
 * Get currently active project ID
 * @returns Active project ID or null
 */
export function getActiveProjectId(): string | null {
  return activeProjectId;
}

/**
 * Set currently active project
 * @param projectId - Project UUID or null to clear
 */
export function setActiveProjectId(projectId: string | null): void {
  activeProjectId = projectId;
  console.log(`[ProjectStorage] Active project set to: ${projectId || 'none'}`);
}
