import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProjectPicker } from '@/components/ProjectPicker';
import { WritingRoom } from '@/components/WritingRoom';
import { Project, SessionData } from '@/types/song';
import { apiClient } from '@/lib/api-client';

const Index = () => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // Check for active project on mount
  useEffect(() => {
    let cancelled = false;

    const checkActiveProject = async () => {
      try {
        const maxAttempts = 8;
        let projectId: string | null = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            projectId = await apiClient.getActiveProjectId();
            break;
          } catch (error) {
            if (attempt === maxAttempts - 1) {
              throw error;
            }

            await new Promise((resolve) => window.setTimeout(resolve, 300 * (attempt + 1)));
          }
        }

        if (cancelled) {
          return;
        }

        if (projectId) {
          const project = await apiClient.loadProject(projectId);
          if (cancelled) {
            return;
          }
          setActiveProject(project);
        } else {
          setShowProjectPicker(true);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('[Index] Failed to load active project:', error);
        setShowProjectPicker(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkActiveProject();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProjectSelect = async (projectId: string) => {
    try {
      setLoading(true);
      const project = await apiClient.loadProject(projectId);
      setActiveProject(project);
      setShowProjectPicker(false);
    } catch (error) {
      console.error('[Index] Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = (sessionData: SessionData) => {
    // This is called from ProjectPicker but now handled through createProject
    // We don't use SessionStart anymore
  };

  const handleSwitchProject = () => {
    setShowProjectPicker(true);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setActiveProject(updatedProject);
  };

  if (loading && !showProjectPicker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showProjectPicker || !activeProject ? (
        <motion.div
          key="picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ProjectPicker
            onProjectSelect={handleProjectSelect}
            onCreateNew={handleCreateNew}
          />
        </motion.div>
      ) : (
        <motion.div
          key="writing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <WritingRoom
            project={activeProject}
            onProjectUpdate={handleProjectUpdate}
            onSwitchProject={handleSwitchProject}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
