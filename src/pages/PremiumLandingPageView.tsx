import { useEffect } from 'react';
import { ArrowLeft, Check, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { LandingPage, ProfessionalProfile, SiteSettings } from '../types/realEstate';
import { buildWhatsAppUrl } from '../utils/utm';
import { trackAnalyticsEventUnified as trackAnalyticsEvent } from '../services/adminStoreService';
import {
  ArchitecturalGridPattern,
  BlurTextReveal,
  FadeUpReveal,
  MagneticAction,
  NumberTicker,
  ScrollParallaxFrame,
  SpotlightCard
} from '../components/motion/MotionPrimitives';
import { ResilientImage } from '../components/common/ResilientImage';
import { LeadCaptureForm } from '../components/public/LeadCaptureForm';

interface PremiumLandingPageViewProps {
  landingPage?: LandingPage;
  settings: SiteSettings;
  profile: ProfessionalProfile;
  onNavigate: (path: string) => void;
  onTrackWhatsApp: (source: string) => void;
}

export function PremiumLandingPageView({
  landingPage,
  settings,
  profile,
  onNavigate,
  onTrackWhatsApp
}: PremiumLandingPageViewProps) {
  useEffect(() => {
    if (landingPage) {
      trackAnalyticsEvent({
        eventType: 'landing_view',
        path: `/lp/${landingPage.slug}`,
        targetId: landingPage.id
      });
    }
  }, [landingPage?.id, landingPage?.slug]);

  if (!landingPage) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold text-[#18181B]">
          Apresentação especial indisponível
        </h1>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    `Olá, Patrícia! Acessei a página "${landingPage.title}" e gostaria de conversar sobre as opções em Sorocaba e região.`
  );

  const gallery =
    landingPage.gallery && landingPage.gallery.length > 0
      ? landingPage.gallery
      : landingPage.heroImage
        ? [landingPage.heroImage]
        : [];

  return (
    <div className="bg-[#FAF9F6] text-[#18181B]">
      {/* Hero Arquitetônico com Luz Natural e Tipografia Cinética */}
      <section className="relative overflow-hidden border-b border-[#E6E2DA]">
        <ArchitecturalGridPattern />
        <div className="relative max-w-[1280px] mx-auto px-5 sm:px-8 pt-10 pb-16 sm:pt-14 sm:pb-24 space-y-10">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Patrícia Vicente</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              {landingPage.heroKicker ? (
                <p className="text-xs font-medium text-[#1E4D5C]">{landingPage.heroKicker}</p>
              ) : null}

              <BlurTextReveal
                text={landingPage.heroTitle}
                className="font-display text-[clamp(2.2rem,4.3vw,3.75rem)] font-semibold leading-[1.1] tracking-tight text-[#18181B]"
              />

              {landingPage.heroSubtitle ? (
                <p className="text-base sm:text-lg text-[#52525B] leading-relaxed max-w-2xl">
                  {landingPage.heroSubtitle}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <MagneticAction>
                  <a
                    href="#atendimento-lp"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl hover:bg-[#173c48] transition-colors"
                  >
                    <span>{landingPage.heroCtaLabel}</span>
                  </a>
                </MagneticAction>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackWhatsApp(`lp_${landingPage.slug}`)}
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-[#18181B] bg-white border border-[#E6E2DA] rounded-xl hover:border-[#1E4D5C] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#1E4D5C]" />
                  <span>WhatsApp direto</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-[#E6E2DA] bg-[#F3F1EC] shadow-[0_20px_50px_-20px_rgba(24,24,27,0.12)]">
                <ScrollParallaxFrame offset={28} className="w-full h-full">
                  <ResilientImage
                    src={landingPage.heroImage}
                    alt={landingPage.title}
                    fallbackTitle={landingPage.title}
                  />
                </ScrollParallaxFrame>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tese Técnica + Métrica de Experiência */}
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <FadeUpReveal className="lg:col-span-4 bg-white border border-[#E6E2DA] rounded-2xl p-8 space-y-3">
            <p className="text-xs font-medium text-[#1E4D5C]">Base Técnica Real</p>
            <p className="font-display text-5xl font-semibold text-[#18181B]">
              <NumberTicker value={profile.yearsConstruction || 10} suffix=" anos" />
            </p>
            <p className="text-sm text-[#52525B] leading-relaxed">
              de vivência na construção civil antes de ajudar você a escolher seu imóvel em{' '}
              {profile.serviceRegion}.
            </p>
          </FadeUpReveal>

          <FadeUpReveal delay={0.08} className="lg:col-span-8 space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#18181B] text-balance">
              Por que olhar o imóvel com quem já acompanhou obras de perto
            </h2>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed whitespace-pre-line">
              {landingPage.architecturalThesis}
            </p>
          </FadeUpReveal>
        </div>

        {/* Highlights Bento Grid */}
        {landingPage.highlights && landingPage.highlights.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {landingPage.highlights.map((item, index) => (
              <SpotlightCard key={index} className="p-6 sm:p-7">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="space-y-3"
                >
                  <Check className="w-5 h-5 text-[#1E4D5C]" />
                  <p className="text-base font-medium text-[#18181B] leading-relaxed">{item}</p>
                </motion.div>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      {/* Galeria Editorial com Parallax */}
      {gallery.length > 0 && (
        <section className="bg-[#F3F1EC] border-y border-[#E6E2DA] py-16">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#1E4D5C]">Atmosfera & Arquitetura</p>
              <h2 className="font-display text-3xl font-semibold text-[#18181B]">
                Ambientes pensados para viver bem
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gallery.map((img, i) => (
                <div
                  key={`${img}-${i}`}
                  className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#E6E2DA] bg-white"
                >
                  <ResilientImage src={img} alt={`${landingPage.title} ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Conversão Final Otimizada */}
      <section id="atendimento-lp" className="max-w-[1000px] mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <LeadCaptureForm
          settings={settings}
          source={`lp_${landingPage.slug}`}
          defaultInterestType="landing_page"
          propertyId={landingPage.targetType === 'property' ? landingPage.targetId : undefined}
          empreendimentoId={
            landingPage.targetType === 'empreendimento' ? landingPage.targetId : undefined
          }
          propertyTitle={landingPage.title}
          showVisitDate
          title={landingPage.formTitle || 'Solicite atendimento personalizado'}
          subtitle="Preencha para confirmar detalhes, plantas e agenda de visitas diretamente com Patrícia Vicente."
          submitLabel="Quero conversar com a Patrícia"
        />
      </section>
    </div>
  );
}
