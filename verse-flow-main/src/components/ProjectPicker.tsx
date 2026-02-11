import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Plus, Trash2, FolderOpen, Clock } from 'lucide-react';
import { ProjectListItem, SessionData } from '@/types/song';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ProjectPickerProps {
  onProjectSelect: (projectId: string) => void;
  onCreateNew: (sessionData: SessionData) => void;
}

export function ProjectPicker({ onProjectSelect, onCreateNew }: ProjectPickerProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  const loadProjects = useCallback(async (attempt = 0) => {
    try {
      if (attempt === 0) {
        setLoading(true);
      }

      const projectList = await apiClient.listProjects();
      setProjects(projectList);
      setLoading(false);
    } catch (error) {
      const maxAttempts = 20;

      if (attempt < maxAttempts - 1) {
        const delayMs = 500;
        retryTimeoutRef.current = window.setTimeout(() => {
          loadProjects(attempt + 1);
        }, delayMs);
        return;
      }

      console.error('[ProjectPicker] Failed to load projects:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();

    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [loadProjects]);

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;

    try {
      setLoading(true);
      const project = await apiClient.createProject(newProjectTitle.trim());
      setNewProjectTitle('');
      setCreating(false);
      
      // Open the new project
      onProjectSelect(project.id);
    } catch (error) {
      console.error('[ProjectPicker] Failed to create project:', error);
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setDeletingId(projectId);
      const maxAttempts = 3;
      let attempt = 0;

      while (attempt < maxAttempts) {
        try {
          await apiClient.deleteProject(projectId);
          break;
        } catch (error) {
          attempt += 1;
          if (attempt >= maxAttempts) {
            throw error;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 300 * attempt));
        }
      }

      setProjects((previousProjects) => previousProjects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error('[ProjectPicker] Failed to delete project:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2.5 mb-2.5"
          >
            <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center border border-accent/20">
              <Music2 className="w-4 h-4 text-accent/90" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Verse</h1>
          </motion.div>
          <p className="text-sm text-muted-foreground">Your local songwriting studio</p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass rounded-lg p-4 space-y-3"
        >
          {/* Create New Button */}
          {!creating ? (
            <Button
              onClick={() => setCreating(true)}
              size="default"
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              Create New Song
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="Song title..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') {
                    setCreating(false);
                    setNewProjectTitle('');
                  }
                }}
              />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateProject}
                    disabled={!newProjectTitle.trim() || loading}
                    className="flex-1"
                  >
                    Create
                  </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreating(false);
                    setNewProjectTitle('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Divider */}
          {projects.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or open existing</span>
              </div>
            </div>
          )}

          {/* Projects List */}
          {loading && projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <div className="animate-pulse">Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-9 h-9 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No projects yet</p>
              <p className="text-xs mt-1">Create your first song to get started</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => onProjectSelect(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onProjectSelect(project.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-md border border-border',
                      'hover:bg-secondary/50 transition-colors text-left cursor-pointer',
                      'focus:outline-none focus:ring-1 focus:ring-accent/20',
                      deletingId === project.id && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{project.title}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteProject(project.id, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground/60 mt-6"
        >
          All projects are saved locally on your device
        </motion.p>
      </motion.div>
    </div>
  );
}
