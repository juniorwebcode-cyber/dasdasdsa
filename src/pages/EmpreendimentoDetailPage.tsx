import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Info, MessageCircle, Share2 } from 'lucide-react';
import {
  CATEGORY_LABELS,
  type Empreendimento,
  type Property,
  type SiteSettings
} from '../types/realEstate';
import { buildWhatsAppUrl } from '../utils/utm';
import { trackAnalyticsEventUnified as trackAnalyticsEvent } from '../services/adminStoreService';
import { ResilientImage } from '../components/common/ResilientImage';
import { PropertyCard } from '../components/public/PropertyCard';
import { LeadCaptureForm } from '../components/public/LeadCaptureForm';

interface EmpreendimentoDetailPageProps {
  empreendimento?: Empreendimento;
  properties: Property[];
  settings: SiteSettings;
  onNavigate: (path: string) => void;
  onTrackWhatsApp: (source: string) => void;
}

export function EmpreendimentoDetailPage({
  empreendimento,
  properties,
  settings,
  onNavigate,
  onTrackWhatsApp
}: EmpreendimentoDetailPageProps) {
  const [copied, setCopied] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    setActiveImageIdx(0);
    if (empreendimento) {
      trackAnalyticsEvent({
        eventType: 'empreendimento_view',
        path: `/empreendimento/${empreendimento.slug}`,
        targetId: empreendimento.id
      });
    }
  }, [empreendimento?.id, empreendimento?.slug]);

  if (!empreendimento) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold text-[#18181B]">
          Empreendimento não encontrado
        </h1>
        <button
          type="button"
          onClick={() => onNavigate('/empreendimentos')}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
        >
          Ver empreendimentos
        </button>
      </div>
    );
  }

  const gallery =
    empreendimento.gallery && empreendimento.gallery.length > 0
      ? empreendimento.gallery
      : empreendimento.coverImage
        ? [empreendimento.coverImage]
        : [];
  const linkedProperties = properties.filter((p) => p.empreendimentoId === empreendimento.id);
  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    `Olá, Patrícia! Gostaria de receber informações atualizadas sobre o empreendimento "${empreendimento.name}".`
  );

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="bg-[#FAF9F6]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('/empreendimentos')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#52525B] hover:text-[#18181B] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos empreendimentos</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-[#E6E2DA] rounded-xl text-[#18181B] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link copiado!' : 'Compartilhar empreendimento'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#F3F1EC] border border-[#E6E2DA]">
              <ResilientImage
                src={gallery[activeImageIdx] || empreendimento.coverImage}
                alt={empreendimento.name}
                fallbackTitle={empreendimento.name}
              />
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`aspect-[4/3] rounded-xl overflow-hidden border transition-all cursor-pointer ${
                      activeImageIdx === idx
                        ? 'border-[#1E4D5C] ring-2 ring-[#1E4D5C]/25'
                        : 'border-[#E6E2DA] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <ResilientImage src={imgUrl} alt={`${empreendimento.name} - foto ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                  <span className="font-semibold text-[#1E4D5C]">
                    {CATEGORY_LABELS[empreendimento.category]}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{empreendimento.region}</span>
                  <span aria-hidden="true">·</span>
                  <span>{empreendimento.stage}</span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#18181B]">
                  {empreendimento.name}
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-y border-[#E6E2DA]">
                <div>
                  <p className="text-[11px] text-[#71717A]">Estágio</p>
                  <p className="text-sm font-semibold text-[#18181B]">{empreendimento.stage}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#71717A]">Previsão</p>
                  <p className="text-sm font-semibold text-[#18181B]">
                    {empreendimento.deliveryForecast || 'A confirmar'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#71717A]">Valores</p>
                  <p className="text-sm font-semibold text-[#18181B]">
                    {empreendimento.priceRangeText || 'A confirmar'}
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#52525B] leading-relaxed whitespace-pre-line">
                {empreendimento.description}
              </p>

              {empreendimento.highlights && empreendimento.highlights.length > 0 && (
                <ul className="space-y-2.5 text-sm text-[#52525B]">
                  {empreendimento.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#1E4D5C] mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}

              {empreendimento.videos && empreendimento.videos.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h2 className="text-base font-semibold text-[#18181B]">Vídeos do empreendimento</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {empreendimento.videos.map((videoUrl, idx) => (
                      <video
                        key={`${videoUrl}-${idx}`}
                        src={videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-[420px] rounded-xl bg-[#18181B] border border-[#E6E2DA]"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-[#1E4D5C] mt-0.5 shrink-0" />
                <p className="text-xs text-[#52525B] leading-relaxed">
                  Unidades disponíveis, memorial descritivo e tabela de valores estão sujeitos à
                  confirmação pela corretora Patrícia Vicente.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
              <p className="text-xs text-[#71717A]">Atendimento consultivo</p>
              <p className="font-display text-2xl font-semibold text-[#18181B]">
                Receba o material completo
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackWhatsApp(`empreendimento_${empreendimento.slug}`)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl hover:bg-[#173c48] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>

            <LeadCaptureForm
              settings={settings}
              source={`empreendimento_${empreendimento.slug}`}
              defaultInterestType="na_planta"
              empreendimentoId={empreendimento.id}
              propertyTitle={empreendimento.name}
              showVisitDate
              title="Solicitar plantas e disponibilidade"
              subtitle="Deixe seu contato para conversar com Patrícia Vicente sobre este empreendimento."
            />
          </div>
        </div>

        {linkedProperties.length > 0 && (
          <div className="pt-10 border-t border-[#E6E2DA] space-y-6">
            <h2 className="font-display text-2xl font-semibold text-[#18181B]">
              Opções relacionadas a este empreendimento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {linkedProperties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  onSelect={(slug) => onNavigate(`/imovel/${slug}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
