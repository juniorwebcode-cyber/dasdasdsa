import { useEffect, useState } from 'react';
import type { SiteSettings } from '../../types/realEstate';

const LGPD_KEY = 'pv_lgpd_cookie_consent_v1';

export function LgpdCookieBanner({
  settings,
  onNavigate
}: {
  settings: SiteSettings;
  onNavigate: (path: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LGPD_KEY);
      if (!saved) {
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try {
      localStorage.setItem(LGPD_KEY, new Date().toISOString());
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
  };

  return (
    <aside
      aria-label="Aviso de cookies e privacidade"
      className="fixed bottom-20 left-3 right-3 sm:bottom-5 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-full sm:max-w-md z-30 bg-white border border-[#E6E2DA] rounded-2xl p-4 shadow-lg"
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[#52525B] leading-relaxed">
          {settings.lgpdNoticeText}
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/privacidade')}
            className="text-xs font-medium text-[#1E4D5C] hover:underline cursor-pointer"
          >
            Política de Privacidade
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E4D5C] rounded-lg hover:bg-[#173c48] transition-colors cursor-pointer whitespace-nowrap"
          >
            Concordar e continuar
          </button>
        </div>
      </div>
    </aside>
  );
}
