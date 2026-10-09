import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function WhatsAppButton() {
  const { settings } = useAuth();
  const whatsapp = settings?.whatsapp_number || '0752000550';
  const waLink = `https://wa.me/254${whatsapp.replace(/^0/, '')}`;

  return (
    <a href={waLink} target="_blank" rel="noopener noreferrer"
      className="fixed bottom-3 right-3 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-success-500 shadow-lg hover:bg-success-600 hover:scale-110 transition-all duration-300 animate-pulse-glow sm:bottom-5 sm:right-5 sm:w-12 sm:h-12"
      aria-label="WhatsApp Support">
      <MessageCircle className="w-5 h-5 text-white sm:w-6 sm:h-6" />
    </a>
  );
}
