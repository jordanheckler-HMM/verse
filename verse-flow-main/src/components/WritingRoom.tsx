import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Music2, FileOutput, FolderOpen, Check, Pencil, PanelRight, PanelRightOpen } from 'lucide-react';
import { Section, Project, LyraMessage, MusicContext } from '@/types/song';
import { Timeline } from '@/components/Timeline';
import { LyraPanel } from '@/components/LyraPanel';
import { ExportModal } from '@/components/ExportModal';
import { Scratchpad } from '@/components/Scratchpad';
import { SongContextBar } from '@/components/SongContextBar';
import { ChordProgressionManager } from '@/components/ChordProgressionManager';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from '@/hooks/useDebounce';

interface WritingRoomProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  onSwitchProject: () => void;
}

export function WritingRoom({ project, onProjectUpdate, onSwitchProject }: WritingRoomProps) {
  const [sections, setSections] = useState<Section[]>(project.timeline.sections);
  const [messages, setMessages] = useState<LyraMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [scratchpadContent, setScratchpadContent] = useState(project.scratchpad);
  const [projectTitle, setProjectTitle] = useState(project.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [musicContext, setMusicContext] = useState<MusicContext | undefined>(project.musicContext);
  const [showChordManager, setShowChordManager] = useState(false);
  const [isLyraCollapsed, setIsLyraCollapsed] = useState(false);
  const [metadata, setMetadata] = useState({
    genre: project.metadata.genre,
    mood: project.metadata.mood,
    referenceText: project.metadata.referenceText,
  });
  const titleInputRef = useRef<HTMLInputElement>(null);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

  // Save project helper
  const saveProject = async () => {
    try {
      setIsSaving(true);
      const updatedProject: Project = {
        ...project,
        title: projectTitle,
        timeline: { sections },
        scratchpad: scratchpadContent,
        musicContext,
        metadata: {
          genre: metadata.genre,
          mood: metadata.mood,
          referenceText: metadata.referenceText,
        },
        updatedAt: new Date().toISOString(),
      };
      
      await apiClient.saveProject(updatedProject);
      onProjectUpdate(updatedProject);
      setLastSavedAt(new Date());
      console.log('[WritingRoom] Project saved');
    } catch (error) {
      console.error('[WritingRoom] Failed to save project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save (2 seconds)
  const debouncedSave = useDebounce(saveProject, 2000);

  // Auto-save when sections, scratchpad, music context, or metadata changes
  useEffect(() => {
    if (backendSessionId) {
      debouncedSave();
    }
  }, [sections, scratchpadContent, projectTitle, musicContext, metadata]);

  // Update backend session music context when it changes
  useEffect(() => {
    if (backendSessionId) {
      apiClient.updateMusicContext(backendSessionId, musicContext).catch(error => {
        console.error('[WritingRoom] Failed to update music context:', error);
      });
    }
  }, [backendSessionId, musicContext]);

  // Sync sections to backend session whenever they change
  useEffect(() => {
    if (backendSessionId && sections.length >= 0) {
      apiClient.syncSections(backendSessionId, sections).catch(error => {
        console.error('[WritingRoom] Failed to sync sections:', error);
      });
    }
  }, [backendSessionId, sections]);

  // Update backend session metadata when it changes
  useEffect(() => {
    if (backendSessionId) {
      apiClient.updateSessionMetadata(backendSessionId, {
        genre: metadata.genre || '',
        mood: metadata.mood || '',
        styleReference: metadata.referenceText,
      }).catch(error => {
        console.error('[WritingRoom] Failed to update session metadata:', error);
      });
    }
  }, [backendSessionId, metadata]);

  // Initialize backend session on mount
  useEffect(() => {
    const initBackendSession = async () => {
      try {
        const sessionMetadata = {
          genre: project.metadata.genre || '',
          mood: project.metadata.mood || '',
          styleReference: project.metadata.referenceText,
        };

        const sessionId = await apiClient.startSession({
          ...sessionMetadata,
        });
        setBackendSessionId(sessionId);
        
        // Reset Lyra memory for this project
        await apiClient.resetLyraSession(sessionId, sessionMetadata);
        
        console.log('[WritingRoom] Backend session started and reset for project:', project.id);
      } catch (error) {
        console.error('[WritingRoom] Failed to start backend session:', error);
      }
    };
    
    initBackendSession();
    
    // Cleanup: End backend session on unmount
    return () => {
      if (backendSessionId) {
        apiClient.endSession(backendSessionId).catch(console.error);
      }
    };
  }, [project.id]);

  const syncLyraContext = async (sessionId: string) => {
    await Promise.all([
      apiClient.syncSections(sessionId, sections),
      apiClient.updateMusicContext(sessionId, musicContext),
      apiClient.updateSessionMetadata(sessionId, {
        genre: metadata.genre || '',
        mood: metadata.mood || '',
        styleReference: metadata.referenceText,
      }),
    ]);
  };

  const sendMessageToLyra = async (
    userContent: string,
    backendPrompt: string,
    fallbackError: string
  ) => {
    if (!backendSessionId) {
      console.error('[WritingRoom] No backend session ID');
      return;
    }

    if (streamAbortControllerRef.current) {
      console.warn('[WritingRoom] Lyra generation already in progress');
      return;
    }

    const streamAbortController = new AbortController();
    streamAbortControllerRef.current = streamAbortController;

    const userMessage: LyraMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };

    const streamingMessageId = `lyra-stream-${Date.now()}`;
    const streamingMessage: LyraMessage = {
      id: streamingMessageId,
      role: 'lyra',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, streamingMessage]);
    setIsThinking(true);

    try {
      await syncLyraContext(backendSessionId);

      const response = await apiClient.sendLyraMessageStream(
        backendSessionId,
        backendPrompt,
        (chunk) => {
          setMessages((prev) => {
            const index = prev.findIndex((msg) => msg.id === streamingMessageId);
            if (index === -1) {
              return [...prev, { ...streamingMessage, content: chunk }];
            }

            const next = [...prev];
            next[index] = {
              ...next[index],
              content: `${next[index].content}${chunk}`,
            };
            return next;
          });
        },
        { signal: streamAbortController.signal }
      );

      setMessages((prev) => {
        const index = prev.findIndex((msg) => msg.id === streamingMessageId);
        if (index === -1) {
          return [...prev, response.message];
        }

        const next = [...prev];
        next[index] = response.message;
        return next;
      });

      console.log('[WritingRoom] Lyra streamed response received');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessages((prev) => {
          const index = prev.findIndex((msg) => msg.id === streamingMessageId);
          if (index === -1) {
            return prev;
          }

          if (!prev[index].content.trim()) {
            return prev.filter((msg) => msg.id !== streamingMessageId);
          }

          return prev;
        });

        console.log('[WritingRoom] Lyra generation stopped');
        return;
      }

      console.error('[WritingRoom] Failed to send message to Lyra:', error);

      const errorMessage: LyraMessage = {
        id: `lyra-error-${Date.now()}`,
        role: 'lyra',
        content: fallbackError,
        timestamp: new Date(),
      };

      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== streamingMessageId),
        errorMessage,
      ]);
    } finally {
      if (streamAbortControllerRef.current === streamAbortController) {
        streamAbortControllerRef.current = null;
      }
      setIsThinking(false);
    }
  };

  const handleAskLyra = async (sectionId: string, content: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      console.error('[WritingRoom] Cannot ask Lyra: missing section');
      return;
    }

    await sendMessageToLyra(
      `Help me with ${section.label}:\n\n"${content || '(empty)'}"`,
      `Please help me improve this ${section.label}. Current lyrics:\n\n${content || '(empty)'}\n\nSuggest an improved version using the [SUGGESTION for ${section.label}] format.`,
      'Sorry, I encountered an error talking to Lyra. Make sure the backend is running on port 3001 and Ollama is active.'
    );
  };

  const handleSendMessage = async (content: string) => {
    await sendMessageToLyra(
      content,
      content,
      'Sorry, I encountered an error talking to Lyra. Make sure the backend is running on port 3001 and Ollama is active.'
    );
  };

  const handleClearLyraHistory = async () => {
    if (!backendSessionId) {
      console.error('[WritingRoom] Cannot clear Lyra history: no backend session ID');
      return;
    }

    try {
      await apiClient.resetLyraSession(backendSessionId, {
        genre: metadata.genre || '',
        mood: metadata.mood || '',
        styleReference: metadata.referenceText,
      });
      setMessages([]);
      console.log('[WritingRoom] Cleared Lyra chat history');
    } catch (error) {
      console.error('[WritingRoom] Failed to clear Lyra chat history:', error);
    }
  };

  const handleStopLyraGeneration = () => {
    if (!streamAbortControllerRef.current) {
      return;
    }

    streamAbortControllerRef.current.abort();
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (projectTitle.trim()) {
      // Title will be saved by auto-save
    } else {
      setProjectTitle(project.title);
    }
  };

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const mainWorkspace = (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SongContextBar
        musicContext={musicContext}
        onUpdate={setMusicContext}
        onManageProgressions={() => setShowChordManager(true)}
        metadata={metadata}
        onMetadataUpdate={setMetadata}
      />

      <Timeline
        sections={sections}
        onSectionsChange={setSections}
        onAskLyra={handleAskLyra}
        chordProgressions={musicContext?.chordProgressions || []}
      />
      <Scratchpad
        content={scratchpadContent}
        onContentChange={setScratchpadContent}
      />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-12 border-b border-border/50 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onSwitchProject} title="Switch Project">
            <FolderOpen className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center border border-accent/20">
              <Music2 className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleBlur();
                    if (e.key === 'Escape') {
                      setProjectTitle(project.title);
                      setEditingTitle(false);
                    }
                  }}
                  className="text-sm font-medium bg-transparent border-b border-accent/50 focus:outline-none w-44"
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="flex items-center gap-1 text-sm font-medium hover:text-accent transition-colors group"
                >
                  <span>{projectTitle}</span>
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                </button>
              )}
              <p className="text-[11px] text-muted-foreground">
                {project.metadata.genre && `${project.metadata.genre}`}
                {project.metadata.genre && project.metadata.mood && ' · '}
                {project.metadata.mood && project.metadata.mood}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLyraCollapsed((value) => !value)}
            title={isLyraCollapsed ? 'Show Lyra panel' : 'Collapse Lyra panel'}
          >
            {isLyraCollapsed ? (
              <PanelRightOpen className="w-3.5 h-3.5" />
            ) : (
              <PanelRight className="w-3.5 h-3.5" />
            )}
          </Button>
          {/* Save indicator */}
          {isSaving ? (
            <span className="text-[11px] text-muted-foreground">Saving...</span>
          ) : lastSavedAt ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              <Check className="w-3 h-3" />
              Saved
            </motion.span>
          ) : null}

          <Button variant="section" size="sm" onClick={() => setShowExport(true)}>
            <FileOutput className="w-4 h-4" />
            Export
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {isLyraCollapsed ? (
          <div className="h-full flex overflow-hidden">
            {mainWorkspace}
            <div className="w-8 border-l border-border/60 bg-card/30 flex items-start justify-center pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLyraCollapsed(false)}
                title="Expand Lyra panel"
                className="h-6 w-6"
              >
                <PanelRightOpen className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={74} minSize={56}>
              {mainWorkspace}
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border/70" />
            <ResizablePanel defaultSize={26} minSize={18}>
              <LyraPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                sections={sections}
                isThinking={isThinking}
                onClearHistory={handleClearLyraHistory}
                onStopGeneration={handleStopLyraGeneration}
                onCollapse={() => setIsLyraCollapsed(true)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        sections={sections}
        sessionName={projectTitle}
        onExportAndEnd={onSwitchProject}
      />

      {/* Chord Progression Manager */}
      <ChordProgressionManager
        isOpen={showChordManager}
        onClose={() => setShowChordManager(false)}
        musicContext={musicContext}
        onUpdate={setMusicContext}
      />
    </div>
  );
}
