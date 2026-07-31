
import MonacoEditor from '@monaco-editor/react';

interface EditorProps {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
}

export const EditorComponent: React.FC<EditorProps> = ({ code, language, onChange }) => {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme="vs-dark"
      value={code}
      onChange={onChange}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        wordWrap: 'on',
        padding: { top: 16 },
      }}
    />
  );
};
