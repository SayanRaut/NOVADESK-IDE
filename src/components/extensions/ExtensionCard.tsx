import React, { useState } from 'react';
import { Settings, Check, Download, AlertCircle } from 'lucide-react';
import { type Extension, useExtensions } from '../../contexts/ExtensionContext';
import { cn } from '../../utils/cn';

interface ExtensionCardProps {
  extension: Extension;
}

export const ExtensionCard: React.FC<ExtensionCardProps> = ({ extension }) => {
  const { 
    isInstalled, isEnabled, 
    installExtension, uninstallExtension, 
    enableExtension, disableExtension 
  } = useExtensions();

  const installed = isInstalled(extension.id);
  const enabled = isEnabled(extension.id);
  
  const [loading, setLoading] = useState(false);

  const handleInstall = async () => {
    setLoading(true);
    try {
      await installExtension(extension.namespace, extension.name);
    } catch (e) {
      console.error('Failed to install', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async () => {
    setLoading(true);
    await uninstallExtension(extension.id);
    setLoading(false);
  };

  const handleToggleEnable = async () => {
    if (enabled) {
      await disableExtension(extension.id);
    } else {
      await enableExtension(extension.id);
    }
  };

  return (
    <div className={cn(
      "p-3 border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors flex gap-3",
      !enabled && installed && "opacity-60 grayscale-[0.5]"
    )}>
      {/* Icon */}
      <div className="w-10 h-10 shrink-0 bg-slate-800 rounded flex items-center justify-center overflow-hidden p-1.5">
        {extension.iconUrl ? (
          <img src={extension.iconUrl} alt={extension.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
            {extension.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div>
          <h3 className="text-[13px] font-medium text-slate-200 truncate">{extension.name}</h3>
          <p className="text-[11px] text-slate-400 truncate">{extension.publisher} • v{extension.version}</p>
        </div>
        
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {extension.description}
        </p>
        
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
          {extension.downloadCount !== undefined && (
            <span className="flex items-center gap-0.5" title="Downloads">
              <Download className="w-3 h-3" />
              {(extension.downloadCount / 1000).toFixed(1)}k
            </span>
          )}
          {extension.averageRating !== undefined && extension.averageRating > 0 && (
            <span className="flex items-center gap-0.5" title="Rating">
              <span className="text-yellow-500">★</span>
              {extension.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1">
          {installed ? (
            <>
              <button 
                onClick={handleToggleEnable}
                disabled={loading}
                className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors flex items-center gap-1"
              >
                {enabled ? 'Disable' : 'Enable'}
              </button>
              <button 
                onClick={handleUninstall}
                disabled={loading}
                className="text-[10px] p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                title="Uninstall"
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button 
              onClick={handleInstall}
              disabled={loading}
              className="text-[10px] px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5 transition-colors"
            >
              {loading ? (
                <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              Install
            </button>
          )}
          
          <button className="text-slate-500 hover:text-slate-300 ml-auto p-1 transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
