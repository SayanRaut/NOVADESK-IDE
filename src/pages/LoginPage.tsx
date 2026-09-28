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
  AlertCircle,
  ArrowLeft,
  Compass
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loginWithEmail, registerWithEmail, verifyOtp, resendOtp } from '../api';
import { motion } from 'framer-motion';

export const LoginPage = () => {
  const { login, continueLocally } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'otp'>('signin');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [existingAccountDetected, setExistingAccountDetected] = useState<string | null>(null);

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('sayanraut2005@gmail.com');
  const [password, setPassword] = useState('Sdr@2005');
  const [confirmPassword, setConfirmPassword] = useState('Sdr@2005');
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
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Handle direct sign-in with current credentials
  const performSignIn = async (userEmail: string, userPass: string) => {
    setIsWorking(true);
    setError(null);
    setExistingAccountDetected(null);
    try {
      const session = await loginWithEmail(userEmail.trim().toLowerCase(), userPass);
      setSuccessMsg(`Welcome back, ${session.user.display_name}!`);
      await login(session);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.requires_verification) {
        setError('Your email is not verified yet. We have dispatched a 6-digit verification code.');
        setAuthMode('otp');
        setResendCooldown(60);
      } else {
        setError(err.message || 'Incorrect email or password. Please verify your credentials.');
      }
    } finally {
      setIsWorking(false);
    }
  };

  // Handle Sign In & Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setExistingAccountDetected(null);

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
      await performSignIn(cleanEmail, password);
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
        const msg = err.message || '';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
          setExistingAccountDetected(cleanEmail);
          setError(null);
        } else {
          setError(msg || 'Failed to create account. Please check your network connection.');
        }
      } finally {
        setIsWorking(false);
      }
    }
  };

  // Handle OTP digit inputs
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
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
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsWorking(true);
    setError(null);
    try {
      const session = await verifyOtp(email.trim().toLowerCase(), code);
      setSuccessMsg('Account successfully verified! Initializing your workspace...');
      await login(session);
    } catch (err: any) {
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
      await resendOtp(email.trim().toLowerCase());
      setSuccessMsg(`A new verification code has been dispatched to ${email}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again later.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 overflow-hidden font-sans text-slate-800">
      {/* Decorative ambient light gradients */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-400/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-400/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-[350px] h-[350px] rounded-full bg-cyan-400/10 blur-[100px] pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-300/50 border border-white/90"
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3.5">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            NovaDesk <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous Project Planner, Step Inspector & Cloud Development Platform
          </p>
        </div>

        {/* Tab Switcher (Sign In vs Create Account) */}
        {authMode !== 'otp' && (
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-slate-200/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError(null);
                setExistingAccountDetected(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                authMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
                setExistingAccountDetected(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                authMode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Account Already Exists Smart Card (Fix for Screenshot scenario) */}
        {existingAccountDetected && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-blue-900">Account Already Registered</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  <span className="font-medium text-blue-950">{existingAccountDetected}</span> is already an active NovaDesk user.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    performSignIn(existingAccountDetected, password);
                  }}
                  disabled={isWorking}
                  className="mt-3 w-full py-2 px-3 glass-button-primary rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  {isWorking ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  Sign In Instantly as Sayan
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </motion.div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </motion.div>
        )}

        {/* FORM CONTENT */}
        {authMode !== 'otp' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sayan Raut"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/90 border border-slate-200/90 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/90 border border-slate-200/90 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {authMode === 'register' && password && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    strength.score >= 3 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                  }`}>
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-white/90 border border-slate-200/90 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white/90 border border-slate-200/90 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {passwordsMatch && (
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>
            )}

            {/* Primary Glass Submit Button */}
            <button
              type="submit"
              disabled={isWorking}
              className="w-full mt-2 py-2.5 px-4 glass-button-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {isWorking ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <span>Connecting to NovaDesk...</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'signin' ? 'Sign In to Workspace' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Verify Your Email</h3>
              <p className="text-xs text-slate-500 mt-1">
                A 6-digit code has been sent to <span className="font-medium text-slate-800">{email}</span>
              </p>
            </div>

            {/* 6 Digit Inputs */}
            <div className="flex items-center justify-center gap-2">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpInputRefs.current[i] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="w-10 h-12 text-center text-base font-bold bg-white/90 border border-slate-200/90 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isWorking}
              className="w-full py-2.5 px-4 glass-button-emerald rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {isWorking ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Complete Verification & Enter</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isWorking}
                className="text-blue-600 hover:text-blue-700 font-semibold disabled:text-slate-400"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {/* Divider & Guest / Local Workspace Mode */}
        {authMode !== 'otp' && (
          <div className="mt-6 pt-5 border-t border-slate-200/70">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Instant Access
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Offline Ready
              </span>
            </div>
            
            <button
              type="button"
              onClick={continueLocally}
              className="w-full py-2.5 px-4 glass-button rounded-xl text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Continue in Guest / Local Workspace Mode</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-400 mt-5">
          NovaDesk IDE &bull; Autonomous Architecture & Progress Inspector
        </p>
      </motion.div>
    </div>
  );
};
export default LoginPage;
