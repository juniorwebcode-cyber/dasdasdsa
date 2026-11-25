import { useState } from 'react';
import { Instagram, Lock, MessageCircle } from 'lucide-react';
import type { LandingPage, ProfessionalProfile, SiteSettings } from '../../types/realEstate';
import { ASSET_IMAGES } from '../../lib/seedDefaults';
import { buildWhatsAppUrl } from '../../utils/utm';

interface PublicFooterProps {
  settings: SiteSettings;
  profile: ProfessionalProfile;
  premiumLanding?: LandingPage;
  onNavigate: (path: string) => void;
  onTrackWhatsApp: (source: string) => void;
}

export function PublicFooter({
  settings,
  profile,
  premiumLanding,
  onNavigate,
  onTrackWhatsApp
}: PublicFooterProps) {
  const [logoSrc, setLogoSrc] = useState(settings.logoUrl || ASSET_IMAGES.brandLogo);
  const [logoFailed, setLogoFailed] = useState(false);

  const activeLogoSrc =
    settings.logoUrl && settings.logoUrl !== logoSrc && !logoFailed ? settings.logoUrl : logoSrc;

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    settings.whatsappDefaultMessage
  );

  return (
    <footer className="bg-[#F3F1EC] border-t border-[#E6E2DA] text-[#18181B]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#E6E2DA]">
          <div className="md:col-span-5 space-y-4">
            {activeLogoSrc && !logoFailed ? (
              <div>
                <img
                  src={activeLogoSrc}
                  alt={`${profile.fullName} — Corretora de Imóveis`}
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (activeLogoSrc !== ASSET_IMAGES.brandLogoFallback) {
                      setLogoSrc(ASSET_IMAGES.brandLogoFallback);
                    } else {
                      setLogoFailed(true);
                    }
                  }}
                  className="h-24 sm:h-28 w-auto object-contain drop-shadow-[0_1px_3px_rgba(24,24,27,0.08)]"
                />
                <h2 className="sr-only">{profile.fullName}</h2>
              </div>
            ) : (
              <h2 className="font-display text-2xl font-semibold text-[#18181B]">
                {profile.fullName}
              </h2>
            )}
            <p className="text-sm text-[#52525B] leading-relaxed max-w-md">
              {profile.institutionalBio}
            </p>
            <div className="pt-2 text-xs text-[#71717A] space-y-1">
              <p>
                Atuação: <span className="text-[#18181B] font-medium">{profile.serviceRegion}</span>
              </p>
              <p>
                CRECI:{' '}
                <span className="text-[#18181B] font-medium">
                  {profile.creciStatus === 'confirmado' && profile.creciNumber
                    ? profile.creciNumber
                    : 'A confirmar pela corretora'}
                </span>
              </p>
              {profile.commercialEmailStatus === 'confirmado' && profile.commercialEmail ? (
                <p>
                  E-mail: <span className="text-[#18181B] font-medium">{profile.commercialEmail}</span>
                </p>
              ) : null}
              {profile.commercialAddressStatus === 'confirmado' && profile.commercialAddress ? (
                <p>
                  Endereço:{' '}
                  <span className="text-[#18181B] font-medium">{profile.commercialAddress}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-[#71717A]">
              Navegação
            </h3>
            <ul className="space-y-2.5 text-sm text-[#52525B]">
              {[
                { label: 'Início', path: '/' },
                { label: 'Todos os Imóveis', path: '/comprar' },
                { label: 'Na Planta', path: '/na-planta' },
                { label: 'Prontos', path: '/prontos' },
                { label: 'Condomínios', path: '/condominios' },
                { label: 'Empreendimentos', path: '/empreendimentos' },
                { label: 'Sobre Patrícia Vicente', path: '/sobre' },
                { label: 'Contato e Visitas', path: '/contato' }
              ].map((link) => (
                <li key={link.path}>
                  <a
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(link.path);
                    }}
                    className="hover:text-[#18181B] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {premiumLanding && (
                <li>
                  <a
                    href={`/lp/${premiumLanding.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/lp/${premiumLanding.slug}`);
                    }}
                    className="font-medium text-[#1E4D5C] hover:underline"
                  >
                    Apresentação Especial
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h3 className="text-xs font-semibold tracking-wide text-[#71717A]">
              Atendimento Direto
            </h3>
            <div className="space-y-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackWhatsApp('footer')}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[#E6E2DA] text-sm font-medium text-[#18181B] hover:border-[#1E4D5C] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#1E4D5C]" />
                <span>WhatsApp · (15) 99846-5635</span>
              </a>

              <div>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#52525B] hover:text-[#18181B] transition-colors"
                >
                  <Instagram className="w-4 h-4 text-[#1E4D5C]" />
                  <span>{profile.instagramHandle}</span>
                </a>
              </div>
            </div>

            <p className="text-xs text-[#71717A] leading-relaxed pt-2">
              Informações, metragens, valores e disponibilidade de unidades estão sujeitos à
              confirmação junto à corretora e proprietários/incorporadoras.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#71717A]">
          <p>
            © {new Date().getFullYear()} {profile.fullName} · {profile.serviceRegion}
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href="/privacidade"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/privacidade');
              }}
              className="hover:text-[#18181B] transition-colors"
            >
              Privacidade e LGPD
            </a>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/admin');
              }}
              className="inline-flex items-center gap-1.5 text-[#71717A] hover:text-[#18181B] transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>Painel Admin</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
