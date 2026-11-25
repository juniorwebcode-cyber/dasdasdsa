import { auth } from '../lib/firebase';
import {
  DEFAULT_EMPREENDIMENTOS,
  DEFAULT_LANDING_PAGE,
  DEFAULT_PROFESSIONAL_PROFILE,
  DEFAULT_PROPERTIES,
  DEFAULT_SITE_SETTINGS
} from '../lib/seedDefaults';
import {
  adminListAllEmpreendimentos as fsAdminListAllEmpreendimentos,
  adminListAllLandingPages as fsAdminListAllLandingPages,
  adminListAllProperties as fsAdminListAllProperties,
  adminListAnalytics as fsAdminListAnalytics,
  adminListClients as fsAdminListClients,
  adminListLeads as fsAdminListLeads,
  adminListMedia as fsAdminListMedia,
  adminListPipeline as fsAdminListPipeline,
  adminListProposals as fsAdminListProposals,
  adminListTasks as fsAdminListTasks,
  adminListUsers as fsAdminListUsers,
  adminListVisits as fsAdminListVisits,
  bootstrapInitialFirestoreData as fsBootstrapInitialFirestoreData,
  checkUserIsAdmin,
  convertLeadToCrm as fsConvertLeadToCrm,
  getProfessionalProfile as fsGetProfessionalProfile,
  getSiteSettings as fsGetSiteSettings,
  listPublishedEmpreendimentos as fsListPublishedEmpreendimentos,
  listPublishedLandingPages as fsListPublishedLandingPages,
  listPublishedProperties as fsListPublishedProperties,
  movePipelineStage as fsMovePipelineStage,
  removeAdminUser as fsRemoveAdminUser,
  removeClient as fsRemoveClient,
  removeEmpreendimento as fsRemoveEmpreendimento,
  removeLandingPage as fsRemoveLandingPage,
  removeLead as fsRemoveLead,
  removeMediaAsset as fsRemoveMediaAsset,
  removePipelineItem as fsRemovePipelineItem,
  removeProperty as fsRemoveProperty,
  removeProposal as fsRemoveProposal,
  removeTask as fsRemoveTask,
  removeVisit as fsRemoveVisit,
  saveAdminUser as fsSaveAdminUser,
  saveClient as fsSaveClient,
  saveEmpreendimento as fsSaveEmpreendimento,
  saveLandingPage as fsSaveLandingPage,
  saveMediaAsset as fsSaveMediaAsset,
  savePipelineItem as fsSavePipelineItem,
  saveProfessionalProfile as fsSaveProfessionalProfile,
  saveProperty as fsSaveProperty,
  saveProposal as fsSaveProposal,
  saveSiteSettings as fsSaveSiteSettings,
  saveTask as fsSaveTask,
  saveVisit as fsSaveVisit,
  submitPublicLead as fsSubmitPublicLead,
  trackAnalyticsEvent as fsTrackAnalyticsEvent,
  updateLeadAdmin as fsUpdateLeadAdmin
} from './firestoreService';
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

const PUBLIC_CACHE_KEY = 'pv_public_snapshot_cache_v2';
const ADMIN_TOKEN_STORAGE_KEY = 'pv_admin_session_token';

export interface PublicSiteSnapshot {
  hasAdminEdits: boolean;
  updatedAt?: string;
  siteSettings: SiteSettings;
  professionalProfile: ProfessionalProfile;
  properties: Property[];
  empreendimentos: Empreendimento[];
  landingPages: LandingPage[];
}

