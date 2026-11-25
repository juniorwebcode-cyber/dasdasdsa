import { useCallback, useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { testConnection } from './lib/firebase';
import {
  DEFAULT_EMPREENDIMENTOS,
  DEFAULT_LANDING_PAGE,
  DEFAULT_PROFESSIONAL_PROFILE,
  DEFAULT_PROPERTIES,
  DEFAULT_SITE_SETTINGS
} from './lib/seedDefaults';
import {
  getPublicSnapshotUnified,
  trackAnalyticsEventUnified
} from './services/adminStoreService';
import type {
  Empreendimento,
  LandingPage,
  ProfessionalProfile,
  Property,
  SiteSettings
} from './types/realEstate';
import { captureUtmFromLocation } from './utils/utm';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SeoHead } from './components/common/SeoHead';
import { ScrollProgressLine } from './components/motion/MotionPrimitives';
import { PublicHeader } from './components/public/PublicHeader';
import { PublicFooter } from './components/public/PublicFooter';
import { LgpdCookieBanner } from './components/public/LgpdCookieBanner';
import { FloatingSocialAndAssistant } from './components/public/FloatingSocialAndAssistant';
import { CinematicIntro } from './components/public/CinematicIntro';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { EmpreendimentoDetailPage } from './pages/EmpreendimentoDetailPage';
import { PremiumLandingPageView } from './pages/PremiumLandingPageView';
import { AboutPage, ContactPage, PrivacyLgpdPage } from './pages/StaticPages';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [introDone, setIntroDone] = useState<boolean>(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [profile, setProfile] = useState<ProfessionalProfile>(DEFAULT_PROFESSIONAL_PROFILE);
  const [properties, setProperties] = useState<Property[]>(DEFAULT_PROPERTIES);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>(DEFAULT_EMPREENDIMENTOS);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([DEFAULT_LANDING_PAGE]);

  const loadPublicData = useCallback(async () => {
    const snap = await getPublicSnapshotUnified();
    setSettings(snap.siteSettings);
    setProfile(snap.professionalProfile);
    setProperties(snap.properties);
    setEmpreendimentos(snap.empreendimentos);
    setLandingPages(snap.landingPages);
  }, []);

  useEffect(() => {
    testConnection();
    captureUtmFromLocation();
    loadPublicData();
  }, [loadPublicData]);

  useEffect(() => {
    if (!pathname.startsWith('/admin')) {
      loadPublicData();
    }
  }, [pathname, loadPublicData]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/');
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((targetPath: string) => {
    const cleanTarget = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    window.history.pushState({}, '', cleanTarget);
    setPathname(cleanTarget.split('?')[0] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTrackWhatsApp = useCallback((source: string) => {
    const utms = captureUtmFromLocation();
    trackAnalyticsEventUnified({
      eventType: 'whatsapp_click',
      path: window.location.pathname,
      source,
      utmSource: utms.utmSource || undefined,
      utmMedium: utms.utmMedium || undefined,
      utmCampaign: utms.utmCampaign || undefined
    });
  }, []);

  useEffect(() => {
    if (!pathname.startsWith('/admin')) {
      const utms = captureUtmFromLocation();
      trackAnalyticsEventUnified({
        eventType: 'page_view',
        path: pathname,
        utmSource: utms.utmSource || undefined,
        utmMedium: utms.utmMedium || undefined,
        utmCampaign: utms.utmCampaign || undefined
      });
    }
  }, [pathname]);

  const premiumLanding = useMemo(
    () =>
      landingPages.find((lp) => lp.isPremiumShowcase && lp.published) ||
      landingPages.find((lp) => lp.published) ||
      DEFAULT_LANDING_PAGE,
    [landingPages]
  );

  // Route matching
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const propertySlug = pathname.startsWith('/imovel/') ? pathname.replace('/imovel/', '') : '';
  const empSlug = pathname.startsWith('/empreendimento/')
    ? pathname.replace('/empreendimento/', '')
    : '';
  const lpSlug = pathname.startsWith('/lp/') ? pathname.replace('/lp/', '') : '';

  const activeProperty = propertySlug
    ? properties.find((p) => p.slug === propertySlug || p.id === propertySlug)
    : undefined;
  const activeEmpreendimento = empSlug
    ? empreendimentos.find((e) => e.slug === empSlug || e.id === empSlug)
    : undefined;
  const activeLandingPage = lpSlug
    ? landingPages.find((l) => l.slug === lpSlug || l.id === lpSlug) || premiumLanding
    : undefined;

  const seoMeta = useMemo(() => {
    if (isAdminRoute) {
      return {
        title: 'Painel Administrativo & CRM | Patrícia Vicente',
        description: 'Área privada de gestão imobiliária e CRM de Patrícia Vicente.'
      };
    }
    if (activeProperty) {
      return {
        title: `${activeProperty.title} | Patrícia Vicente Imóveis`,
        description:
          activeProperty.description?.slice(0, 155) || settings.seoDescription,
        ogImage: activeProperty.coverImage
      };
    }
    if (activeEmpreendimento) {
      return {
        title: `${activeEmpreendimento.name} | Patrícia Vicente Imóveis`,
        description:
          activeEmpreendimento.description?.slice(0, 155) || settings.seoDescription,
        ogImage: activeEmpreendimento.coverImage
      };
    }
    if (activeLandingPage) {
      return {
        title: activeLandingPage.seoTitle || activeLandingPage.title,
        description: activeLandingPage.seoDescription || settings.seoDescription,
        ogImage: activeLandingPage.heroImage
      };
    }
    return {
      title: settings.seoTitle,
      description: settings.seoDescription,
      ogImage: settings.heroImageUrl
    };
  }, [
    isAdminRoute,
    activeProperty,
    activeEmpreendimento,
    activeLandingPage,
    settings
  ]);

  // Apply light theme CSS tokens dynamically from Firestore siteSettings
  useEffect(() => {
    const root = document.documentElement;
    if (settings.primaryColor) root.style.setProperty('--pv-primary', settings.primaryColor);
    if (settings.accentColor) root.style.setProperty('--pv-accent', settings.accentColor);
    if (settings.backgroundColor) root.style.setProperty('--pv-bg', settings.backgroundColor);
  }, [settings]);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <SeoHead
          title={seoMeta.title}
          description={seoMeta.description}
          ogImage={seoMeta.ogImage}
          settings={settings}
        />

        {!isAdminRoute && !introDone ? (
          <CinematicIntro
            brokerName={profile.fullName}
            onComplete={() => setIntroDone(true)}
          />
        ) : null}

        {isAdminRoute ? (
          <AdminDashboard
            settings={settings}
            profile={profile}
            onNavigate={navigate}
            onPublicDataChanged={loadPublicData}
          />
        ) : (
          <div
            className="min-h-screen flex flex-col text-[#18181B]"
            style={{ backgroundColor: settings.backgroundColor || '#FAF9F6' }}
          >
            <ScrollProgressLine />
            <PublicHeader
              currentPath={pathname}
              onNavigate={navigate}
              settings={settings}
              onTrackWhatsApp={handleTrackWhatsApp}
            />

            <main className="flex-1">
              {pathname === '/' && (
                <HomePage
                  settings={settings}
                  profile={profile}
                  properties={properties}
                  empreendimentos={empreendimentos}
                  premiumLanding={premiumLanding}
                  onNavigate={navigate}
                  onTrackWhatsApp={handleTrackWhatsApp}
                />
              )}

              {pathname === '/comprar' && (
                <CatalogPage
                  mode="all"
                  properties={properties}
                  empreendimentos={empreendimentos}
                  settings={settings}
                  onNavigate={navigate}
                />
              )}

              {pathname === '/na-planta' && (
                <CatalogPage
                  mode="na_planta"
                  properties={properties}
                  empreendimentos={empreendimentos}
                  settings={settings}
                  onNavigate={navigate}
                />
              )}

              {pathname === '/prontos' && (
                <CatalogPage
                  mode="pronto"
                  properties={properties}
                  empreendimentos={empreendimentos}
                  settings={settings}
                  onNavigate={navigate}
                />
              )}

              {pathname === '/condominios' && (
                <CatalogPage
                  mode="condominio"
                  properties={properties}
                  empreendimentos={empreendimentos}
                  settings={settings}
                  onNavigate={navigate}
                />
              )}

              {pathname === '/empreendimentos' && (
                <CatalogPage
                  mode="empreendimentos"
                  properties={properties}
                  empreendimentos={empreendimentos}
                  settings={settings}
                  onNavigate={navigate}
                />
              )}

              {propertySlug && (
                <PropertyDetailPage
                  property={activeProperty}
                  allProperties={properties}
                  settings={settings}
                  onNavigate={navigate}
                  onTrackWhatsApp={handleTrackWhatsApp}
                />
              )}

              {empSlug && (
                <EmpreendimentoDetailPage
                  empreendimento={activeEmpreendimento}
                  properties={properties}
                  settings={settings}
                  onNavigate={navigate}
                  onTrackWhatsApp={handleTrackWhatsApp}
                />
              )}

              {lpSlug && (
                <PremiumLandingPageView
                  landingPage={activeLandingPage}
                  settings={settings}
                  profile={profile}
                  onNavigate={navigate}
                  onTrackWhatsApp={handleTrackWhatsApp}
                />
              )}

              {pathname === '/sobre' && (
                <AboutPage
                  profile={profile}
                  settings={settings}
                  onTrackWhatsApp={handleTrackWhatsApp}
                />
              )}

              {pathname === '/contato' && (
                <ContactPage
                  profile={profile}
                  settings={settings}
                  onTrackWhatsApp={handleTrackWhatsApp}
                />
              )}

              {pathname === '/privacidade' && (
                <PrivacyLgpdPage profile={profile} settings={settings} />
              )}

              {/* Fallback para rotas não mapeadas */}
              {![
                '/',
                '/comprar',
                '/na-planta',
                '/prontos',
                '/condominios',
                '/empreendimentos',
                '/sobre',
                '/contato',
                '/privacidade'
              ].includes(pathname) &&
                !propertySlug &&
                !empSlug &&
                !lpSlug && (
                  <HomePage
                    settings={settings}
                    profile={profile}
                    properties={properties}
                    empreendimentos={empreendimentos}
                    premiumLanding={premiumLanding}
                    onNavigate={navigate}
                    onTrackWhatsApp={handleTrackWhatsApp}
                  />
                )}
            </main>

            <PublicFooter
              settings={settings}
              profile={profile}
              premiumLanding={premiumLanding}
              onNavigate={navigate}
              onTrackWhatsApp={handleTrackWhatsApp}
            />

            <LgpdCookieBanner settings={settings} onNavigate={navigate} />
            <FloatingSocialAndAssistant
              settings={settings}
              profile={profile}
              onNavigate={navigate}
              onTrackWhatsApp={handleTrackWhatsApp}
            />
          </div>
        )}
      </MotionConfig>
    </ErrorBoundary>
  );
}
