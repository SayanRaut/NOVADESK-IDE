export const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-slate-950 text-gray-200">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl font-bold tracking-tighter text-blue-500 animate-pulse">NovaDesk</h1>
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-48 h-1 bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-[progress_1.5s_ease-in-out_forwards]" 
                 style={{ width: '0%' }}></div>
          </div>
          <span className="text-sm text-gray-400">Initializing AI Engine...</span>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