export interface FullAdminStoreData extends PublicSiteSnapshot {
  leads: Lead[];
  clients: Client[];
  pipeline: PipelineItem[];
  visits: Visit[];
  proposals: Proposal[];
  tasks: Task[];
  media: MediaAsset[];
  analytics: AnalyticsEvent[];
  adminUsers: AdminUser[];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function readCachedPublicSnapshot(): PublicSiteSnapshot {
  try {
    const raw = window.localStorage.getItem(PUBLIC_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PublicSiteSnapshot>;
      if (parsed && parsed.siteSettings && parsed.professionalProfile) {
        return {
          hasAdminEdits: Boolean(parsed.hasAdminEdits),
          updatedAt: parsed.updatedAt,
          siteSettings: { ...DEFAULT_SITE_SETTINGS, ...parsed.siteSettings },
          professionalProfile: {
            ...DEFAULT_PROFESSIONAL_PROFILE,
            ...parsed.professionalProfile
          },
          properties: Array.isArray(parsed.properties) ? parsed.properties : DEFAULT_PROPERTIES,
          empreendimentos: Array.isArray(parsed.empreendimentos)
            ? parsed.empreendimentos
            : DEFAULT_EMPREENDIMENTOS,
          landingPages: Array.isArray(parsed.landingPages)
            ? parsed.landingPages
            : [DEFAULT_LANDING_PAGE]
        };
      }
    }
  } catch {
    // Ignore storage read error
  }
  return {
    hasAdminEdits: false,
    siteSettings: { ...DEFAULT_SITE_SETTINGS },
    professionalProfile: { ...DEFAULT_PROFESSIONAL_PROFILE },
    properties: [...DEFAULT_PROPERTIES],
    empreendimentos: [...DEFAULT_EMPREENDIMENTOS],
    landingPages: [{ ...DEFAULT_LANDING_PAGE }]
  };
}

function writeCachedPublicSnapshot(snapshot: PublicSiteSnapshot): void {
  try {
    window.localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors
  }
}

// ============================================================================
// Session Token & Auth Header Helpers
// ============================================================================

export function getStoredAdminToken(): string | null {
  try {
    return (
      window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ||
      window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
      window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

async function getAdminRequestHeaders(includeJson = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getStoredAdminToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) {
        headers['x-firebase-id-token'] = idToken;
      }
    } catch {
      // Ignore optional Firebase ID token error
    }
  }
  return headers;
}

async function safeParseJson<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function adminApiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const baseHeaders = await getAdminRequestHeaders(Boolean(init.body));
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      ...baseHeaders,
      ...(init.headers as Record<string, string> | undefined)
    }
  });

  const json = await safeParseJson<T & { error?: string }>(res);
  if (!res.ok) {
    const isRead = !init.method || init.method.toUpperCase() === 'GET';
    throw new Error(
      json?.error ||
        (isRead
          ? `Falha ao carregar dados do servidor (HTTP ${res.status}).`
          : `Falha ao salvar no banco de dados (HTTP ${res.status}).`)
    );
  }
  return (json || ({} as T)) as T;
}

export async function checkCredentialSession(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const token = getStoredAdminToken();
    const res = await fetch('/api/admin/session', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok) return { authenticated: false };
    const json = await safeParseJson<{ authenticated?: boolean; email?: string }>(res);
    return { authenticated: Boolean(json?.authenticated), email: json?.email };
  } catch {
    return { authenticated: false };
  }
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<{ ok: boolean; email?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    });
    const json = await safeParseJson<{
      ok?: boolean;
      email?: string;
      sessionToken?: string;
      error?: string;
    }>(res);
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error || 'Login ou senha inválidos.' };
    }
    if (json.sessionToken) {
      setStoredAdminToken(json.sessionToken);
    }
    return { ok: true, email: json.email };
  } catch {
    return { ok: false, error: 'Falha de conexão ao autenticar. Tente novamente.' };
  }
}

export async function logoutCredentialSession(): Promise<void> {
  setStoredAdminToken(null);
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch {
    // Ignore logout network error
  }
}

export async function isCloudFirebaseAdminActive(): Promise<boolean> {
  const current = auth.currentUser;
  if (!current || !current.emailVerified) return false;
  return checkUserIsAdmin(current.uid, current.email, current.emailVerified);
}

// ============================================================================
// Public Readers & Trackers (Persistent Server DB + Cloud Firestore)
// ============================================================================

