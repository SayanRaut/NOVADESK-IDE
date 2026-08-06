import { useState } from 'react';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../config/api';
import ParticleText from '../components/animations/ParticleText';
import SpecularButton from '../components/animations/SpecularButton';
import BackgroundParticles from '../components/animations/BackgroundParticles';
import FoldText from '../components/animations/FoldText';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginPage = () => {
  const { login, continueLocally } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleGoogleLogin = async () => {
    if (!window.electronAPI) return;
    setIsWorking(true);
    setError(null);
    try {
      const state = await window.electronAPI.startGoogleLogin();
      
      const payload = await new Promise<{ access_token?: string; refresh_token?: string; error?: string } | null>((resolve) => {
        let isResolved = false;

        // Listen for the deep link IPC event
        let unsubscribe: (() => void) | undefined;
        if (window.electronAPI && window.electronAPI.onGoogleAuth) {
          unsubscribe = window.electronAPI.onGoogleAuth((pending) => {
            if (isResolved) return;
            isResolved = true;
            if ((pending as any).error) {
              resolve({ error: (pending as any).error });
            } else if (pending.ticket) {
              resolve({ 
                access_token: pending.ticket, 
                refresh_token: (pending as any).refresh_token 
              });
            }
          });
        }

        const interval = setInterval(async () => {
          if (isResolved) {
            clearInterval(interval);
            if (unsubscribe) unsubscribe();
            return;
          }
          try {
            // First check if the desktop deep link was triggered and saved (if mainWindow wasn't ready)
            if (window.electronAPI && window.electronAPI.checkPendingAuth) {
              const pending = await window.electronAPI.checkPendingAuth();
              if (pending) {
                if ((pending as any).error) {
                  isResolved = true;
                  clearInterval(interval);
                  if (unsubscribe) unsubscribe();
                  resolve({ error: (pending as any).error });
                  return;
                } else if (pending.ticket) {
                  isResolved = true;
                  clearInterval(interval);
                  if (unsubscribe) unsubscribe();
                  resolve({ 
                    access_token: pending.ticket, 
                    refresh_token: (pending as any).refresh_token 
                  });
                  return;
                }
              }
            }

            // Fallback to polling the backend
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/api/auth/google/status?state=${state}`);
            if (res.ok) {
              const data = await res.json();
              if (!data.pending) {
                isResolved = true;
                clearInterval(interval);
                if (unsubscribe) unsubscribe();
                resolve(data);
              }
            }
          } catch (e) {
            console.error('Polling error', e);
          }
        }, 1500);
        
        setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          clearInterval(interval);
          if (unsubscribe) unsubscribe();
          resolve(null);
        }, 300000);
      });
      
      if (payload && (payload as any).error) {
        setIsWorking(false);
        setError((payload as any).error);
      } else if (payload && payload.access_token) {
        const { access_token, refresh_token } = payload;
        try {
          let apiBase = getApiBaseUrl();
          // Forcefully prevent using a cloudflare tunnel for the auth endpoint, as that belongs to Ollama!
          if (apiBase.includes('trycloudflare.com') || apiBase.includes('localhost:8000')) {
             console.error('[LoginPage] CRITICAL: API Base was set to a tunnel or localhost! Forcing Render URL.');
             apiBase = 'https://novadesk-ide.onrender.com';
          }
          
          console.log('[LoginPage] Attempting to fetch profile from:', `${apiBase}/api/auth/me`);
          console.log('[LoginPage] Using token:', access_token.substring(0, 10) + '...');
          
          const resMe = await fetch(`${apiBase}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          
          console.log('[LoginPage] Profile fetch response status:', resMe.status);
          
          if (!resMe.ok) {
            let detail = 'Failed to fetch user profile';
            try {
              const errData = await resMe.json();
              detail = errData.detail || errData.message || detail;
            } catch {}
            throw new Error(`[Debug] HTTP ${resMe.status}: ${detail}`);
          }
          const user = await resMe.json();
          await login({ access_token, refresh_token, token_type: 'bearer', user });
        } catch (err: any) {
          setIsWorking(false);
          console.error('[LoginPage] Detailed Error fetching profile:', err);
          setError(`[Debug] ${err.message || 'Unknown error'}`);
        }
      } else {
        setIsWorking(false);
        setError("Google login timed out or failed.");
      }
    } catch (err: any) {
      setIsWorking(false);
      setError(err.message || "Failed to start Google login");
    }
  };

  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#020617] text-gray-200">
      
      {/* 3D Particles Background */}
      <BackgroundParticles
        particleCount={520}
        particleSpread={19}
        speed={0.2}
        particleColors={["#ffffff"]}
        moveParticlesOnHover={false}
        particleHoverFactor={4.2}
        alphaParticles={true}
        particleBaseSize={100}
        sizeRandomness={0.6}
        cameraDistance={35}
        disableRotation={true}
        blurAmount="15px"
      />

      {/* iOS Style Glass Wrapper */}
      <div className="relative z-10 flex flex-col lg:flex-row w-[95%] max-w-[1400px] h-[90vh] glass-panel rounded-[2.5rem] shadow-[0_15px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden border border-white/20 bg-white/5 backdrop-blur-2xl">
        
        {/* Visuals Part - Left Side */}
        <div className="relative hidden lg:flex flex-1 flex-col items-center justify-center border-r border-white/10 bg-black/20 overflow-hidden">
          <div className="flex flex-col w-full items-center justify-center gap-2">
            <div className="w-full h-40 relative">
              <ParticleText
                text="NOVADESK"
                particleSize={3}
                density={5}
                color="#f8fafc"
                highlightColor="#10b981"
                scatter={200}
                gatherDuration={1500}
                stagger={300}
                pointerRepel={80}
                repelRadius={150}
                idleDrift={1}
                trigger="mount"
                fontSize="clamp(3rem, 7vw, 7rem)"
                fontWeight={900}
                fontFamily="Inter, sans-serif"
                glow={true}
              />
            </div>
            <div className="w-full h-32 relative">
              <ParticleText
                text="IDE"
                particleSize={3}
                density={4}
                color="#94a3b8"
                highlightColor="#06b6d4"
                scatter={150}
                gatherDuration={1500}
                stagger={250}
                pointerRepel={60}
                repelRadius={120}
                idleDrift={1}
                trigger="mount"
                fontSize="clamp(2rem, 5vw, 5rem)"
                fontWeight={800}
                fontFamily="Inter, sans-serif"
                glow={true}
              />
            </div>
          </div>
        </div>

        {/* Login Fields Part - Right Side */}
        <div className="flex w-full lg:w-[480px] xl:w-[550px] h-full flex-col items-center justify-center p-8 bg-black/40 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!showLogin ? (
              <motion.div
                key="getStarted"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center gap-12"
              >
                <div className="text-center w-full relative h-16 flex items-center justify-center">
                  <FoldText 
                    text="New to NovaDesk" 
                    color="#ffffff" 
                    fontSize="1.5rem" 
                    stagger={0.05} 
                    duration={0.8}
                    trigger="mount"
                  />
                </div>
                <SpecularButton onClick={() => setShowLogin(true)} size="lg">
                  Get Started
                </SpecularButton>
              </motion.div>
            ) : (
              <motion.div
                key="loginForm"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full max-w-sm flex flex-col gap-4"
              >
                
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome!</h2>
                  <p className="text-sm text-slate-300">Sign in to your AI workspace</p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isWorking}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/90 backdrop-blur-sm px-4 py-3.5 text-sm font-semibold text-gray-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 shadow-lg hover:shadow-xl"
                >
                  {isWorking ? (
                    <LoaderCircle className="animate-spin text-gray-900" size={18} />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                  )}
                  {isWorking ? 'Signing in...' : 'Sign in with Google'}
                </button>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/20"></div>
                    <span className="mx-4 shrink-0 text-xs text-white/50">or</span>
                    <div className="flex-grow border-t border-white/20"></div>
                </div>

                <button
                  type="button"
                  onClick={continueLocally}
                  disabled={isWorking}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg"
                >
                  Continue locally
                </button>
              
              {error && <p className="mt-4 rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-xs text-red-200 backdrop-blur-md">{error}</p>}
              
              <div className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-400">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" /> 
                Secure local authentication. AI usage is managed by NovaDesk Cloud.
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

