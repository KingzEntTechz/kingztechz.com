import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, type Profile, type SiteSettings } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  settings: SiteSettings | null;
  signUp: (email: string, password: string, fullName: string, phone: string, currency: 'USD' | 'KES') => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const defaultSettings: SiteSettings = {
  id: 1,
  scrolling_text_1: 'KINGZ_TECHZ | YOUR IT EXPERTZ | ALL DIGITAL SOLUTIONZ | COMPUTER REPAIRZ | SOFTWARE INSTALLATIONZ',
  scrolling_text_2: 'PHONE REPAIR TOOLZ ACTIVATIONZ AND RENTALZ | WHATSAPP 0712345678 | info@example.com',
  footer_text: 'Kingz Techz',
  usdt_rate: 129.22,
  whatsapp_number: '0712345678',
  mpesa_number: '0700000000',
  email: 'info@example.com',
  binance_id: '0000000000',
  binance_name: 'Payment Account',
  hero_title: 'Digital Services',
  hero_subtitle: 'Technicians tools and services',
  server_logo_url: '',
  scroll_font_size: 16,
  maintenance_mode: false,
  created_at: '',
  updated_at: '',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data as Profile | null);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (data) setSettings(data as SiteSettings);
  };

  useEffect(() => {
    loadSettings();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => { await loadProfile(session.user.id); setLoading(false); })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string, currency: 'USD' | 'KES') => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone, preferred_currency: currency } },
    });
    if (error) {
      console.error('sign up failed', error);
      return { error: 'We could not complete your sign up. If you already have an account, please log in or reset your password.' };
    }
    if (data.user && data.session === null) {
      return { error: null, needsConfirmation: true };
    }
    if (data.user && data.session) await loadProfile(data.user.id);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('sign in failed', error);
      if (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not confirmed')) {
        return { error: 'Please confirm your email first. Check your inbox for a verification link from Kingz Techz.' };
      }
      return { error: 'Those sign in details are not correct. Please try again.' };
    }
    if (data.user) await loadProfile(data.user.id);
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) console.error('password reset failed', error);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const refreshSettings = async () => { await loadSettings(); };

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null, profile,
      isAdmin: profile?.is_admin ?? false, loading, settings,
      signUp, signIn, resetPassword, signOut, refreshProfile, refreshSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
