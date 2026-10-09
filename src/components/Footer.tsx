import { useAuth } from '@/context/AuthContext';
import { Scale } from 'lucide-react';

export default function Footer({ onLegal, onHome }: { onLegal?: () => void; onHome?: () => void }) {
  const { settings, profile } = useAuth();
  const nameParts = profile?.full_name?.trim().split(/\s+/) || [];
  const userName = nameParts[nameParts.length - 1] || '';
  const poweredBy = settings?.footer_text || 'Kingz Techz';

  return (
    <footer className="bg-dark-500/60 border-t border-dark-50 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-7 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <button
          onClick={onLegal}
          className="flex w-fit items-center gap-2 rounded-lg py-2 text-sm text-gray-400 transition-colors hover:text-info-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500"
        >
          <Scale className="w-3.5 h-3.5" /> Terms and Conditions
        </button>
        <p className="max-w-full text-left text-sm leading-relaxed text-gray-400 sm:text-right">
          © 2026 {userName && `${userName}. `}Powered by{' '}
          <button type="button" onClick={onHome} className="font-semibold text-info-500 hover:text-info-400 transition-colors">{poweredBy}</button>.
        </p>
        </div>
      </div>
    </footer>
  );
}
