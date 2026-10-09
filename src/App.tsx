import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header, { type TabId } from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import AuthModal from '@/components/AuthModal';
import PaymentModal from '@/components/PaymentModal';
import Home from '@/pages/Home';
import Legal from '@/pages/Legal';
import AdminPanel from '@/pages/AdminPanel';
import MyRentals from '@/pages/MyRentals';
import { supabase, type Tool } from '@/lib/supabase';


function AppContent() {
  const { user, isAdmin, loading, settings } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup'; message?: string }>({ open: false, mode: 'login' });
  const [paymentTool, setPaymentTool] = useState<Tool | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [showLegal, setShowLegal] = useState(false);

  useEffect(() => {
    const loadTools = async () => {
      const { data } = await supabase.from('tools').select('id, name, description, image_url, duration, price_usd, price_kes, category, is_active, sort_order, remote_connect, delivery_mode, source, created_at, updated_at').order('sort_order', { ascending: true });
      setTools(data as Tool[] ?? []);
    };
    loadTools();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) setActiveTab('home');
  }, [activeTab, isAdmin]);

  const handleRent = (tool: Tool) => {
    setShowLegal(false);
    if (!user) { setAuthModal({ open: true, mode: 'login', message: 'Please log in first to rent a tool.' }); return; }
    setPaymentTool(tool);
    setPaymentModalOpen(true);
  };

  const handleTabChange = (tab: TabId) => {
    setShowLegal(false);
    if (tab === 'admin' && !isAdmin) { setAuthModal({ open: true, mode: 'login' }); return; }
    if (tab === 'rentals' && !user) { setAuthModal({ open: true, mode: 'login', message: 'Please log in first to view your rentals.' }); return; }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-400">
        <div className="w-12 h-12 border-4 border-info-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maintenanceOn = settings?.maintenance_mode === true && !isAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-dark-400">
      <Header activeTab={activeTab} onTabChange={handleTabChange} onOpenAuth={(mode) => setAuthModal({ open: true, mode })} />
      <main className="flex-1">
        {maintenanceOn ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-warning-500/10 mb-6">
              <AlertTriangle className="w-10 h-10 text-warning-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
            <p className="text-gray-400 max-w-md">We are currently performing maintenance to serve you better. Please check back shortly.</p>
          </div>
        ) : showLegal ? (
          <Legal />
        ) : (
          <>
            {activeTab === 'home' && <Home tools={tools} onRent={handleRent} />}
            {activeTab === 'rentals' && user && <MyRentals />}
            {activeTab === 'admin' && isAdmin && <AdminPanel />}
          </>
        )}
      </main>
      <Footer
        onLegal={() => { setShowLegal(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onHome={() => { setShowLegal(false); setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />
      <WhatsAppButton />
      <AuthModal open={authModal.open} mode={authModal.mode} message={authModal.message} onClose={() => setAuthModal({ ...authModal, open: false })} onSwitchMode={(mode) => setAuthModal({ open: true, mode })} />
      <PaymentModal open={paymentModalOpen} tool={paymentTool} onClose={() => { setPaymentModalOpen(false); setPaymentTool(null); }} />
    </div>
  );
}

export default function App() {
  return (<AuthProvider><AppContent /></AuthProvider>);
}