export async function getPublicSnapshotUnified(): Promise<PublicSiteSnapshot> {
  try {
    const res = await fetch('/api/public/data', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const serverData = await safeParseJson<PublicSiteSnapshot>(res);
      if (serverData && serverData.siteSettings && serverData.professionalProfile) {
        if (serverData.hasAdminEdits) {
          writeCachedPublicSnapshot(serverData);
          return serverData;
        }
        // Server still holds unedited seed: prefer Firestore if already populated by verified owner
        try {
          const [fsSettings, fsProfile, fsProps, fsEmps, fsLps] = await Promise.all([
            fsGetSiteSettings(),
            fsGetProfessionalProfile(),
            fsListPublishedProperties(),
            fsListPublishedEmpreendimentos(),
            fsListPublishedLandingPages()
          ]);
          const merged: PublicSiteSnapshot = {
            hasAdminEdits: false,
            updatedAt: serverData.updatedAt,
            siteSettings: fsSettings,
            professionalProfile: fsProfile,
            properties: fsProps.length > 0 ? fsProps : serverData.properties,
            empreendimentos: fsEmps.length > 0 ? fsEmps : serverData.empreendimentos,
            landingPages: fsLps.length > 0 ? fsLps : serverData.landingPages
          };
          writeCachedPublicSnapshot(merged);
          return merged;
        } catch {
          writeCachedPublicSnapshot(serverData);
          return serverData;
        }
      }
    }
  } catch {
    // Fall back to Firestore or cached snapshot below
  }

  try {
    const [siteSettings, professionalProfile, properties, empreendimentos, landingPages] =
      await Promise.all([
        fsGetSiteSettings(),
        fsGetProfessionalProfile(),
        fsListPublishedProperties(),
        fsListPublishedEmpreendimentos(),
        fsListPublishedLandingPages()
      ]);
    const fsSnapshot: PublicSiteSnapshot = {
      hasAdminEdits: false,
      siteSettings,
      professionalProfile,
      properties,
      empreendimentos,
      landingPages
    };
    writeCachedPublicSnapshot(fsSnapshot);
    return fsSnapshot;
  } catch {
    return readCachedPublicSnapshot();
  }
}

export async function getPublicSiteSettings(): Promise<SiteSettings> {
  return (await getPublicSnapshotUnified()).siteSettings;
}

export async function getPublicProfessionalProfile(): Promise<ProfessionalProfile> {
  return (await getPublicSnapshotUnified()).professionalProfile;
}

export async function listPublicProperties(): Promise<Property[]> {
  return (await getPublicSnapshotUnified()).properties;
}

export async function listPublicEmpreendimentos(): Promise<Empreendimento[]> {
  return (await getPublicSnapshotUnified()).empreendimentos;
}

export async function listPublicLandingPages(): Promise<LandingPage[]> {
  return (await getPublicSnapshotUnified()).landingPages;
}

export async function submitPublicLeadUnified(
  input: Parameters<typeof fsSubmitPublicLead>[0]
): Promise<string> {
  let id = makeId('lead');
  try {
    id = await fsSubmitPublicLead(input);
  } catch {
    // Also persist on server DB below
  }

  try {
    const res = await fetch('/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, id })
    });
    const json = await safeParseJson<{ id?: string }>(res);
    if (json?.id) id = json.id;
  } catch {
    // Ignore secondary write error if Firestore already stored it
  }
  return id;
}

