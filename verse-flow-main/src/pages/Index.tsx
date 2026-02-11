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
    const checkActiveProject = async () => {
      try {
        const projectId = await apiClient.getActiveProjectId();
        if (projectId) {
          const project = await apiClient.loadProject(projectId);
          setActiveProject(project);
        } else {
          setShowProjectPicker(true);
        }
      } catch (error) {
        console.error('[Index] Failed to load active project:', error);
        setShowProjectPicker(true);
      } finally {
        setLoading(false);
      }
    };

    checkActiveProject();
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
