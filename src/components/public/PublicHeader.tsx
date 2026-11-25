import { useState } from 'react';
import { Lock, Menu, MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { SiteSettings } from '../../types/realEstate';
import { buildWhatsAppUrl } from '../../utils/utm';
import { ASSET_IMAGES } from '../../lib/seedDefaults';
import { cn } from '../../utils/cn';

interface PublicHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  settings: SiteSettings;
  onTrackWhatsApp: (source: string) => void;
}

const NAV_ITEMS = [
  { label: 'Início', path: '/' },
  { label: 'Comprar', path: '/comprar' },
  { label: 'Na Planta', path: '/na-planta' },
  { label: 'Prontos', path: '/prontos' },
  { label: 'Condomínios', path: '/condominios' },
  { label: 'Sobre', path: '/sobre' },
  { label: 'Contato', path: '/contato' }
];

export function PublicHeader({
  currentPath,
  onNavigate,
  settings,
  onTrackWhatsApp
}: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState(settings.logoUrl || ASSET_IMAGES.brandLogo);
  const [logoFailed, setLogoFailed] = useState(false);

  const activeLogoSrc =
    settings.logoUrl && settings.logoUrl !== logoSrc && !logoFailed ? settings.logoUrl : logoSrc;

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    settings.whatsappDefaultMessage
  );

  const handleLinkClick = (path: string) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E6E2DA]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-20 sm:h-[88px] flex items-center justify-between gap-6">
        {/* Zone 1: Brand Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('/');
          }}
          className="whitespace-nowrap shrink-0 flex items-center focus-visible:outline-2 focus-visible:outline-[#1E4D5C] rounded-lg"
        >
          {activeLogoSrc && !logoFailed ? (
            <>
              <img
                src={activeLogoSrc}
                alt={`${settings.brandName} — Corretora de Imóveis`}
                referrerPolicy="no-referrer"
                onError={() => {
                  if (activeLogoSrc !== ASSET_IMAGES.brandLogoFallback) {
                    setLogoSrc(ASSET_IMAGES.brandLogoFallback);
                  } else {
                    setLogoFailed(true);
                  }
                }}
                className="h-14 sm:h-[66px] w-auto object-contain drop-shadow-[0_1px_2px_rgba(24,24,27,0.08)]"
              />
              <span className="sr-only">{settings.brandName}</span>
            </>
          ) : (
            <span className="font-display text-xl sm:text-[22px] font-semibold tracking-tight text-[#18181B]">
              {settings.brandName}
            </span>
          )}
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#52525B]"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.path === '/'
                ? currentPath === '/'
                : currentPath === item.path || currentPath.startsWith(`${item.path}/`);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.path);
                }}
                className={cn(
                  'relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150',
                  active ? 'text-[#18181B] font-semibold' : 'hover:text-[#18181B]'
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full"
                    style={{ backgroundColor: settings.primaryColor || '#1E4D5C' }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Painel + Primary CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/admin');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#52525B] bg-white border border-[#E6E2DA] rounded-lg hover:border-[#1E4D5C] hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0"
          >
            <Lock className="w-3 h-3" />
            <span>Painel</span>
          </a>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackWhatsApp('header')}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-transform duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 shadow-sm"
            style={{ backgroundColor: settings.primaryColor || '#1E4D5C' }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Fale comigo</span>
          </a>

          <button
            type="button"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E6E2DA] bg-white text-[#18181B] hover:bg-[#F3F1EC] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Modern Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-[#FAF9F6] border-b border-[#E6E2DA] px-5 py-5"
          >
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = currentPath === item.path;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(item.path);
                    }}
                    className={cn(
                      'px-3 py-3 rounded-xl text-base font-medium transition-colors',
                      active
                        ? 'bg-white text-[#18181B] border border-[#E6E2DA]'
                        : 'text-[#52525B] hover:bg-[#F3F1EC]'
                    )}
                  >
                    {item.label}
                  </a>
                );
              })}
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick('/admin');
                }}
                className="px-3 py-3 rounded-xl text-base font-medium text-[#52525B] hover:bg-[#F3F1EC] inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Painel</span>
              </a>
            </nav>
            <div className="mt-4 pt-4 border-t border-[#E6E2DA]">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onTrackWhatsApp('mobile_menu');
                  setMobileOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white rounded-xl"
                style={{ backgroundColor: settings.primaryColor || '#1E4D5C' }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Fale comigo no WhatsApp</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
