import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, MessageCircle, Search, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  Empreendimento,
  LandingPage,
  ProfessionalProfile,
  Property,
  SiteSettings
} from '../types/realEstate';
import { buildWhatsAppUrl } from '../utils/utm';
import {
  BlurTextReveal,
  FadeUpReveal,
  MagneticAction,
  NumberTicker
} from '../components/motion/MotionPrimitives';
import { ResilientImage } from '../components/common/ResilientImage';
import { PropertyCard } from '../components/public/PropertyCard';
import { EmpreendimentoCard } from '../components/public/EmpreendimentoCard';
import { LeadCaptureForm } from '../components/public/LeadCaptureForm';

interface HomePageProps {
  settings: SiteSettings;
  profile: ProfessionalProfile;
  properties: Property[];
  empreendimentos: Empreendimento[];
  premiumLanding?: LandingPage;
  onNavigate: (path: string) => void;
  onTrackWhatsApp: (source: string) => void;
}

export function HomePage({
  settings,
  profile,
  properties,
  empreendimentos,
  premiumLanding,
  onNavigate,
  onTrackWhatsApp
}: HomePageProps) {
  const [quickCategory, setQuickCategory] = useState<string>('todos');
  const [quickRegion, setQuickRegion] = useState<string>('');
  const [quickQuery, setQuickQuery] = useState<string>('');
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  const heroSlides = useMemo(() => {
    const slides: { url: string; title: string; slug?: string }[] = [];
    const seen = new Set<string>();

    properties.forEach((prop) => {
      const candidates = [prop.coverImage, ...(prop.gallery || [])].filter(
        (u): u is string => Boolean(u && u.trim())
      );
      candidates.forEach((url) => {
        if (!seen.has(url)) {
          seen.add(url);
          slides.push({ url, title: prop.title, slug: prop.slug });
        }
      });
    });

    if (slides.length === 0 && settings.heroImageUrl) {
      slides.push({ url: settings.heroImageUrl, title: 'Sorocaba e região' });
    }
    return slides;
  }, [properties, settings.heroImageUrl]);

  useEffect(() => {
    setHeroSlideIdx(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const activeSlide = heroSlides[heroSlideIdx] || heroSlides[0];

  const featuredProperties = properties.filter((p) => p.featured).slice(0, 3);
  const displayProperties =
    featuredProperties.length > 0 ? featuredProperties : properties.slice(0, 3);
  const displayEmpreendimentos = empreendimentos.slice(0, 2);

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    settings.whatsappDefaultMessage
  );

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (quickCategory && quickCategory !== 'todos') params.set('tipo', quickCategory);
    if (quickRegion.trim()) params.set('regiao', quickRegion.trim());
    if (quickQuery.trim()) params.set('q', quickQuery.trim());
    const qs = params.toString();
    onNavigate(`/comprar${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="bg-[#FAF9F6]">
      {/* 1. HERO PREMIUM COM FUNDO ANIMADO DAS FOTOS DOS IMÓVEIS */}
      <section className="relative overflow-hidden border-b border-[#E6E2DA] bg-[#F3F1EC]">
        {/* Camada de fundo: transição suave das fotos dos imóveis cadastrados */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          <AnimatePresence mode="sync">
            {activeSlide ? (
              <motion.img
                key={activeSlide.url}
                src={activeSlide.url}
                alt={activeSlide.title}
                referrerPolicy="no-referrer"
                initial={{ opacity: 0, scale: 1.07 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 1.15, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 6.2, ease: 'linear' }
                }}
                className="absolute inset-0 w-full h-full object-cover will-change-transform"
              />
            ) : null}
          </AnimatePresence>
          {/* Véu claro luminoso garantindo contraste WCAG e tema claro obrigatório */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF9F6]/95 via-[#FAF9F6]/84 to-[#FAF9F6]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6]/90 via-transparent to-[#FAF9F6]/45" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20">
          <div className="max-w-3xl flex flex-col justify-center space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#1E4D5C]">
              <span>{profile.serviceRegion}</span>
              <span aria-hidden="true">·</span>
              <span>Plantas</span>
              <span aria-hidden="true">·</span>
              <span>Prontos</span>
              <span aria-hidden="true">·</span>
              <span>Condomínios</span>
            </div>

            <BlurTextReveal
              text={settings.heroTitle}
              className="font-display text-[clamp(2.25rem,4.3vw,3.75rem)] font-semibold leading-[1.1] tracking-tight text-[#18181B]"
            />

            <p className="text-base sm:text-lg text-[#3F3F46] leading-relaxed max-w-xl">
              {settings.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <MagneticAction>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackWhatsApp('hero')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-transform active:scale-[0.98] whitespace-nowrap"
                  style={{ backgroundColor: settings.primaryColor || '#1E4D5C' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Fale comigo no WhatsApp</span>
                </a>
              </MagneticAction>

              <button
                type="button"
                onClick={() => onNavigate('/comprar')}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-[#18181B] bg-white/90 backdrop-blur-sm border border-[#E6E2DA] rounded-xl hover:border-[#1E4D5C] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Explorar imóveis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Indicadores discretos das fotos dos imóveis no fundo */}
          {heroSlides.length > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={`${slide.url}-${idx}`}
                    type="button"
                    aria-label={`Ver foto ${idx + 1}: ${slide.title}`}
                    onClick={() => setHeroSlideIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === heroSlideIdx
                        ? 'w-8 bg-[#1E4D5C]'
                        : 'w-2.5 bg-[#18181B]/20 hover:bg-[#18181B]/40'
                    }`}
                  />
                ))}
              </div>

              {activeSlide?.slug ? (
                <button
                  type="button"
                  onClick={() => onNavigate(`/imovel/${activeSlide.slug}`)}
                  className="text-xs font-medium text-[#18181B]/80 hover:text-[#1E4D5C] bg-white/75 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#E6E2DA] transition-colors cursor-pointer"
                >
                  Em cena: {activeSlide.title} →
                </button>
              ) : null}
            </div>
          )}

          {/* Busca Rápida em Faixa Completa Abaixo do Hero */}
          <form
            onSubmit={handleQuickSearch}
            className="mt-10 bg-white border border-[#E6E2DA] rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end shadow-[0_8px_24px_-12px_rgba(24,24,27,0.06)]"
          >
            <label className="lg:col-span-3 block space-y-1.5">
              <span className="text-xs font-medium text-[#71717A]">Categoria</span>
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] focus:outline-none focus:border-[#1E4D5C]"
              >
                <option value="todos">Todas as categorias</option>
                <option value="na_planta">Na Planta</option>
                <option value="pronto">Prontos</option>
                <option value="condominio">Condomínios</option>
              </select>
            </label>

            <label className="lg:col-span-3 block space-y-1.5">
              <span className="text-xs font-medium text-[#71717A]">Região</span>
              <input
                type="text"
                value={quickRegion}
                onChange={(e) => setQuickRegion(e.target.value)}
                placeholder="Sorocaba, Votorantim, região..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1E4D5C]"
              />
            </label>

            <label className="lg:col-span-4 block space-y-1.5">
              <span className="text-xs font-medium text-[#71717A]">Palavra-chave</span>
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Ex: condomínio, apartamento, lançamento..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1E4D5C]"
              />
            </label>

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: settings.primaryColor || '#1E4D5C' }}
              >
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. IMÓVEIS EM DESTAQUE */}
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <FadeUpReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#E6E2DA]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#1E4D5C]">
              Imóveis em Sorocaba e região
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#18181B] text-balance">
              Imóveis na planta, prontos e condomínios
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/comprar')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E4D5C] hover:underline cursor-pointer whitespace-nowrap"
          >
            <span>Ver catálogo completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </FadeUpReveal>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onSelect={(slug) => onNavigate(`/imovel/${slug}`)}
            />
          ))}
        </div>

        <p className="mt-6 text-xs text-[#71717A]">
          Nota de transparência: itens sinalizados como “A confirmar” têm valores, metragens e
          disponibilidade confirmados individualmente com Patrícia Vicente antes da proposta.
        </p>
      </section>

      {/* 3. SEÇÃO 10 ANOS NA CONSTRUÇÃO CIVIL */}
      <section className="bg-[#F3F1EC] border-y border-[#E6E2DA]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[460px] rounded-2xl overflow-hidden border border-[#E6E2DA] bg-white shadow-[0_12px_32px_-16px_rgba(24,24,27,0.12)]">
                <ResilientImage
                  src={profile.portraitUrl}
                  alt="Patrícia Vicente — Corretora de Imóveis em Sorocaba e região"
                  fallbackTitle="Patrícia Vicente — Construção Civil e Imóveis"
                  className="w-full h-auto object-contain block"
                />
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-medium text-[#1E4D5C]">
                  <span>Trajetória & Olhar Técnico</span>
                  <span aria-hidden="true">·</span>
                  <span>Obras & Atendimento</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#18181B] leading-tight text-balance">
                  <NumberTicker value={profile.yearsConstruction || 10} /> anos na construção civil
                  aplicados à escolha do seu lar
                </h2>

                <p className="text-base text-[#52525B] leading-relaxed">
                  {profile.constructionStory}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#E6E2DA]">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#18181B]">
                    01. Leitura real de planta
                  </p>
                  <p className="text-xs text-[#52525B] leading-relaxed">
                    Análise clara de circulação, iluminação natural, posição solar e proporção de
                    ambientes.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#18181B]">
                    02. Critério de acabamento
                  </p>
                  <p className="text-xs text-[#52525B] leading-relaxed">
                    Observação prática de materiais, instalações e padrão construtivo em obras e
                    prontos.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#18181B]">
                    03. Acompanhamento próximo
                  </p>
                  <p className="text-xs text-[#52525B] leading-relaxed">
                    Conversa direta, transparente e sem pressa em Sorocaba e região.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EMPREENDIMENTOS & LANDING PAGE PREMIUM */}
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16 sm:py-20 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6E2DA]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#1E4D5C]">Empreendimentos & Roteiros</p>
            <h2 className="font-display text-3xl font-semibold text-[#18181B]">
              Seleção de empreendimentos em Sorocaba e região
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/empreendimentos')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E4D5C] hover:underline cursor-pointer whitespace-nowrap"
          >
            <span>Ver todos os empreendimentos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayEmpreendimentos.map((emp) => (
            <EmpreendimentoCard
              key={emp.id}
              empreendimento={emp}
              onSelect={(slug) => onNavigate(`/empreendimento/${slug}`)}
            />
          ))}
        </div>

        {premiumLanding && (
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E4D5C]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apresentação Especial</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#18181B] text-balance">
                {premiumLanding.title}
              </h3>
              <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                {premiumLanding.heroSubtitle}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate(`/lp/${premiumLanding.slug}`)}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: settings.primaryColor || '#1E4D5C' }}
                >
                  <span>Acessar página especial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 aspect-[16/10] rounded-xl overflow-hidden bg-[#F3F1EC] border border-[#E6E2DA]">
              <ResilientImage
                src={premiumLanding.heroImage}
                alt={premiumLanding.title}
                fallbackTitle={premiumLanding.title}
              />
            </div>
          </div>
        )}
      </section>

      {/* 5. SOBRE PATRÍCIA VICENTE + CONTATO FINAL */}
      <section className="bg-white border-t border-[#E6E2DA]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-[#1E4D5C]">Sobre a Corretora</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#18181B]">
                {profile.fullName}
              </h2>
              <p className="text-base text-[#52525B] leading-relaxed">
                {profile.institutionalBio}
              </p>
            </div>

            <ul className="space-y-3 text-sm text-[#52525B]">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#1E4D5C] mt-0.5 shrink-0" />
                <span>Atuação dedicada em {profile.serviceRegion}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#1E4D5C] mt-0.5 shrink-0" />
                <span>Imóveis na planta, prontos e em condomínios</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#1E4D5C] mt-0.5 shrink-0" />
                <span>Atendimento direto pelo WhatsApp (15) 99846-5635</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/sobre')}
                className="text-sm font-semibold text-[#1E4D5C] hover:underline cursor-pointer"
              >
                Conhecer história completa →
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <LeadCaptureForm
              settings={settings}
              source="home_contato"
              defaultInterestType="contato"
              showVisitDate
              title="Vamos conversar sobre o imóvel que você procura?"
              subtitle="Envie suas preferências ou agende uma visita em Sorocaba e região. Retorno pessoal da Patrícia Vicente."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
