import React from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useEditor } from '../contexts/EditorContext';
import { EditorTabs } from './editor/EditorTabs';
import { Breadcrumb } from './editor/Breadcrumb';
import { MonacoEditor } from './editor/MonacoEditor';
import { WelcomePage } from './editor/WelcomePage';
import { DebugToolbar } from './run-debug/DebugToolbar';
import { cn } from '../utils/cn';
import { useTheme } from '../contexts/ThemeContext';

function EditorGroupView({ groupId }: { groupId: string }) {
  const { editorGroups, setActiveGroup, activeGroupId } = useEditor();
  const { customBackground } = useTheme();
  const group = editorGroups.find(g => g.id === groupId);
  
  if (!group) return null;

  return (
    <div 
      className={cn(
        "h-full w-full flex flex-col overflow-hidden transition-opacity relative z-10",
        customBackground ? "bg-transparent" : "bg-slate-950 border-slate-800",
        activeGroupId === groupId ? "border-transparent opacity-100" : "opacity-70"
      )}
      onClickCapture={() => {
        if (activeGroupId !== groupId) setActiveGroup(groupId);
      }}
    >
      <EditorTabs groupId={groupId} />
      <Breadcrumb groupId={groupId} />
      {group.openFiles.length > 0 && group.activeFile ? (
        <MonacoEditor groupId={groupId} />
      ) : (
        <WelcomePage />
      )}
    </div>
  );
}

export function EditorArea() {
  const { editorGroups, splitState } = useEditor();
  const { customBackground } = useTheme();

  if (editorGroups.length === 0) return (
    <div className={cn("flex-1 relative overflow-hidden", customBackground ? "bg-transparent" : "bg-slate-950")} />
  );

  if (editorGroups.length === 1 || splitState === 'none') {
    return (
      <div className={cn("flex-1 flex flex-col overflow-hidden relative", customBackground ? "bg-transparent" : "bg-slate-950")}>
        <DebugToolbar />
        <EditorGroupView groupId={editorGroups[0].id} />
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex flex-col overflow-hidden relative", customBackground ? "bg-transparent" : "bg-slate-950")}>
      <DebugToolbar />
      <PanelGroup orientation={splitState === 'horizontal' ? 'horizontal' : 'vertical'}>
        {editorGroups.map((group, index) => (
          <React.Fragment key={group.id}>
            <Panel minSize={15}>
              <EditorGroupView groupId={group.id} />
            </Panel>
            {index < editorGroups.length - 1 && (
              <PanelResizeHandle className={cn(
                "hover:bg-blue-500 transition-colors bg-slate-900 z-10",
                splitState === 'horizontal' ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
              )} />
            )}
          </React.Fragment>
        ))}
      </PanelGroup>
    </div>
  );
}
