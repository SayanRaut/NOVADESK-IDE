import { useState, useRef, useEffect } from 'react';
import { 
  LoaderCircle, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  KeyRound, 
  RefreshCw, 
  AlertCircle,
  Terminal,
  Zap,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loginWithEmail, registerWithEmail, verifyOtp, resendOtp } from '../api';
import BackgroundParticles from '../components/animations/BackgroundParticles';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginPage = () => {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'otp'>('signin');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Handle Sign In & Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    if (authMode === 'signin') {
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setIsWorking(true);
      try {
        const session = await loginWithEmail(cleanEmail, password);
        setSuccessMsg(`Welcome back, ${session.user.display_name}!`);
        await login(session);
      } catch (err: any) {
        console.error('Login error:', err);
        if (err.requires_verification) {
          setError('Your email is not verified yet. We have dispatched a 6-digit verification code.');
          setAuthMode('otp');
          setResendCooldown(60);
        } else {
          setError(err.message || 'Incorrect email or password.');
        }
      } finally {
        setIsWorking(false);
      }
    } else if (authMode === 'register') {
      if (!displayName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your confirm password.');
        return;
      }

      setIsWorking(true);
      try {
        const res = await registerWithEmail(displayName.trim(), cleanEmail, password, confirmPassword);
        setSuccessMsg(res.message || 'Verification code sent to your email.');
        setAuthMode('otp');
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
      } catch (err: any) {
        console.error('Registration error:', err);
        setError(err.message || 'Failed to create account. Please check your credentials.');
      } finally {
        setIsWorking(false);
      }
    }
  };

  // OTP Handlers
  const handleOtpInput = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => !d);
    const targetIdx = nextEmpty === -1 ? 5 : nextEmpty;
    otpInputRefs.current[targetIdx]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      const session = await verifyOtp(email.trim().toLowerCase(), fullCode);
      setSuccessMsg('Account verified successfully! Launching NovaDesk...');
      await login(session);
    } catch (err: any) {
      console.error('OTP Verification error:', err);
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isWorking) return;
    setIsWorking(true);
    setError(null);
    try {
      const res = await resendOtp(email.trim().toLowerCase());
      setSuccessMsg(res.message || 'A fresh 6-digit code has been sent.');
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#020617] text-gray-200 p-4 sm:p-6">
      {/* 3D Dynamic Background Particles */}
      <BackgroundParticles
        particleCount={350}
        particleSpread={16}
        speed={0.16}
        particleColors={['#c4f042', '#38bdf8', '#a855f7']}
        moveParticlesOnHover={false}
        particleHoverFactor={2.5}
        alphaParticles={true}
        particleBaseSize={75}
        sizeRandomness={0.6}
        cameraDistance={35}
        disableRotation={true}
        blurAmount="14px"
      />

      {/* Main Glass Shell */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-[1240px] min-h-[700px] lg:h-[88vh] rounded-[2.5rem] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden border border-white/15 bg-white/[0.03] backdrop-blur-2xl">
        
        {/* Left Hero: Lovable / Windsurf Showcase */}
        <div className="relative hidden lg:flex flex-1 flex-col justify-between border-r border-white/10 bg-black/40 p-12 overflow-hidden">
          {/* Top Branding */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center text-black font-extrabold shadow-lg shadow-lime-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">NovaDesk</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-lime-400/20 text-[#c4f042] border border-lime-400/30">
                  Fullstack AI
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400">Next-Generation AI Coding & Prototyping Platform</p>
          </div>

          {/* Central Animated Code / Cascade Window (Windsurf & Lovable Vibe) */}
          <div className="flex flex-col gap-6 my-auto">
            <div className="relative rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl p-5 shadow-2xl overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-[11px] text-slate-400">cascade-agent • live sync</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Gemini 2.5 Flash
                </span>
              </div>

              <div className="space-y-2.5 text-[11px] leading-relaxed">
                <p className="text-slate-400 flex items-center gap-2">
                  <span className="text-lime-400 font-bold">❯</span>
                  <span>Scaffolding Next.js 15 Full-Stack App Router...</span>
                </p>
                <p className="text-emerald-300/90 flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Configured Tailwind CSS & Server Component boundaries</span>
                </p>
                <p className="text-emerald-300/90 flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Connected REST Route Handlers in /app/api/data</span>
                </p>
                <p className="text-cyan-300/90 flex items-center gap-2">
                  <Zap size={13} className="text-cyan-400 shrink-0" />
                  <span>WebSocket real-time streaming link established</span>
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Latency: 4ms</span>
                  <span className="text-lime-400 font-bold">100% Verified Sandboxed</span>
                </div>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center gap-3">
                <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/20">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-[12px]">Gemini 2.5 Intelligence</h4>
                  <p className="text-[10px] text-slate-400">Deep coding & zero VRAM latency</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-400/10 text-blue-400 border border-blue-400/20">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-[12px]">Bcrypt & OTP Security</h4>
                  <p className="text-[10px] text-slate-400">Strict real account verification</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-4">
            <span>© 2026 NovaDesk IDE</span>
            <span>Cloud Code Generation Engine</span>
          </div>
        </div>

        {/* Right Form: Auth & Verification */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-10 lg:py-12 bg-[#020617]/90 overflow-y-auto">
          <div className="w-full max-w-md mx-auto flex flex-col gap-6">

            {/* Tab Navigation (Only in Sign In / Register modes) */}
            {authMode !== 'otp' && (
              <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-black shadow-md shadow-lime-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-black shadow-md shadow-lime-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error & Success Banners */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5"
                >
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MODE 1 & 2: SIGN IN / REGISTER FORM */}
            {authMode !== 'otp' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                    {authMode === 'signin' ? 'Welcome Back' : 'Create NovaDesk Account'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {authMode === 'signin'
                      ? 'Sign in to access your cloud workspaces and AI agent suite.'
                      : 'Register a real account. A 6-digit OTP will be dispatched for verification.'}
                  </p>
                </div>

                {/* Display Name (Register Only) */}
                {authMode === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Full Name</label>
                    <div className="relative flex items-center">
                      <UserIcon size={16} className="absolute left-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-lime-400 focus:bg-white/[0.08] transition"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-lime-400 focus:bg-white/[0.08] transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    {authMode === 'register' && strength.label && (
                      <span className="text-[10px] font-bold text-slate-400">
                        Strength: <span className="text-white">{strength.label}</span>
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-lime-400 focus:bg-white/[0.08] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Strength Bar (Register Only) */}
                  {authMode === 'register' && password && (
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Confirm Password (Register Only) */}
                {authMode === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-3.5 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-10 py-3 bg-white/5 border rounded-xl text-xs text-white placeholder-slate-500 outline-none transition ${
                          passwordsMatch
                            ? 'border-emerald-500 focus:border-emerald-400'
                            : passwordsMismatch
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-white/10 focus:border-lime-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-slate-500 hover:text-slate-300 transition"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {/* Matching indicator */}
                    {passwordsMatch && (
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={12} /> Passwords match perfectly
                      </p>
                    )}
                    {passwordsMismatch && (
                      <p className="text-[10px] text-rose-400 flex items-center gap-1 font-medium">
                        <AlertCircle size={12} /> Passwords do not match
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isWorking || (authMode === 'register' && (!passwordsMatch || password.length < 8))}
                  className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-extrabold text-xs shadow-xl shadow-lime-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isWorking ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === 'signin' ? 'Sign In to Workspace' : 'Send Verification Code'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* MODE 3: 6-DIGIT OTP VERIFICATION SCREEN */
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
                <div>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setError(null); }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to sign in</span>
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-[#c4f042] mb-3">
                    <KeyRound size={24} />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                    Verify Your Email
                  </h2>
                  <p className="text-xs text-slate-400">
                    We dispatched a 6-digit cryptographic verification code to{' '}
                    <span className="font-bold text-slate-200">{email}</span>.
                  </p>
                </div>

                {/* 6-Digit OTP Boxes */}
                <div className="flex items-center justify-between gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpInput(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/5 border border-white/15 focus:border-lime-400 focus:bg-white/[0.08] text-white outline-none transition shadow-inner"
                    />
                  ))}
                </div>

                {/* Verification Notice */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
                  <Terminal size={14} className="text-lime-400 shrink-0" />
                  <span>Dev Mode: Check backend console for printed 6-digit OTP.</span>
                </div>

                {/* Action Buttons */}
                <button
                  type="submit"
                  disabled={isWorking || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-extrabold text-xs shadow-xl shadow-lime-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isWorking ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Enter Platform</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isWorking}
                    className="font-bold text-lime-400 hover:text-lime-300 disabled:text-slate-600 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} className={isWorking ? 'animate-spin' : ''} />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