export async function trackAnalyticsEventUnified(
  input: Parameters<typeof fsTrackAnalyticsEvent>[0]
): Promise<void> {
  fsTrackAnalyticsEvent(input).catch(() => undefined);
  fetch('/api/public/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  }).catch(() => undefined);
}

// ============================================================================
// Admin Readers (Server Persistent DB + Cloud Firestore Sync)
// ============================================================================

export async function adminFetchFullStore(): Promise<FullAdminStoreData> {
  const serverStore = await adminApiFetch<FullAdminStoreData>('/api/admin/store');

  if (await isCloudFirebaseAdminActive()) {
    try {
      const [
        fsProps,
        fsEmps,
        fsLps,
        fsLeads,
        fsClients,
        fsPipeline,
        fsVisits,
        fsProposals,
        fsTasks,
        fsMedia,
        fsAnalytics,
        fsAdmins
      ] = await Promise.all([
        fsAdminListAllProperties(),
        fsAdminListAllEmpreendimentos(),
        fsAdminListAllLandingPages(),
        fsAdminListLeads(),
        fsAdminListClients(),
        fsAdminListPipeline(),
        fsAdminListVisits(),
        fsAdminListProposals(),
        fsAdminListTasks(),
        fsAdminListMedia(),
        fsAdminListAnalytics(),
        fsAdminListUsers()
      ]);

      // If server hasn't been edited yet and Firestore already has items, use Firestore
      if (!serverStore.hasAdminEdits && (fsProps.length > 0 || fsLeads.length > 0)) {
        return {
          ...serverStore,
          properties: fsProps.length > 0 ? fsProps : serverStore.properties,
          empreendimentos: fsEmps.length > 0 ? fsEmps : serverStore.empreendimentos,
          landingPages: fsLps.length > 0 ? fsLps : serverStore.landingPages,
          leads: fsLeads.length > 0 ? fsLeads : serverStore.leads,
          clients: fsClients.length > 0 ? fsClients : serverStore.clients,
          pipeline: fsPipeline.length > 0 ? fsPipeline : serverStore.pipeline,
          visits: fsVisits.length > 0 ? fsVisits : serverStore.visits,
          proposals: fsProposals.length > 0 ? fsProposals : serverStore.proposals,
          tasks: fsTasks.length > 0 ? fsTasks : serverStore.tasks,
          media: fsMedia.length > 0 ? fsMedia : serverStore.media,
          analytics: fsAnalytics.length > 0 ? fsAnalytics : serverStore.analytics,
          adminUsers: fsAdmins.length > 0 ? fsAdmins : serverStore.adminUsers
        };
      }
    } catch {
      // Keep server store as authoritative fallback
    }
  }

  if (serverStore.hasAdminEdits) {
    writeCachedPublicSnapshot({
      hasAdminEdits: true,
      updatedAt: serverStore.updatedAt,
      siteSettings: serverStore.siteSettings,
      professionalProfile: serverStore.professionalProfile,
      properties: serverStore.properties.filter((p) => p.published),
      empreendimentos: serverStore.empreendimentos.filter((e) => e.published),
      landingPages: serverStore.landingPages.filter((l) => l.published)
    });
  }

  return serverStore;
}

export async function adminListAllProperties(): Promise<Property[]> {
  return (await adminFetchFullStore()).properties;
}

export async function adminListAllEmpreendimentos(): Promise<Empreendimento[]> {
  return (await adminFetchFullStore()).empreendimentos;
}

export async function adminListAllLandingPages(): Promise<LandingPage[]> {
  return (await adminFetchFullStore()).landingPages;
}

export async function adminListLeads(): Promise<Lead[]> {
  return (await adminFetchFullStore()).leads;
}

export async function adminListClients(): Promise<Client[]> {
  return (await adminFetchFullStore()).clients;
}

export async function adminListPipeline(): Promise<PipelineItem[]> {
  return (await adminFetchFullStore()).pipeline;
}

export async function adminListVisits(): Promise<Visit[]> {
  return (await adminFetchFullStore()).visits;
}

export async function adminListProposals(): Promise<Proposal[]> {
  return (await adminFetchFullStore()).proposals;
}

export async function adminListTasks(): Promise<Task[]> {
  return (await adminFetchFullStore()).tasks;
}

export async function adminListMedia(): Promise<MediaAsset[]> {
  return (await adminFetchFullStore()).media;
}

export async function adminListAnalytics(): Promise<AnalyticsEvent[]> {
  return (await adminFetchFullStore()).analytics;
}

export async function adminListUsers(): Promise<AdminUser[]> {
  return (await adminFetchFullStore()).adminUsers;
}

// ============================================================================
// Admin Writers (Always Persist to Server DB + Mirror to Cloud Firestore)
// ============================================================================

export async function bootstrapInitialAdminData(): Promise<void> {
  await adminApiFetch('/api/admin/store/bootstrap', { method: 'POST' });
  if (await isCloudFirebaseAdminActive()) {
    await fsBootstrapInitialFirestoreData();
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const saved = await adminApiFetch<SiteSettings>('/api/admin/store/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveSiteSettings(saved);
  }
}

export async function saveProfessionalProfile(profile: ProfessionalProfile): Promise<void> {
  const saved = await adminApiFetch<ProfessionalProfile>('/api/admin/store/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveProfessionalProfile(saved);
  }
}

export async function saveProperty(
  property: Omit<Property, 'id'> & { id?: string }
): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: Property }>('/api/admin/store/properties', {
    method: 'POST',
    body: JSON.stringify(property)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveProperty({ ...res.item, id: res.id });
  }
  return res.id;
}

export async function removeProperty(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/properties/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveProperty(id);
  }
}

export async function saveEmpreendimento(
  emp: Omit<Empreendimento, 'id'> & { id?: string }
): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: Empreendimento }>(
    '/api/admin/store/empreendimentos',
    {
      method: 'POST',
      body: JSON.stringify(emp)
    }
  );
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveEmpreendimento({ ...res.item, id: res.id });
  }
  return res.id;
}

export async function removeEmpreendimento(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/empreendimentos/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveEmpreendimento(id);
  }
}

export async function saveLandingPage(
  lp: Omit<LandingPage, 'id'> & { id?: string }
): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: LandingPage }>(
    '/api/admin/store/landing-pages',
    {
      method: 'POST',
      body: JSON.stringify(lp)
    }
  );
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveLandingPage({ ...res.item, id: res.id });
  }
  return res.id;
}

