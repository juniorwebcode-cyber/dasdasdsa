import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  DEFAULT_EMPREENDIMENTOS,
  DEFAULT_LANDING_PAGE,
  DEFAULT_PROFESSIONAL_PROFILE,
  DEFAULT_PROPERTIES,
  DEFAULT_SITE_SETTINGS
} from '../lib/seedDefaults';
import type {
  AdminUser,
  AnalyticsEvent,
  Client,
  Empreendimento,
  LandingPage,
  Lead,
  MediaAsset,
  PipelineItem,
  PipelineStage,
  ProfessionalProfile,
  Property,
  Proposal,
  SiteSettings,
  Task,
  Visit
} from '../types/realEstate';
import { slugifyText } from '../utils/utm';

function clampStr(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function clampList(value: unknown, maxItems: number, maxItemLen = 300): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, maxItems)
    .map((v) => v.trim().slice(0, maxItemLen));
}

function stripEmpty<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
}

// ============================================================================
// Public Readers (Safe fallbacks to grounded defaults if Firestore is empty)
// ============================================================================

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'main'));
    if (snap.exists()) {
      const merged = { ...DEFAULT_SITE_SETTINGS, ...snap.data(), id: snap.id } as SiteSettings;
      if (
        typeof merged.logoUrl === 'string' &&
        merged.logoUrl.includes('Logo-Dourado-Patricia-Vicente-Imoveis.png')
      ) {
        merged.logoUrl = DEFAULT_SITE_SETTINGS.logoUrl;
      }
      return merged;
    }
    return DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function getProfessionalProfile(): Promise<ProfessionalProfile> {
  try {
    const snap = await getDoc(doc(db, 'professionalProfile', 'main'));
    if (snap.exists()) {
      const merged = { ...DEFAULT_PROFESSIONAL_PROFILE, ...snap.data(), id: snap.id } as ProfessionalProfile;
      if (
        typeof merged.portraitUrl === 'string' &&
        merged.portraitUrl.includes('patricia_construction_portrait_1794928223577')
      ) {
        merged.portraitUrl = DEFAULT_PROFESSIONAL_PROFILE.portraitUrl;
      }
      return merged;
    }
    return DEFAULT_PROFESSIONAL_PROFILE;
  } catch {
    return DEFAULT_PROFESSIONAL_PROFILE;
  }
}

export async function listPublishedProperties(): Promise<Property[]> {
  const path = 'properties';
  try {
    const q = query(collection(db, path), where('published', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      const settingsSnap = await getDoc(doc(db, 'siteSettings', 'main')).catch(() => null);
      if (settingsSnap && settingsSnap.exists()) {
        return [];
      }
      return DEFAULT_PROPERTIES;
    }
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Property, 'id'>) }));
  } catch {
    return DEFAULT_PROPERTIES;
  }
}

export async function listPublishedEmpreendimentos(): Promise<Empreendimento[]> {
  const path = 'empreendimentos';
  try {
    const q = query(collection(db, path), where('published', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      const settingsSnap = await getDoc(doc(db, 'siteSettings', 'main')).catch(() => null);
      if (settingsSnap && settingsSnap.exists()) {
        return [];
      }
      return DEFAULT_EMPREENDIMENTOS;
    }
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Empreendimento, 'id'>) }));
  } catch {
    return DEFAULT_EMPREENDIMENTOS;
  }
}

export async function listPublishedLandingPages(): Promise<LandingPage[]> {
  const path = 'landingPages';
  try {
    const q = query(collection(db, path), where('published', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      return [DEFAULT_LANDING_PAGE];
    }
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LandingPage, 'id'>) }));
  } catch {
    return [DEFAULT_LANDING_PAGE];
  }
}

// ============================================================================
// Public Lead Capture & Analytics
// ============================================================================

