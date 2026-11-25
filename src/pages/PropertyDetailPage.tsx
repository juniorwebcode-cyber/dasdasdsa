import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Info, MessageCircle, Share2 } from 'lucide-react';
import { CATEGORY_LABELS, type Property, type SiteSettings } from '../types/realEstate';
import { buildWhatsAppUrl } from '../utils/utm';
import { trackAnalyticsEventUnified as trackAnalyticsEvent } from '../services/adminStoreService';
import { ResilientImage } from '../components/common/ResilientImage';
import { LeadCaptureForm } from '../components/public/LeadCaptureForm';
import { PropertyCard } from '../components/public/PropertyCard';

interface PropertyDetailPageProps {
  property?: Property;
  allProperties: Property[];
  settings: SiteSettings;
  onNavigate: (path: string) => void;
  onTrackWhatsApp: (source: string) => void;
}

export function PropertyDetailPage({
  property,
  allProperties,
  settings,
  onNavigate,
  onTrackWhatsApp
}: PropertyDetailPageProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    if (property) {
      trackAnalyticsEvent({
        eventType: 'property_view',
        path: `/imovel/${property.slug}`,
        targetId: property.id
      });
    }
  }, [property?.id, property?.slug]);

  if (!property) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold text-[#18181B]">
          Imóvel não encontrado
        </h1>
        <p className="text-sm text-[#52525B]">
          Este imóvel pode ter sido atualizado ou removido do catálogo.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/comprar')}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
        >
          Voltar ao catálogo
        </button>
      </div>
    );
  }

  const gallery =
    property.gallery && property.gallery.length > 0
      ? property.gallery
      : property.coverImage
        ? [property.coverImage]
        : [];

  const similarProperties = allProperties
    .filter((p) => p.id !== property.id && p.category === property.category)
    .slice(0, 3);

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    `Olá, Patrícia! Gostaria de confirmar informações e agendar visita para o imóvel "${property.title}" (Código ${property.code}).`
  );

  const handleShare = async () => {
    const shareUrl = window.location.href;
    trackAnalyticsEvent({
      eventType: 'share_click',
      path: window.location.pathname,
      targetId: property.id
    });
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `${property.title} — Patrícia Vicente Imóveis (Sorocaba e região)`,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
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
            onClick={() => onNavigate('/comprar')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#52525B] hover:text-[#18181B] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos imóveis</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-[#E6E2DA] rounded-xl text-[#18181B] hover:border-[#1E4D5C] transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link copiado!' : 'Compartilhar imóvel'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Galeria + Descrição */}
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#F3F1EC] border border-[#E6E2DA]">
              <ResilientImage
                src={gallery[activeImageIdx] || property.coverImage}
                alt={property.title}
                fallbackTitle={property.title}
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
                    <ResilientImage src={imgUrl} alt={`${property.title} - foto ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                  <span className="font-semibold text-[#1E4D5C]">
                    {CATEGORY_LABELS[property.category]}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{property.transactionType === 'lancamento' ? 'Lançamento' : 'Venda'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Código {property.code}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-4xl font-semibold text-[#18181B]">
                  {property.title}
                </h1>
                <p className="text-sm text-[#52525B]">
                  {property.region}
                  {property.neighborhood ? ` · ${property.neighborhood}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-5 border-y border-[#E6E2DA]">
                <div>
                  <p className="text-[11px] text-[#71717A]">Dormitórios</p>
                  <p className="text-sm font-semibold text-[#18181B] tabular-nums">
                    {property.bedrooms || 'A confirmar'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#71717A]">Suítes</p>
                  <p className="text-sm font-semibold text-[#18181B] tabular-nums">
                    {property.suites || 'A confirmar'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#71717A]">Banheiros</p>
                  <p className="text-sm font-semibold text-[#18181B] tabular-nums">
                    {property.bathrooms || 'A confirmar'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#71717A]">Vagas</p>
                  <p className="text-sm font-semibold text-[#18181B] tabular-nums">
                    {property.parkingSpaces || 'A confirmar'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#71717A]">Área</p>
                  <p className="text-sm font-semibold text-[#18181B] tabular-nums">
                    {property.areaSqm || 'A confirmar'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-base font-semibold text-[#18181B]">Sobre este imóvel</h2>
                <p className="text-sm sm:text-base text-[#52525B] leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {property.features && property.features.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h2 className="text-base font-semibold text-[#18181B]">Diferenciais</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#52525B]">
                    {property.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#1E4D5C] mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {property.videos && property.videos.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h2 className="text-base font-semibold text-[#18181B]">Vídeos do imóvel</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {property.videos.map((videoUrl, idx) => (
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

              {/* Aviso obrigatório de confirmação de dados */}
              <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-[#1E4D5C] mt-0.5 shrink-0" />
                <p className="text-xs text-[#52525B] leading-relaxed">
                  {property.confirmationNote ||
                    'Valores, metragens, condições e disponibilidade estão sujeitos à confirmação pela corretora Patrícia Vicente.'}
                </p>
              </div>
            </div>
          </div>

          {/* Coluna Lateral de Conversão e Agendamento */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-[#71717A]">
                  {property.confirmationStatus === 'confirmado'
                    ? 'Valor confirmado'
                    : 'Valor sujeito à confirmação'}
                </p>
                <p className="font-display text-3xl font-semibold text-[#18181B] tabular-nums">
                  {property.priceText}
                </p>
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackWhatsApp(`property_${property.code}`)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl hover:bg-[#173c48] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar detalhes no WhatsApp</span>
              </a>
            </div>

            <LeadCaptureForm
              settings={settings}
              source={`imovel_${property.slug}`}
              defaultInterestType="agendamento_visita"
              propertyId={property.id}
              propertyTitle={property.title}
              empreendimentoId={property.empreendimentoId}
              showVisitDate
              title="Agendar visita ou solicitar ficha"
              subtitle="Receba informações confirmadas diretamente com Patrícia Vicente."
              submitLabel="Agendar visita"
            />
          </div>
        </div>

        {similarProperties.length > 0 && (
          <div className="pt-10 border-t border-[#E6E2DA] space-y-6">
            <h2 className="font-display text-2xl font-semibold text-[#18181B]">
              Outras opções semelhantes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((sim) => (
                <PropertyCard
                  key={sim.id}
                  property={sim}
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