export async function removeLandingPage(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/landing-pages/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveLandingPage(id);
  }
}

export async function updateLeadAdmin(
  leadId: string,
  updates: Partial<Pick<Lead, 'score' | 'status' | 'message'>>
): Promise<void> {
  await adminApiFetch(`/api/admin/store/leads/${encodeURIComponent(leadId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsUpdateLeadAdmin(leadId, updates).catch(() => undefined);
  }
}

export async function removeLead(leadId: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/leads/${encodeURIComponent(leadId)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveLead(leadId).catch(() => undefined);
  }
}

export async function convertLeadToCrm(
  lead: Lead
): Promise<{ clientId: string; pipelineId: string }> {
  const result = await adminApiFetch<{ clientId: string; pipelineId: string }>(
    `/api/admin/store/leads/${encodeURIComponent(lead.id)}/convert`,
    {
      method: 'POST',
      body: JSON.stringify({ lead })
    }
  );
  if (await isCloudFirebaseAdminActive()) {
    await fsConvertLeadToCrm(lead).catch(() => undefined);
  }
  return result;
}

export async function saveClient(client: Omit<Client, 'id'> & { id?: string }): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: Client }>('/api/admin/store/clients', {
    method: 'POST',
    body: JSON.stringify(client)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveClient({ ...res.item, id: res.id });
  }
  return res.id;
}

export async function removeClient(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/clients/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveClient(id).catch(() => undefined);
  }
}

export async function savePipelineItem(
  item: Omit<PipelineItem, 'id'> & { id?: string }
): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: PipelineItem }>(
    '/api/admin/store/pipeline',
    {
      method: 'POST',
      body: JSON.stringify(item)
    }
  );
  if (await isCloudFirebaseAdminActive()) {
    await fsSavePipelineItem({ ...res.item, id: res.id });
  }
  return res.id;
}

export async function movePipelineStage(itemId: string, stage: PipelineStage): Promise<void> {
  await adminApiFetch(`/api/admin/store/pipeline/${encodeURIComponent(itemId)}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage })
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsMovePipelineStage(itemId, stage).catch(() => undefined);
  }
}

export async function removePipelineItem(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/pipeline/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemovePipelineItem(id).catch(() => undefined);
  }
}

export async function saveVisit(visit: Omit<Visit, 'id'> & { id?: string }): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: Visit }>('/api/admin/store/visits', {
    method: 'POST',
    body: JSON.stringify(visit)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveVisit({ ...res.item, id: res.id });
  }
  return res.id;
}

export async function removeVisit(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/visits/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveVisit(id).catch(() => undefined);
  }
}

export async function saveProposal(
  proposal: Omit<Proposal, 'id'> & { id?: string }
): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: Proposal }>('/api/admin/store/proposals', {
    method: 'POST',
    body: JSON.stringify(proposal)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveProposal({ ...res.item, id: res.id });
  }
  return res.id;
}

export async function removeProposal(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/proposals/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveProposal(id).catch(() => undefined);
  }
}

export async function saveTask(task: Omit<Task, 'id'> & { id?: string }): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: Task }>('/api/admin/store/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveTask({ ...res.item, id: res.id });
  }
  return res.id;
}

export async function removeTask(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveTask(id).catch(() => undefined);
  }
}

export async function saveMediaAsset(
  asset: Omit<MediaAsset, 'id'> & { id?: string }
): Promise<string> {
  const res = await adminApiFetch<{ id: string; item: MediaAsset }>('/api/admin/store/media', {
    method: 'POST',
    body: JSON.stringify(asset)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveMediaAsset({ ...res.item, id: res.id }).catch(() => undefined);
  }
  return res.id;
}

export async function removeMediaAsset(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/media/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveMediaAsset(id).catch(() => undefined);
  }
}

export async function saveAdminUser(uid: string, user: Omit<AdminUser, 'id'>): Promise<void> {
  await adminApiFetch(`/api/admin/store/admin-users/${encodeURIComponent(uid)}`, {
    method: 'POST',
    body: JSON.stringify(user)
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsSaveAdminUser(uid, user);
  }
}

export async function removeAdminUser(uid: string): Promise<void> {
  await adminApiFetch(`/api/admin/store/admin-users/${encodeURIComponent(uid)}`, {
    method: 'DELETE'
  });
  if (await isCloudFirebaseAdminActive()) {
    await fsRemoveAdminUser(uid);
  }
}