export async function submitPublicLead(input: {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  interestType: Lead['interestType'];
  preferredDate?: string;
  propertyId?: string;
  propertyTitle?: string;
  empreendimentoId?: string;
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  lgpdConsent: boolean;
}): Promise<string> {
  const path = 'leads';
  try {
    const cleanName = clampStr(input.name, 140);
    const cleanPhone = clampStr(input.phone, 40);
    if (cleanName.length < 2 || cleanPhone.length < 6) {
      throw new Error('Por favor, informe nome e telefone válidos.');
    }
    if (!input.lgpdConsent) {
      throw new Error('É necessário concordar com a política de privacidade (LGPD).');
    }

    const score: Lead['score'] =
      input.interestType === 'agendamento_visita' || Boolean(input.preferredDate) || Boolean(input.propertyId)
        ? 'quente'
        : input.message && input.message.trim().length > 25
          ? 'morno'
          : 'frio';

    const payload = stripEmpty({
      name: cleanName,
      phone: cleanPhone,
      email: input.email ? clampStr(input.email, 160) : undefined,
      message: input.message ? clampStr(input.message, 2000) : undefined,
      interestType: input.interestType,
      preferredDate: input.preferredDate ? clampStr(input.preferredDate, 60) : undefined,
      propertyId: input.propertyId ? clampStr(input.propertyId, 128) : undefined,
      propertyTitle: input.propertyTitle ? clampStr(input.propertyTitle, 160) : undefined,
      empreendimentoId: input.empreendimentoId ? clampStr(input.empreendimentoId, 128) : undefined,
      source: clampStr(input.source || 'site', 100),
      utmSource: input.utmSource ? clampStr(input.utmSource, 100) : undefined,
      utmMedium: input.utmMedium ? clampStr(input.utmMedium, 100) : undefined,
      utmCampaign: input.utmCampaign ? clampStr(input.utmCampaign, 100) : undefined,
      utmContent: input.utmContent ? clampStr(input.utmContent, 100) : undefined,
      utmTerm: input.utmTerm ? clampStr(input.utmTerm, 100) : undefined,
      score,
      status: 'novo',
      lgpdConsent: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const ref = await addDoc(collection(db, path), payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function trackAnalyticsEvent(input: {
  eventType: AnalyticsEvent['eventType'];
  path: string;
  targetId?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}): Promise<void> {
  const colPath = 'analytics';
  try {
    const payload = stripEmpty({
      eventType: input.eventType,
      path: clampStr(input.path || '/', 240),
      targetId: input.targetId ? clampStr(input.targetId, 128) : undefined,
      source: input.source ? clampStr(input.source, 100) : undefined,
      utmSource: input.utmSource ? clampStr(input.utmSource, 100) : undefined,
      utmMedium: input.utmMedium ? clampStr(input.utmMedium, 100) : undefined,
      utmCampaign: input.utmCampaign ? clampStr(input.utmCampaign, 100) : undefined,
      createdAt: serverTimestamp()
    });
    await addDoc(collection(db, colPath), payload);
  } catch {
    // Analytics must never interrupt user browsing
  }
}

// ============================================================================
// Admin Readers (All collections)
// ============================================================================

export async function adminListAllProperties(): Promise<Property[]> {
  const path = 'properties';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Property, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListAllEmpreendimentos(): Promise<Empreendimento[]> {
  const path = 'empreendimentos';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Empreendimento, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListAllLandingPages(): Promise<LandingPage[]> {
  const path = 'landingPages';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LandingPage, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListLeads(): Promise<Lead[]> {
  const path = 'leads';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(200)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lead, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListClients(): Promise<Client[]> {
  const path = 'clients';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('updatedAt', 'desc'), limit(200)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Client, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListPipeline(): Promise<PipelineItem[]> {
  const path = 'pipeline';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('updatedAt', 'desc'), limit(300)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PipelineItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListVisits(): Promise<Visit[]> {
  const path = 'visits';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(200)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Visit, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListProposals(): Promise<Proposal[]> {
  const path = 'proposals';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(200)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Proposal, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListTasks(): Promise<Task[]> {
  const path = 'tasks';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(200)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListMedia(): Promise<MediaAsset[]> {
  const path = 'media';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(200)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MediaAsset, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListAnalytics(): Promise<AnalyticsEvent[]> {
  const path = 'analytics';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(500)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AnalyticsEvent, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const path = 'adminUsers';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminUser, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ============================================================================
// Admin Writers (Validated & Sanitized against Blueprint)
// ============================================================================

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const path = 'siteSettings/main';
  try {
    const payload = stripEmpty({
      brandName: clampStr(settings.brandName || 'Patrícia Vicente', 120),
      tagline: clampStr(settings.tagline, 240),
      logoUrl: clampStr(settings.logoUrl, 500),
      primaryColor: /^#[0-9A-Fa-f]{6}$/.test(settings.primaryColor) ? settings.primaryColor : '#1E4D5C',
      accentColor: /^#[0-9A-Fa-f]{6}$/.test(settings.accentColor) ? settings.accentColor : '#A67C46',
      backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(settings.backgroundColor) ? settings.backgroundColor : '#FAF9F6',
      displayFont: clampStr(settings.displayFont, 80),
      bodyFont: clampStr(settings.bodyFont, 80),
      whatsappNumber: clampStr(settings.whatsappNumber || '5515998465635', 30),
      whatsappDefaultMessage: clampStr(settings.whatsappDefaultMessage, 300),
      instagramUrl: clampStr(settings.instagramUrl, 300),
      heroTitle: clampStr(settings.heroTitle, 200),
      heroSubtitle: clampStr(settings.heroSubtitle, 400),
      heroImageUrl: clampStr(settings.heroImageUrl, 500),
      seoTitle: clampStr(settings.seoTitle, 120),
      seoDescription: clampStr(settings.seoDescription, 240),
      ga4MeasurementId: clampStr(settings.ga4MeasurementId, 60),
      gtmContainerId: clampStr(settings.gtmContainerId, 60),
      googleSearchConsoleTag: clampStr(settings.googleSearchConsoleTag, 120),
      googleAdsConversionId: clampStr(settings.googleAdsConversionId, 60),
      lgpdNoticeText: clampStr(settings.lgpdNoticeText, 600),
      updatedAt: serverTimestamp()
    });
    await setDoc(doc(db, 'siteSettings', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveProfessionalProfile(profile: ProfessionalProfile): Promise<void> {
  const path = 'professionalProfile/main';
  try {
    const payload = stripEmpty({
      fullName: clampStr(profile.fullName || 'Patrícia Vicente', 120),
      roleTitle: clampStr(profile.roleTitle || 'Corretora de Imóveis – Sorocaba e Região', 140),
      instagramHandle: clampStr(profile.instagramHandle, 80),
      creciNumber: clampStr(profile.creciNumber, 80),
      creciStatus: profile.creciStatus === 'confirmado' ? 'confirmado' : 'a_confirmar',
      commercialEmail: clampStr(profile.commercialEmail, 160),
      commercialEmailStatus: profile.commercialEmailStatus === 'confirmado' ? 'confirmado' : 'a_confirmar',
      commercialAddress: clampStr(profile.commercialAddress, 240),
      commercialAddressStatus: profile.commercialAddressStatus === 'confirmado' ? 'confirmado' : 'a_confirmar',
      yearsConstruction: Number(profile.yearsConstruction) || 10,
      headline: clampStr(profile.headline, 240),
      institutionalBio: clampStr(profile.institutionalBio, 2000),
      constructionStory: clampStr(profile.constructionStory, 3000),
      portraitUrl: clampStr(profile.portraitUrl, 500),
      serviceRegion: clampStr(profile.serviceRegion, 140),
      updatedAt: serverTimestamp()
    });
    await setDoc(doc(db, 'professionalProfile', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveProperty(property: Omit<Property, 'id'> & { id?: string }): Promise<string> {
  const path = property.id ? `properties/${property.id}` : 'properties';
  try {
    const baseData = stripEmpty({
      code: clampStr(property.code || 'PV-NEW', 32),
      title: clampStr(property.title, 160),
      slug: slugifyText(property.slug || property.title) || clampStr(property.id || 'imovel', 32),
      category: property.category,
      transactionType: property.transactionType || 'venda',
      region: clampStr(property.region || 'Sorocaba e região', 120),
      neighborhood: property.neighborhood ? clampStr(property.neighborhood, 120) : undefined,
      priceText: clampStr(property.priceText || 'Valor a confirmar', 80),
      priceNumeric: typeof property.priceNumeric === 'number' && property.priceNumeric >= 0 ? property.priceNumeric : undefined,
      confirmationStatus: property.confirmationStatus === 'confirmado' ? 'confirmado' : 'a_confirmar',
      bedrooms: property.bedrooms ? clampStr(property.bedrooms, 40) : undefined,
      suites: property.suites ? clampStr(property.suites, 40) : undefined,
      bathrooms: property.bathrooms ? clampStr(property.bathrooms, 40) : undefined,
      parkingSpaces: property.parkingSpaces ? clampStr(property.parkingSpaces, 40) : undefined,
      areaSqm: property.areaSqm ? clampStr(property.areaSqm, 40) : undefined,
      description: property.description ? clampStr(property.description, 4000) : undefined,
      confirmationNote: property.confirmationNote ? clampStr(property.confirmationNote, 400) : undefined,
      coverImage: property.coverImage ? clampStr(property.coverImage, 500) : undefined,
      gallery: clampList(property.gallery, 100, 500),
      videos: clampList(property.videos, 30, 500),
      features: clampList(property.features, 24, 160),
      empreendimentoId: property.empreendimentoId ? clampStr(property.empreendimentoId, 128) : undefined,
      featured: Boolean(property.featured),
      published: Boolean(property.published)
    });

    if (property.id) {
      const docRef = doc(db, 'properties', property.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return property.id;
    } else {
      const ref = await addDoc(collection(db, 'properties'), {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ref.id;
    }
  } catch (error) {
    handleFirestoreError(error, property.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeProperty(id: string): Promise<void> {
  const path = `properties/${id}`;
  try {
    await deleteDoc(doc(db, 'properties', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveEmpreendimento(
  emp: Omit<Empreendimento, 'id'> & { id?: string }
): Promise<string> {
  const path = emp.id ? `empreendimentos/${emp.id}` : 'empreendimentos';
  try {
    const baseData = stripEmpty({
      name: clampStr(emp.name, 160),
      slug: slugifyText(emp.slug || emp.name) || clampStr(emp.id || 'empreendimento', 32),
      category: emp.category,
      region: clampStr(emp.region || 'Sorocaba e região', 120),
      developer: emp.developer ? clampStr(emp.developer, 120) : undefined,
      stage: clampStr(emp.stage || 'A confirmar', 80),
      deliveryForecast: emp.deliveryForecast ? clampStr(emp.deliveryForecast, 80) : undefined,
      priceRangeText: emp.priceRangeText ? clampStr(emp.priceRangeText, 80) : undefined,
      confirmationStatus: emp.confirmationStatus === 'confirmado' ? 'confirmado' : 'a_confirmar',
      description: emp.description ? clampStr(emp.description, 4000) : undefined,
      highlights: clampList(emp.highlights, 20, 180),
      coverImage: emp.coverImage ? clampStr(emp.coverImage, 500) : undefined,
      gallery: clampList(emp.gallery, 100, 500),
      videos: clampList(emp.videos, 30, 500),
      featured: Boolean(emp.featured),
      published: Boolean(emp.published)
    });

    if (emp.id) {
      const docRef = doc(db, 'empreendimentos', emp.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return emp.id;
    } else {
      const ref = await addDoc(collection(db, 'empreendimentos'), {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ref.id;
    }
  } catch (error) {
    handleFirestoreError(error, emp.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeEmpreendimento(id: string): Promise<void> {
  const path = `empreendimentos/${id}`;
  try {
    await deleteDoc(doc(db, 'empreendimentos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Garante a regra de negócio: exatamente UMA Landing Page Premium sofisticada publicada por vez.
 * Se uma nova landing page for marcada como `isPremiumShowcase && published`, as demais `isPremiumShowcase`
 * são automaticamente desmarcadas de showcase exclusivo antes da gravação.
 */
export async function saveLandingPage(
  lp: Omit<LandingPage, 'id'> & { id?: string }
): Promise<string> {
  const path = lp.id ? `landingPages/${lp.id}` : 'landingPages';
  try {
    if (lp.isPremiumShowcase && lp.published) {
      const existingSnap = await getDocs(collection(db, 'landingPages'));
      const batch = writeBatch(db);
      let hasDemotions = false;
      existingSnap.docs.forEach((d) => {
        if (d.id !== lp.id && d.data().isPremiumShowcase === true && d.data().published === true) {
          hasDemotions = true;
          batch.update(d.ref, { isPremiumShowcase: false, updatedAt: serverTimestamp() });
        }
      });
      if (hasDemotions) {
        await batch.commit();
      }
    }

    const baseData = stripEmpty({
      title: clampStr(lp.title, 160),
      slug: slugifyText(lp.slug || lp.title),
      targetType: lp.targetType,
      targetId: lp.targetId ? clampStr(lp.targetId, 128) : undefined,
      isPremiumShowcase: Boolean(lp.isPremiumShowcase),
      heroKicker: lp.heroKicker ? clampStr(lp.heroKicker, 120) : undefined,
      heroTitle: clampStr(lp.heroTitle, 200),
      heroSubtitle: lp.heroSubtitle ? clampStr(lp.heroSubtitle, 400) : undefined,
      heroCtaLabel: clampStr(lp.heroCtaLabel || 'Agendar conversa com Patrícia', 80),
      heroImage: lp.heroImage ? clampStr(lp.heroImage, 500) : undefined,
      architecturalThesis: lp.architecturalThesis ? clampStr(lp.architecturalThesis, 2500) : undefined,
      highlights: clampList(lp.highlights, 15, 200),
      gallery: clampList(lp.gallery, 15, 500),
      formTitle: lp.formTitle ? clampStr(lp.formTitle, 140) : undefined,
      seoTitle: lp.seoTitle ? clampStr(lp.seoTitle, 120) : undefined,
      seoDescription: lp.seoDescription ? clampStr(lp.seoDescription, 240) : undefined,
      published: Boolean(lp.published)
    });

    if (lp.id) {
      const docRef = doc(db, 'landingPages', lp.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return lp.id;
    } else {
      const ref = await addDoc(collection(db, 'landingPages'), {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ref.id;
    }
  } catch (error) {
    handleFirestoreError(error, lp.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeLandingPage(id: string): Promise<void> {
  const path = `landingPages/${id}`;
  try {
    await deleteDoc(doc(db, 'landingPages', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateLeadAdmin(
  leadId: string,
  updates: Partial<Pick<Lead, 'score' | 'status' | 'message'>>
): Promise<void> {
  const path = `leads/${leadId}`;
  try {
    await updateDoc(doc(db, 'leads', leadId), {
      ...stripEmpty(updates),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeLead(leadId: string): Promise<void> {
  const path = `leads/${leadId}`;
  try {
    await deleteDoc(doc(db, 'leads', leadId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function convertLeadToCrm(lead: Lead): Promise<{ clientId: string; pipelineId: string }> {
  const path = `leads/${lead.id}`;
  try {
    const batch = writeBatch(db);
    const clientRef = doc(collection(db, 'clients'));
    const pipelineRef = doc(collection(db, 'pipeline'));
    const taskRef = doc(collection(db, 'tasks'));

    const initialInteraction = `[${new Date().toLocaleDateString('pt-BR')}] Lead capturado via ${lead.source}: ${
      lead.message || lead.interestType
    }`;

    batch.set(
      clientRef,
      stripEmpty({
        name: clampStr(lead.name, 140),
        phone: clampStr(lead.phone, 40),
        email: lead.email ? clampStr(lead.email, 160) : undefined,
        origin: clampStr(lead.utmSource || lead.source, 100),
        score: lead.score,
        stage: 'contato',
        preferredRegions: ['Sorocaba e região'],
        tags: [lead.interestType, lead.utmCampaign || 'organico'].filter(Boolean),
        interestPropertyIds: lead.propertyId ? [lead.propertyId] : [],
        interactions: [initialInteraction],
        notes: lead.message ? clampStr(lead.message, 4000) : '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );

    batch.set(
      pipelineRef,
      stripEmpty({
        clientId: clientRef.id,
        clientName: clampStr(lead.name, 140),
        leadId: lead.id,
        propertyId: lead.propertyId ? clampStr(lead.propertyId, 128) : undefined,
        propertyTitle: lead.propertyTitle ? clampStr(lead.propertyTitle, 160) : undefined,
        stage: lead.interestType === 'agendamento_visita' ? 'visita_agendada' : 'contato',
        score: lead.score,
        tags: [lead.interestType],
        notes: lead.message ? clampStr(lead.message, 2000) : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );

    batch.set(taskRef, {
      title: `Primeiro retorno para ${clampStr(lead.name, 100)}`,
      description: `Contato via ${lead.phone}${lead.propertyTitle ? ` sobre ${lead.propertyTitle}` : ''}`,
      clientId: clientRef.id,
      clientName: clampStr(lead.name, 140),
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: lead.score === 'quente' ? 'alta' : 'media',
      completed: false,
      automationTrigger: 'conversao_lead',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    batch.update(doc(db, 'leads', lead.id), {
      status: 'contato',
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return { clientId: clientRef.id, pipelineId: pipelineRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveClient(client: Omit<Client, 'id'> & { id?: string }): Promise<string> {
  const path = client.id ? `clients/${client.id}` : 'clients';
  try {
    const baseData = stripEmpty({
      name: clampStr(client.name, 140),
      phone: clampStr(client.phone, 40),
      email: client.email ? clampStr(client.email, 160) : undefined,
      origin: client.origin ? clampStr(client.origin, 100) : undefined,
      score: client.score,
      stage: client.stage,
      budgetText: client.budgetText ? clampStr(client.budgetText, 100) : undefined,
      preferredRegions: clampList(client.preferredRegions, 12, 100),
      tags: clampList(client.tags, 16, 60),
      interestPropertyIds: clampList(client.interestPropertyIds, 20, 128),
      interactions: clampList(client.interactions, 50, 400),
      notes: client.notes ? clampStr(client.notes, 4000) : undefined
    });

    if (client.id) {
      const docRef = doc(db, 'clients', client.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return client.id;
    } else {
      const ref = await addDoc(collection(db, 'clients'), {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ref.id;
    }
  } catch (error) {
    handleFirestoreError(error, client.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeClient(id: string): Promise<void> {
  const path = `clients/${id}`;
  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePipelineItem(
  item: Omit<PipelineItem, 'id'> & { id?: string }
): Promise<string> {
  const path = item.id ? `pipeline/${item.id}` : 'pipeline';
  try {
    const baseData = stripEmpty({
      clientId: item.clientId ? clampStr(item.clientId, 128) : undefined,
      clientName: clampStr(item.clientName, 140),
      leadId: item.leadId ? clampStr(item.leadId, 128) : undefined,
      propertyId: item.propertyId ? clampStr(item.propertyId, 128) : undefined,
      propertyTitle: item.propertyTitle ? clampStr(item.propertyTitle, 160) : undefined,
      stage: item.stage,
      score: item.score,
      estimatedValue: typeof item.estimatedValue === 'number' && item.estimatedValue >= 0 ? item.estimatedValue : undefined,
      tags: clampList(item.tags, 16, 60),
      nextFollowUpAt: item.nextFollowUpAt ? clampStr(item.nextFollowUpAt, 60) : undefined,
      notes: item.notes ? clampStr(item.notes, 2000) : undefined
    });

    if (item.id) {
      const docRef = doc(db, 'pipeline', item.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return item.id;
    } else {
      const ref = await addDoc(collection(db, 'pipeline'), {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ref.id;
    }
  } catch (error) {
    handleFirestoreError(error, item.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function movePipelineStage(itemId: string, stage: PipelineStage): Promise<void> {
  const path = `pipeline/${itemId}`;
  try {
    await updateDoc(doc(db, 'pipeline', itemId), { stage, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removePipelineItem(id: string): Promise<void> {
  const path = `pipeline/${id}`;
  try {
    await deleteDoc(doc(db, 'pipeline', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveVisit(visit: Omit<Visit, 'id'> & { id?: string }): Promise<string> {
  const path = visit.id ? `visits/${visit.id}` : 'visits';
  try {
    const baseData = stripEmpty({
      clientId: visit.clientId ? clampStr(visit.clientId, 128) : undefined,
      clientName: clampStr(visit.clientName, 140),
      clientPhone: visit.clientPhone ? clampStr(visit.clientPhone, 40) : undefined,
      propertyId: visit.propertyId ? clampStr(visit.propertyId, 128) : undefined,
      propertyTitle: clampStr(visit.propertyTitle, 160),
      scheduledAt: clampStr(visit.scheduledAt, 60),
      status: visit.status,
      reminderEnabled: Boolean(visit.reminderEnabled),
      notes: visit.notes ? clampStr(visit.notes, 2000) : undefined
    });

    if (visit.id) {
      const docRef = doc(db, 'visits', visit.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return visit.id;
    } else {
      const ref = await addDoc(collection(db, 'visits'), {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await addDoc(collection(db, 'tasks'), {
        title: `Confirmar visita com ${clampStr(visit.clientName, 100)}`,
        description: `Imóvel: ${clampStr(visit.propertyTitle, 120)} · Horário: ${clampStr(visit.scheduledAt, 40)}`,
        dueDate: clampStr(visit.scheduledAt, 10),
        priority: 'alta',
        completed: false,
        automationTrigger: 'visita_agendada',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ref.id;
    }
  } catch (error) {
    handleFirestoreError(error, visit.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeVisit(id: string): Promise<void> {
  const path = `visits/${id}`;
  try {
    await deleteDoc(doc(db, 'visits', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveProposal(proposal: Omit<Proposal, 'id'> & { id?: string }): Promise<string> {
  const path = proposal.id ? `proposals/${proposal.id}` : 'proposals';
  try {
    const baseData = stripEmpty({
      clientId: proposal.clientId ? clampStr(proposal.clientId, 128) : undefined,
      clientName: clampStr(proposal.clientName, 140),
      propertyId: proposal.propertyId ? clampStr(proposal.propertyId, 128) : undefined,
      propertyTitle: clampStr(proposal.propertyTitle, 160),
      valueText: clampStr(proposal.valueText, 80),
      paymentConditions: proposal.paymentConditions ? clampStr(proposal.paymentConditions, 500) : undefined,
      status: proposal.status,
      documentUrl: proposal.documentUrl ? clampStr(proposal.documentUrl, 500) : undefined,
      documentName: proposal.documentName ? clampStr(proposal.documentName, 160) : undefined,
      notes: proposal.notes ? clampStr(proposal.notes, 2000) : undefined
    });

    if (proposal.id) {
      const docRef = doc(db, 'proposals', proposal.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return proposal.id;
    } else {
      const ref = await addDoc(collection(db, 'proposals'), {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ref.id;
    }
  } catch (error) {
    handleFirestoreError(error, proposal.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeProposal(id: string): Promise<void> {
  const path = `proposals/${id}`;
  try {
    await deleteDoc(doc(db, 'proposals', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTask(task: Omit<Task, 'id'> & { id?: string }): Promise<string> {
  const path = task.id ? `tasks/${task.id}` : 'tasks';
  try {
    const baseData = stripEmpty({
      title: clampStr(task.title, 180),
      description: task.description ? clampStr(task.description, 1000) : undefined,
      clientId: task.clientId ? clampStr(task.clientId, 128) : undefined,
      clientName: task.clientName ? clampStr(task.clientName, 140) : undefined,
      dueDate: task.dueDate ? clampStr(task.dueDate, 60) : undefined,
      priority: task.priority,
      completed: Boolean(task.completed),
      automationTrigger: task.automationTrigger ? clampStr(task.automationTrigger, 120) : undefined
    });

    if (task.id) {
      const docRef = doc(db, 'tasks', task.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...baseData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(docRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return task.id;
    } else {
      const ref = await addDoc(collection(db, 'tasks'), {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ref.id;
    }
  } catch (error) {
    handleFirestoreError(error, task.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeTask(id: string): Promise<void> {
  const path = `tasks/${id}`;
  try {
    await deleteDoc(doc(db, 'tasks', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMediaAsset(asset: Omit<MediaAsset, 'id'> & { id?: string }): Promise<string> {
  const path = asset.id ? `media/${asset.id}` : 'media';
  try {
    const payload = stripEmpty({
      url: clampStr(asset.url, 600),
      fileName: clampStr(asset.fileName, 180),
      contentType: asset.contentType ? clampStr(asset.contentType, 100) : undefined,
      sizeBytes: typeof asset.sizeBytes === 'number' && asset.sizeBytes >= 0 ? asset.sizeBytes : undefined,
      category: asset.category,
      altText: asset.altText ? clampStr(asset.altText, 240) : undefined,
      storageProvider: asset.storageProvider,
      createdAt: serverTimestamp()
    });
    if (asset.id) {
      await setDoc(doc(db, 'media', asset.id), payload);
      return asset.id;
    }
    const ref = await addDoc(collection(db, 'media'), payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeMediaAsset(id: string): Promise<void> {
  const path = `media/${id}`;
  try {
    await deleteDoc(doc(db, 'media', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAdminUser(uid: string, user: Omit<AdminUser, 'id'>): Promise<void> {
  const path = `adminUsers/${uid}`;
  try {
    const existingSnap = await getDoc(doc(db, 'adminUsers', uid));
    if (existingSnap.exists()) {
      await updateDoc(doc(db, 'adminUsers', uid), {
        email: clampStr(user.email, 160),
        displayName: user.displayName ? clampStr(user.displayName, 140) : undefined,
        role: 'admin',
        active: Boolean(user.active),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(doc(db, 'adminUsers', uid), {
        email: clampStr(user.email, 160),
        displayName: user.displayName ? clampStr(user.displayName, 140) : undefined,
        role: 'admin',
        active: Boolean(user.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeAdminUser(uid: string): Promise<void> {
  const path = `adminUsers/${uid}`;
  try {
    await deleteDoc(doc(db, 'adminUsers', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function checkUserIsAdmin(uid: string, email: string | null | undefined, verified: boolean): Promise<boolean> {
  if (!verified) return false;
  if (email === 'juniorwebcode@gmail.com') return true;
  try {
    const snap = await getDoc(doc(db, 'adminUsers', uid));
    return snap.exists() && snap.data().active === true && snap.data().role === 'admin';
  } catch {
    return false;
  }
}

export async function bootstrapInitialFirestoreData(): Promise<void> {
  const path = 'siteSettings/main';
  try {
    const settingsSnap = await getDoc(doc(db, 'siteSettings', 'main'));
    if (!settingsSnap.exists()) {
      await saveSiteSettings(DEFAULT_SITE_SETTINGS);
    }

    const profileSnap = await getDoc(doc(db, 'professionalProfile', 'main'));
    if (!profileSnap.exists()) {
      await saveProfessionalProfile(DEFAULT_PROFESSIONAL_PROFILE);
    }

    const propsSnap = await getDocs(collection(db, 'properties'));
    if (propsSnap.empty) {
      for (const prop of DEFAULT_PROPERTIES) {
        const { id, ...rest } = prop;
        await setDoc(doc(db, 'properties', id), {
          ...stripEmpty(rest),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    const empSnap = await getDocs(collection(db, 'empreendimentos'));
    if (empSnap.empty) {
      for (const emp of DEFAULT_EMPREENDIMENTOS) {
        const { id, ...rest } = emp;
        await setDoc(doc(db, 'empreendimentos', id), {
          ...stripEmpty(rest),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    const lpSnap = await getDocs(collection(db, 'landingPages'));
    if (lpSnap.empty) {
      const { id, ...rest } = DEFAULT_LANDING_PAGE;
      await setDoc(doc(db, 'landingPages', id), {
        ...stripEmpty(rest),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
