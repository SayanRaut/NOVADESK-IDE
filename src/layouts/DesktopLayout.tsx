import { useEffect } from 'react';
import { TitleBar } from '../components/TitleBar';
import { ActivityBar } from '../components/ActivityBar';
import { Sidebar } from '../components/Sidebar';
import { EditorArea } from '../components/EditorArea';
import { AISidebar } from '../components/AISidebar';
import { BottomPanel } from '../components/BottomPanel';
import { StatusBar } from '../components/StatusBar';
import { ToastContainer } from '../components/Notification/ToastContainer';
import { useEditor } from '../contexts/EditorContext';
import { useLayout } from '../contexts/LayoutContext';
import { usePanel } from '../contexts/PanelContext';

export function DesktopLayout() {
  const { saveActiveFile, saveAllFiles, editorGroups, activeGroupId, closeFile } = useEditor();
  const { isBottomPanelOpen, setBottomPanelOpen } = useLayout();
  const { setActiveTab } = usePanel();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          if (e.shiftKey) saveAllFiles();
          else saveActiveFile();
        } else if (e.key === 'w') {
          e.preventDefault();
          const activeGroup = editorGroups.find(g => g.id === activeGroupId);
          if (activeGroup?.activeFile) {
            closeFile(activeGroup.activeFile, activeGroupId);
          }
        } else if (e.key === '`') {
          e.preventDefault();
          if (isBottomPanelOpen) {
            setBottomPanelOpen(false);
          } else {
            setBottomPanelOpen(true);
            setActiveTab('terminal');
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveActiveFile, saveAllFiles, editorGroups, activeGroupId, closeFile, isBottomPanelOpen, setBottomPanelOpen, setActiveTab]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 text-slate-200">
      <TitleBar />
      
      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        <Sidebar />
        
        {/* Center content (Editor + Bottom Panel) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <EditorArea />
          <BottomPanel />
        </div>
        
        <AISidebar />
      </div>

      <StatusBar />
      <ToastContainer />
    </div>
  );
}
