import { useEffect } from 'react';
import { TitleBar } from '../components/TitleBar';
import { MenuBar } from '../components/MenuBar';
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
import { useTheme } from '../contexts/ThemeContext';

export function DesktopLayout() {
  const { saveActiveFile, saveAllFiles, editorGroups, activeGroupId, closeFile } = useEditor();
  const { isBottomPanelOpen, setBottomPanelOpen } = useLayout();
  const { setActiveTab } = usePanel();
  const { customBackground } = useTheme();

  const CustomBgLayer = customBackground ? (
    <div 
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden" 
      style={{ backgroundColor: 'var(--panel-bg)' }}
    >
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.02]"
        style={{
          backgroundImage: 'var(--custom-bg-image)',
          filter: 'blur(var(--custom-bg-blur))',
          opacity: 'var(--editor-bg-opacity)',
        }}
      />
    </div>
  ) : null;

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
    <div className="relative flex flex-col h-screen w-screen overflow-hidden text-slate-200 bg-black">
      {/* Mesh Animated Background for Glassmorphism */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-slate-900">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/40 mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-900/40 mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full bg-indigo-900/30 mix-blend-screen filter blur-[90px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        <TitleBar />
        <MenuBar />
        <ActivityBar />
        
        {/* Main Body */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          
          {/* Center content (Editor + Bottom Panel) */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {CustomBgLayer}
            <div className="flex-1 flex flex-col z-10 overflow-hidden">
              <EditorArea />
              <BottomPanel />
            </div>
          </div>
          
          <AISidebar />
        </div>

        <StatusBar />
        <ToastContainer />
      </div>
    </div>
  );
}
