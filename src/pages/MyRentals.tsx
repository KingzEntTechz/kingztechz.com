import { useState, useEffect } from 'react';
import { Calendar, Eye, EyeOff, Monitor, CheckCircle, Clock, Key, Copy, ChevronDown } from 'lucide-react';
import { supabase, type Rental } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function MyRentals() {
  const { user, profile } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRental, setExpandedRental] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('rentals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRentals((data as Rental[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const togglePass = (id: string) => setShowPasswords(s => ({ ...s, [id]: !s[id] }));
  const copyText = (text: string) => { if (text) navigator.clipboard?.writeText(text); };
  const copyLogin = (email: string, password: string) => copyText(`Email/Username: ${email}\nPassword: ${password}`);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-4 border-info-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-1"><Calendar className="w-7 h-7 text-info-500" /> My Rentals</h1>
      <p className="text-gray-400 text-sm mb-6">Your tool logins and connection details appear here after each rental.</p>

      {rentals.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No rentals yet.</p>
          <p className="text-sm text-gray-500 mt-1">Your rental history will appear here once you rent a tool.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rentals.map(r => {
            const isRemote = Boolean(r.anydesk_id || r.ultraviewer_id);
            const hasLogins = Boolean(r.delivered_email);
            const showPass = showPasswords[r.id];
            const expanded = expandedRental === r.id;
            return (
              <div key={r.id} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedRental(expanded ? null : r.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                  aria-expanded={expanded}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Key className="w-4 h-4 text-success-500 shrink-0" />
                      <h3 className="font-semibold text-white text-sm truncate">{r.tool_name}</h3>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 ml-6">{new Date(r.created_at).toLocaleDateString()} · {profile?.preferred_currency === 'KES' ? `KES ${r.amount_kes.toFixed(2)}` : `USDT ${r.amount_usd.toFixed(2)}`}</p>
                  </div>
                  <StatusBadge status={r.status} />
                  <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                  <div className="border-t border-dark-50 px-4 py-3 space-y-3">
                    {isRemote && (
                      <div className="bg-warning-500/10 border border-warning-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-warning-500 font-semibold mb-2"><Monitor className="w-4 h-4" /> Connection Details</div>
                        {r.anydesk_id && <p className="text-xs text-gray-300">AnyDesk ID: <span className="font-mono text-white">{r.anydesk_id}</span></p>}
                        {r.ultraviewer_id && <p className="text-xs text-gray-300">UltraViewer ID: <span className="font-mono text-white">{r.ultraviewer_id}</span></p>}
                        {r.ultraviewer_password && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-300">UltraViewer Password: <span className="font-mono text-white">{showPass ? r.ultraviewer_password : '••••••'}</span></p>
                            <button type="button" onClick={() => togglePass(r.id)} className="text-gray-400 hover:text-white" aria-label={showPass ? 'Hide password' : 'Show password'}>
                              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                        {r.status === 'pending' && <p className="text-[11px] text-warning-500 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Wait for admin to connect.</p>}
                      </div>
                    )}

                    {hasLogins && (
                      <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-success-500 font-semibold mb-2">
                          <span className="flex items-center gap-2"><Key className="w-3.5 h-3.5" /> Tool Login</span>
                          <button type="button" onClick={() => copyLogin(r.delivered_email, r.delivered_password)} className="inline-flex items-center gap-1 rounded-md bg-success-500/10 px-2 py-1 text-[11px] text-success-500 hover:bg-success-500/20" aria-label="Copy email and password"><Copy className="w-3 h-3" /> Copy</button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-300">Email: <span className="font-mono text-white">{r.delivered_email}</span></p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-300">Password: <span className="font-mono text-white">{showPass ? r.delivered_password : '••••••'}</span></p>
                            <button type="button" onClick={() => togglePass(r.id)} className="text-gray-400 hover:text-white" aria-label={showPass ? 'Hide password' : 'Show password'}>
                              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isRemote && !hasLogins && r.status === 'pending' && (
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Waiting for admin to assign logins.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Rental['status'] }) {
  const config: Record<Rental['status'], { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'Pending', color: 'bg-warning-500/10 text-warning-500', icon: Clock },
    paid: { label: 'Paid', color: 'bg-info-500/10 text-info-500', icon: CheckCircle },
    completed: { label: 'Completed', color: 'bg-success-500/10 text-success-500', icon: CheckCircle },
    expired: { label: 'Expired', color: 'bg-dark-50 text-gray-400', icon: Clock },
    cancelled: { label: 'Cancelled', color: 'bg-accent-500/10 text-accent-500', icon: Clock },
  };
  const { label, color, icon: Icon } = config[status];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}><Icon className="w-3 h-3" />{label}</span>;
}
