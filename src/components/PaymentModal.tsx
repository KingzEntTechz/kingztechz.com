import { useState } from 'react';
import { X, CheckCircle, Monitor, Eye, EyeOff, Wallet, Clock } from 'lucide-react';
import { supabase, type Tool } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type PaymentModalProps = {
  open: boolean;
  tool: Tool | null;
  onClose: () => void;
};

export default function PaymentModal({ open, tool, onClose }: PaymentModalProps) {
  const { user, profile, settings, refreshProfile } = useAuth();
  const [anydeskId, setAnydeskId] = useState('');
  const [ultraviewerId, setUltraviewerId] = useState('');
  const [ultraviewerPassword, setUltraviewerPassword] = useState('');
  const [showUltraPass, setShowUltraPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !tool) return null;

  const currency = profile?.preferred_currency || 'USD';
  const usdtRate = settings?.usdt_rate || 129.22;
  const priceKes = tool.price_kes || tool.price_usd * usdtRate;
  const displayPrice = currency === 'KES'
    ? `KES ${priceKes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `USDT ${tool.price_usd.toFixed(2)}`;

  const balance = currency === 'KES' ? profile?.balance_kes ?? 0 : profile?.balance_usdt ?? 0;
  const hasEnough = balance >= (currency === 'KES' ? priceKes : tool.price_usd);

  const handleSubmit = async () => {
    if (!user) { onClose(); return; }
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase.rpc('create_rental', {
      p_tool_id: tool.id,
      p_anydesk_id: anydeskId,
      p_ultraviewer_id: ultraviewerId,
      p_ultraviewer_password: ultraviewerPassword,
    });
    setSubmitting(false);
    if (error) {
      console.error('rental request failed', error);
      const msg = error.message || '';
      if (msg.includes('Insufficient balance')) {
        setSubmitError('Insufficient balance. Contact admin to add funds.');
      } else {
        setSubmitError('Your request could not be submitted. Please try again.');
      }
      return;
    }
    await refreshProfile();
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false); setSubmitError(null);
    setAnydeskId(''); setUltraviewerId(''); setUltraviewerPassword(''); setShowUltraPass(false);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const canSubmit = hasEnough && !submitting && (
    !tool.remote_connect ||
    (tool.remote_connect === 'anydesk' && anydeskId.trim()) ||
    (tool.remote_connect === 'ultraviewer' && ultraviewerId.trim() && ultraviewerPassword.trim())
  );

  return (
    <div onClick={handleOverlayClick} className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-dark-200 border border-dark-50 rounded-2xl shadow-2xl p-6 my-0 animate-slide-up">
        <button onClick={handleClose} className="fixed top-4 right-4 p-3 text-gray-300 bg-dark-200/95 border border-dark-50 hover:text-accent-500 rounded-full shadow-xl transition-colors z-[120]" aria-label="Close rental window">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success-500/20 mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Rental Confirmed!</h3>
            {tool.remote_connect ? (
              <p className="text-gray-400 mb-6 text-sm">Your request has been placed. Wait for admin to connect.</p>
            ) : (
              <p className="text-gray-400 mb-6 text-sm">Your tool logins are now available in your rental history.</p>
            )}
            <button onClick={handleClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-1">Complete Your Rental</h2>
            <div className="w-16 h-1 bg-accent-500 rounded-full mx-auto mb-6" />

            <div className="bg-dark-400/50 rounded-xl p-4 mb-5 text-center">
              <h3 className="text-lg font-bold text-white">{tool.name}</h3>
              <p className="text-sm text-gray-400 mt-1">Duration: {tool.duration}</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-2xl font-bold text-[#00a859]">{displayPrice}</span>
              </div>
              {tool.remote_connect && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning-500/10 border border-warning-500/30">
                  <Monitor className="w-4 h-4 text-warning-500" />
                  <span className="text-sm font-semibold text-warning-500">Requires {tool.remote_connect === 'anydesk' ? 'AnyDesk' : 'UltraViewer'}</span>
                </div>
              )}
            </div>

            {!user ? (
              <div className="text-center py-6">
                <p className="text-gray-400 mb-4 text-sm">Please sign in to rent this tool.</p>
                <button onClick={handleClose} className="btn-primary">OK</button>
              </div>
            ) : profile?.is_disabled ? (
              <div className="text-center py-6">
                <p className="text-gray-400 mb-4 text-sm">Your account cannot place new rentals right now. Please contact support.</p>
                <button onClick={handleClose} className="btn-primary">OK</button>
              </div>
            ) : !hasEnough ? (
              <div className="text-center py-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent-500/10 mx-auto mb-3">
                  <Wallet className="w-7 h-7 text-accent-500" />
                </div>
                <p className="text-white font-semibold mb-1">Insufficient Balance</p>
                <p className="text-gray-400 text-sm mb-1">Your balance: {currency === 'KES' ? `KES ${balance.toFixed(2)}` : `USDT ${balance.toFixed(2)}`}</p>
                <p className="text-accent-400 text-sm mb-4">Contact admin to add funds to your account.</p>
                <button onClick={handleClose} className="btn-primary">OK</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-info-500/10 border border-info-500/30 rounded-lg p-3 flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-info-500 shrink-0" />
                  <div className="text-sm">
                    <p className="text-gray-300">Balance: <span className="font-bold text-white">{currency === 'KES' ? `KES ${balance.toFixed(2)}` : `USDT ${balance.toFixed(2)}`}</span></p>
                    <p className="text-xs text-gray-400">Price will be deducted from your account balance.</p>
                  </div>
                </div>

                {tool.remote_connect === 'anydesk' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Your AnyDesk ID</label>
                    <input type="text" value={anydeskId} onChange={e => setAnydeskId(e.target.value)} className="input-field" placeholder="Enter your AnyDesk ID" required />
                  </div>
                )}
                {tool.remote_connect === 'ultraviewer' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Your UltraViewer ID</label>
                      <input type="text" value={ultraviewerId} onChange={e => setUltraviewerId(e.target.value)} className="input-field" placeholder="Enter your UltraViewer ID" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Your UltraViewer Password</label>
                      <div className="relative">
                        <input type={showUltraPass ? 'text' : 'password'} value={ultraviewerPassword} onChange={e => setUltraviewerPassword(e.target.value)} className="input-field pr-11" placeholder="Enter your UltraViewer password" required />
                        <button type="button" onClick={() => setShowUltraPass(!showUltraPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showUltraPass ? 'Hide password' : 'Show password'}>
                          {showUltraPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-warning-500 bg-warning-500/10 border border-warning-500/30 rounded-lg px-3 py-2">
                      <Clock className="w-4 h-4 shrink-0" /> After submitting, wait for admin to connect.
                    </div>
                  </div>
                )}

                {submitError && <p className="rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-sm text-accent-400">{submitError}</p>}
                <button onClick={handleSubmit} disabled={!canSubmit}
                  className="btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> {submitting ? 'Processing...' : 'Confirm Rental'}
                </button>
                <button onClick={handleClose} className="w-full text-center text-sm text-gray-400 hover:text-gray-300 font-medium transition-colors">Cancel</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
