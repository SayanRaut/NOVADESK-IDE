import { useState, useEffect } from 'react';
import { Server, Save, CheckCircle2, AlertCircle, Palette, ImagePlus, X, Sliders, Type } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';


export function SettingsPanel() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { theme, setTheme, customBackground, setCustomBackground, backgroundBlur, setBackgroundBlur, editorOpacity, setEditorOpacity, fontSize, setFontSize } = useTheme();

  useEffect(() => {
    setUrl(getApiBaseUrl());
  }, []);

  const handleSave = async () => {
    try {
      // Validate URL
      new URL(url);
    } catch {
      setStatus('error');
      setMessage('Invalid URL format');
      return;
    }

    await setApiBaseUrl(url);
    setStatus('success');
    setMessage('URL saved successfully');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 3000);
  };

  const handleTest = async () => {
    setStatus('testing');
    setMessage('Testing connection...');
    
    // Temporarily set the axios base URL for this test, or just use fetch
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        setStatus('success');
        setMessage('Connection successful!');
      } else {
        setStatus('error');
        setMessage(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || 'Failed to connect');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down if larger than 1920x1080
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCustomBackground(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6 text-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-400" />
          Server Settings
        </h2>
        <p className="text-slate-400 text-xs">
          Configure the Remote Backend URL for NovaDesk. This allows you to connect to a remote instance via Cloudflare Tunnels, ngrok, or a VPS.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-slate-300 font-medium">Backend API URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setStatus('idle');
            setMessage('');
          }}
          placeholder="https://novadesk-ide.onrender.com"
          className="glass-panel border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 w-full font-mono text-xs"
        />
        
        {message && (
          <div className={`flex items-center gap-2 text-xs p-2 rounded glass-panel/50 border ${
            status === 'error' ? 'border-red-500/30 text-red-400' :
            status === 'success' ? 'border-green-500/30 text-green-400' :
            'border-blue-500/30 text-blue-400'
          }`}>
            {status === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
            {status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {status === 'testing' && <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />}
            {message}
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={url === getApiBaseUrl() && status !== 'error'}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save URL
          </button>
          
          <button
            onClick={handleTest}
            disabled={status === 'testing'}
            className="flex-1 glass-panel hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Server className="w-4 h-4" />
            Test Connection
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          Appearance
        </h2>
        <p className="text-slate-400 text-xs">
          Customize the look and feel of the IDE.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-slate-300 font-medium">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className="glass-panel border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 w-full text-xs"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="abyss">Abyss</option>
          <option value="tomorrow-night-blue">Tomorrow Night Blue</option>
          <option value="hc-black">High Contrast Dark</option>
          <option value="hc-light">High Contrast Light</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Type className="w-5 h-5 text-indigo-400" />
          Editor & Terminal Font Size
        </h2>
      </div>

      <div className="flex flex-col gap-4 glass-panel p-4 rounded border border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-300 font-medium">Font Size</label>
            <span className="text-slate-400">{fontSize}px</span>
          </div>
          <input 
            type="range" 
            min="10" max="32" step="1"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <ImagePlus className="w-5 h-5 text-green-400" />
          Editor Background
        </h2>
        <p className="text-slate-400 text-xs">
          Upload a custom background image for your editor and adjust its visibility.
        </p>
      </div>

      <div className="flex flex-col gap-4 glass-panel p-4 rounded border border-slate-800">
        <div className="flex flex-col gap-2">
          <label className="text-slate-300 font-medium text-xs">Background Image</label>
          <div className="flex items-center gap-2">
            <label className="flex-1 glass-panel hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs">
              <ImagePlus className="w-4 h-4" />
              <span>{customBackground ? 'Change Image' : 'Upload Image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
            {customBackground && (
              <button 
                onClick={() => setCustomBackground(null)}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors text-xs"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
        </div>

        {customBackground && (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-300 font-medium flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Background Blur
                </label>
                <span className="text-slate-400">{backgroundBlur}px</span>
              </div>
              <input 
                type="range" 
                min="0" max="20" step="1"
                value={backgroundBlur}
                onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-300 font-medium flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> Editor Opacity
                </label>
                <span className="text-slate-400">{Math.round(editorOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.05"
                value={editorOpacity}
                onChange={(e) => setEditorOpacity(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <p className="text-[10px] text-slate-500">
                Higher opacity makes the background image more visible inside the editor.
              </p>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
