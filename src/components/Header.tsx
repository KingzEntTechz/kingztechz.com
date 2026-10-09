import { Wrench, Menu, X, UserCircle, LogOut, LayoutDashboard, Server, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export type TabId = 'home' | 'admin' | 'rentals';

type HeaderProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
};

export default function Header({ activeTab, onTabChange, onOpenAuth }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, profile, isAdmin, signOut, settings } = useAuth();

  const handleTabClick = (tab: TabId) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  const scrollItems1 = (settings?.scrolling_text_1 || '').split('|').map(s => s.trim()).filter(Boolean);
  const scrollItems2 = (settings?.scrolling_text_2 || '').split('|').map(s => s.trim()).filter(Boolean);
  const colors1 = ['text-accent-500', 'text-info-500', 'text-success-500', 'text-accent-500', 'text-info-500'];
  const colors2 = ['text-success-500', 'text-info-500', 'text-accent-500', 'text-info-500'];
  const balanceLabel = profile && !isAdmin
    ? profile.preferred_currency === 'KES' ? `${profile.balance_kes.toLocaleString()}Kes` : `${profile.balance_usdt.toLocaleString()}$`
    : null;

  return (
    <header className="sticky top-0 z-50 bg-dark-400/95 backdrop-blur-md border-b border-dark-50 shadow-lg">
      {scrollItems1.length > 0 && (
        <div className="overflow-hidden bg-dark-500/80 border-b border-dark-50/50 py-1.5">
          <div className="flex whitespace-nowrap animate-scroll-right">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex shrink-0">
                {scrollItems1.map((item, j) => <span key={j} style={{ fontSize: `${settings?.scroll_font_size || 16}px` }} className={`px-6 font-semibold ${colors1[j % colors1.length]}`}>{item}</span>)}
              </div>
            ))}
          </div>
        </div>
      )}
      {scrollItems2.length > 0 && (
        <div className="overflow-hidden bg-dark-500/80 border-b border-dark-50/50 py-1">
          <div className="flex whitespace-nowrap animate-scroll-left">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex shrink-0">
                {scrollItems2.map((item, j) => <span key={j} style={{ fontSize: `${settings?.scroll_font_size || 16}px` }} className={`px-6 font-semibold ${colors2[j % colors2.length]}`}>{item}</span>)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => handleTabClick('home')} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 shadow-lg">
              {settings?.server_logo_url ? <img src={settings.server_logo_url} alt="Server logo" className="w-7 h-7 object-contain" /> : <Wrench className="w-6 h-6 text-white" />}
            </div>
            <div className="flex flex-col"><span className="text-lg font-bold text-white leading-none">Kingz <span className="text-accent-500">Techz</span></span><span className="text-xs text-info-500 font-medium">Server</span></div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <button onClick={() => handleTabClick('home')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${activeTab === 'home' ? 'text-accent-500 bg-accent-500/10' : 'text-gray-300 hover:text-info-500 hover:bg-white/5'}`}><Server className="w-4 h-4" /> Home</button>
            {user && <button onClick={() => handleTabClick('rentals')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${activeTab === 'rentals' ? 'text-info-500 bg-info-500/10' : 'text-gray-300 hover:text-info-500 hover:bg-white/5'}`}><Calendar className="w-4 h-4" /> My Rentals</button>}
            {isAdmin && <button onClick={() => handleTabClick('admin')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${activeTab === 'admin' ? 'text-success-500 bg-success-500/10' : 'text-success-500 hover:bg-success-500/10'}`}><LayoutDashboard className="w-4 h-4" /> Admin</button>}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <UserCircle className="w-7 h-7 text-info-500" />
                  <span className="hidden sm:inline text-sm font-medium text-gray-200">{profile?.full_name || 'User'}</span>
                  {balanceLabel && <span className="hidden sm:inline text-[11px] font-semibold text-success-500">{balanceLabel}</span>}
                </button>
                {userMenuOpen && <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-dark-200 border border-dark-50 rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-dark-50"><p className="text-sm font-semibold text-gray-100 truncate">{profile?.full_name || 'User'}</p>{balanceLabel && <p className="text-xs font-semibold text-success-500 mt-0.5">{balanceLabel}</p>}{isAdmin && <span className="inline-block mt-1 text-xs font-semibold text-success-500 bg-success-500/10 px-2 py-0.5 rounded">Administrator</span>}</div>
                    <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-accent-500 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
                  </div>
                </>}
              </div>
            ) : <div className="hidden sm:flex items-center gap-2"><button onClick={() => onOpenAuth('login')} className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-info-500 transition-colors">Login</button><button onClick={() => onOpenAuth('signup')} className="px-4 py-2 text-sm font-semibold text-white bg-info-500 rounded-lg hover:bg-info-600 transition-colors">Sign Up</button></div>}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-200 hover:bg-white/5 rounded-lg transition-colors">{mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>

        {mobileOpen && <nav className="md:hidden pb-4 flex flex-col gap-1">
          <button onClick={() => handleTabClick('home')} className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'home' ? 'text-accent-500 bg-accent-500/10' : 'text-gray-300 hover:text-info-500 hover:bg-white/5'}`}><Server className="w-4 h-4" /> Home</button>
          {user && <button onClick={() => handleTabClick('rentals')} className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'rentals' ? 'text-info-500 bg-info-500/10' : 'text-gray-300 hover:text-info-500 hover:bg-white/5'}`}><Calendar className="w-4 h-4" /> My Rentals</button>}
          {isAdmin && <button onClick={() => handleTabClick('admin')} className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${activeTab === 'admin' ? 'text-success-500 bg-success-500/10' : 'text-success-500 hover:bg-success-500/10'}`}><LayoutDashboard className="w-4 h-4" /> Admin Panel</button>}
          {!user && <div className="flex gap-2 pt-2"><button onClick={() => { onOpenAuth('login'); setMobileOpen(false); }} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-300 border border-dark-50 rounded-lg hover:bg-white/5 transition-colors">Login</button><button onClick={() => { onOpenAuth('signup'); setMobileOpen(false); }} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-info-500 rounded-lg hover:bg-info-600 transition-colors">Sign Up</button></div>}
        </nav>}
      </div>
    </header>
  );
}
