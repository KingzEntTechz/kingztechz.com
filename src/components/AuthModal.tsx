import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User as UserIcon, DollarSign, ArrowLeft, CheckCircle, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type AuthModalProps = {
  open: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  message?: string;
};

export default function AuthModal({ open, mode, onClose, onSwitchMode, message }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'KES'>('USD');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setError(message ?? null);
      scrollRef.current?.scrollTo({ top: 0 });
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setConfirmPassword('');
      setCurrency('USD');
      setResetMode(false);
      setResetSent(false);
      setSignupSent(false);
    }
  }, [open, mode, message]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (resetMode) {
      if (!email.trim()) { setError('Enter your registered email'); return; }
      setLoading(true);
      const result = await resetPassword(email);
      setLoading(false);
      if (result.error) setError(result.error);
      else setResetSent(true);
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) { setError('Please enter your full name'); return; }
      if (!phone.trim()) { setError('Please enter your phone number'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    }

    setLoading(true);
    const result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, fullName, phone, currency);
    setLoading(false);

    if (result.error) setError(result.error);
    else if (mode === 'signup' && 'needsConfirmation' in result && result.needsConfirmation) setSignupSent(true);
    else onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div onClick={handleOverlayClick} className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div ref={scrollRef} className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-dark-200 border border-dark-50 rounded-2xl shadow-2xl p-6 sm:p-8 animate-slide-up my-0 sm:my-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-accent-500 hover:bg-white/5 rounded-lg transition-colors z-10" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        {resetMode ? (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-1">Reset Password</h2>
            <div className="w-16 h-1 bg-accent-500 rounded-full mx-auto mb-6" />
            {resetSent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
                <p className="text-gray-300 text-sm">A password reset link has been sent to your registered email.</p>
                <button type="button" onClick={() => { setResetMode(false); setResetSent(false); }} className="btn-primary w-full mt-6">Back to Login</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="px-4 py-3 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm">{error}</div>}
                <p className="text-sm text-gray-400">Enter the email you registered with and we will send you a reset link.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Registered Email</label>
                  <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" placeholder="Enter your email" required /></div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Sending...' : 'Send Reset Link'}</button>
                <button type="button" onClick={() => setResetMode(false)} className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Back to Login</button>
              </form>
            )}
          </>
        ) : (
          <>
            {signupSent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                <div className="w-16 h-1 bg-accent-500 rounded-full mx-auto mb-4" />
                <p className="text-gray-300 text-sm mb-2">We sent a verification link to</p>
                <p className="text-info-500 font-semibold text-sm mb-4">{email}</p>
                <p className="text-gray-400 text-sm mb-6">Click the link in that email to confirm your account. You can log in after confirming.</p>
                <button type="button" onClick={() => { setSignupSent(false); onSwitchMode('login'); }} className="btn-primary w-full">Go to Login</button>
                <button type="button" onClick={onClose} className="w-full text-center text-sm text-gray-400 hover:text-gray-300 font-medium transition-colors mt-3">Close</button>
              </div>
            ) : (
              <>
            <h2 className="text-2xl font-bold text-white text-center mb-1">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <div className="w-16 h-1 bg-accent-500 rounded-full mx-auto mb-6" />
            {error && <div className="mb-4 px-4 py-3 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label><div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-field pl-10" placeholder="Enter your full name" required /></div></div>}
              {mode === 'signup' && <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-field pl-10" placeholder="e.g., 0712345678" required /></div></div>}
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" placeholder="Enter your email" required /></div></div>
              <div><div className="flex items-center justify-between mb-1.5"><label className="block text-sm font-medium text-gray-300">Password</label>{mode === 'login' && <button type="button" onClick={() => { setResetMode(true); setError(null); }} className="text-xs text-info-500 hover:text-info-400">Forgot password?</button>}</div><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field pl-10" placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (min 8 chars)'} required /></div></div>

              {mode === 'signup' && <>
                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field pl-10" placeholder="Confirm your password" required /></div></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Preferred Currency</label><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setCurrency('USD')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-semibold text-sm transition-all ${currency === 'USD' ? 'border-info-500 bg-info-500/10 text-info-500' : 'border-dark-50 text-gray-400 hover:bg-white/5'}`}><DollarSign className="w-4 h-4" /> USD</button><button type="button" onClick={() => setCurrency('KES')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-semibold text-sm transition-all ${currency === 'KES' ? 'border-info-500 bg-info-500/10 text-info-500' : 'border-dark-50 text-gray-400 hover:bg-white/5'}`}><DollarSign className="w-4 h-4" /> KES</button></div></div>
              </>}

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}</button>
              <button type="button" onClick={onClose} className="w-full text-center text-sm text-gray-400 hover:text-gray-300 font-medium transition-colors">Cancel</button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-4">{mode === 'login' ? <>Don't have an account? <button onClick={() => onSwitchMode('signup')} className="text-info-500 font-semibold hover:text-info-400">Sign Up</button></> : <>Already have an account? <button onClick={() => onSwitchMode('login')} className="text-info-500 font-semibold hover:text-info-400">Login</button></>}</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
