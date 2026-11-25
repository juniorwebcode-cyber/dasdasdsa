import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Building,
  Calendar,
  CheckSquare,
  Database,
  ExternalLink,
  FileText,
  Home,
  Image as ImageIcon,
  Kanban,
  LogOut,
  Settings,
  Sparkles,
  UserCheck,
  Users
} from 'lucide-react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { checkUserIsAdmin } from '../services/firestoreService';
import {
  adminFetchFullStore,
  bootstrapInitialAdminData,
  checkCredentialSession,
  logoutCredentialSession
} from '../services/adminStoreService';
import type {
  AdminUser,
  AnalyticsEvent,
  Client,
  Empreendimento,
  LandingPage,
  Lead,
  MediaAsset,
  PipelineItem,
  ProfessionalProfile,
  Property,
  Proposal,
  SiteSettings,
  Task,
  Visit
} from '../types/realEstate';
import { AdminLoginGate } from '../components/admin/AdminLoginGate';
import { CrmWorkspace } from '../components/admin/CrmWorkspace';
import { ContentManager } from '../components/admin/ContentManager';
import { AnalyticsOverview, SettingsManager } from '../components/admin/SettingsAndAnalytics';

type AdminTab =
  | 'overview'
  | 'pipeline'
  | 'leads'
  | 'clients'
  | 'visits'
  | 'proposals'
  | 'tasks'
  | 'properties'
  | 'empreendimentos'
  | 'landing_pages'
  | 'media'
  | 'settings';

const NAV_GROUPS: {
  group: string;
  items: { id: AdminTab; label: string; icon: typeof BarChart3 }[];
}[] = [
  {
    group: 'CRM Imobiliário',
    items: [
      { id: 'overview', label: 'Visão Geral & Relatórios', icon: BarChart3 },
      { id: 'pipeline', label: 'Pipeline (Kanban)', icon: Kanban },
      { id: 'leads', label: 'Leads Capturados', icon: Users },
      { id: 'clients', label: 'Fichas de Clientes', icon: UserCheck },
      { id: 'visits', label: 'Agenda de Visitas', icon: Calendar },
      { id: 'proposals', label: 'Propostas & Docs', icon: FileText },
      { id: 'tasks', label: 'Tarefas & Follow-ups', icon: CheckSquare }
    ]
  },
  {
    group: 'Site & Conteúdo',
    items: [
      { id: 'properties', label: 'Imóveis', icon: Home },
      { id: 'empreendimentos', label: 'Empreendimentos', icon: Building },
      { id: 'landing_pages', label: 'Landing Page Premium', icon: Sparkles },
      { id: 'media', label: 'Mídia (Vercel Blob)', icon: ImageIcon },
      { id: 'settings', label: 'Configurações & SEO', icon: Settings }
    ]
  }
];

interface AdminDashboardProps {
  settings: SiteSettings;
  profile: ProfessionalProfile;
  onNavigate: (path: string) => void;
  onPublicDataChanged: () => Promise<void>;
}

export function AdminDashboard({
  settings,
  profile,
  onNavigate,
  onPublicDataChanged
}: AdminDashboardProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [firebaseAuthChecked, setFirebaseAuthChecked] = useState(false);
  const [credentialSessionChecked, setCredentialSessionChecked] = useState(false);
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [credentialEmail, setCredentialEmail] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loadingData, setLoadingData] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [properties, setProperties] = useState<Property[]>([]);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    let active = true;
    checkCredentialSession().then((res) => {
      if (!active) return;
      if (res.authenticated && res.email) {
        setCredentialEmail(res.email);
      }
      setCredentialSessionChecked(true);
    });

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      if (nextUser) {
        const ok = await checkUserIsAdmin(
          nextUser.uid,
          nextUser.email,
          nextUser.emailVerified
        );
        if (active) setIsFirebaseAdmin(ok);
      } else {
        setIsFirebaseAdmin(false);
      }
      if (active) setFirebaseAuthChecked(true);
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const isConfiguredConsoleAdmin =
    Boolean(user?.email) && user?.email?.trim().toLowerCase() === 'admin@x.com';
  const authLoading = !firebaseAuthChecked || !credentialSessionChecked;
  const isAuthorized = isFirebaseAdmin || isConfiguredConsoleAdmin || Boolean(credentialEmail);
  const loggedEmail = isFirebaseAdmin
    ? user?.email || credentialEmail
    : credentialEmail || (isConfiguredConsoleAdmin ? user?.email || 'admin@x.com' : null);

  const loadAllAdminData = useCallback(async () => {
    if (!isAuthorized) return;
    setLoadingData(true);
    setLoadError('');
    try {
      const full = await adminFetchFullStore();
      setProperties(full.properties);
      setEmpreendimentos(full.empreendimentos);
      setLandingPages(full.landingPages);
      setLeads(full.leads);
      setClients(full.clients);
      setPipeline(full.pipeline);
      setVisits(full.visits);
      setProposals(full.proposals);
      setTasks(full.tasks);
      setMedia(full.media);
      setAnalytics(full.analytics);
      setAdminUsers(full.adminUsers);
      await onPublicDataChanged();
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Não foi possível carregar os dados salvos.'
      );
    } finally {
      setLoadingData(false);
    }
  }, [isAuthorized, onPublicDataChanged]);

  useEffect(() => {
    if (isAuthorized) {
      loadAllAdminData();
    }
  }, [isAuthorized, loadAllAdminData]);

  const handleLogout = async () => {
    setCredentialEmail(null);
    await logoutCredentialSession();
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  if (authLoading || !isAuthorized) {
    return (
      <AdminLoginGate
        user={user}
        authLoading={authLoading}
        isAdmin={isFirebaseAdmin}
        onCredentialSuccess={(email) => setCredentialEmail(email)}
        onBackToSite={() => onNavigate('/')}
      />
    );
  }

  const handleBootstrap = async () => {
    setSeeding(true);
    try {
      await bootstrapInitialAdminData();
      await loadAllAdminData();
    } finally {
      setSeeding(false);
    }
  };

  const activeItemLabel =
    NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label || 'Painel';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] flex flex-col lg:flex-row">
      {/* Sidebar 260px */}
      <aside className="w-full lg:w-[260px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#E6E2DA] flex flex-col justify-between">
        <div className="p-5 space-y-6">
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold text-[#18181B]">
              Patrícia Vicente
            </p>
            <p className="text-xs text-[#71717A]">Painel Administrativo & CRM</p>
          </div>

          <nav className="space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.group} className="space-y-1.5">
                <p className="px-2.5 text-[11px] font-semibold text-[#71717A]">
                  {group.group}
                </p>
                <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#1E4D5C] text-white'
                            : 'text-[#52525B] hover:bg-[#F3F1EC] hover:text-[#18181B]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#E6E2DA] space-y-2 text-xs">
          <p className="text-[#52525B] truncate">{loggedEmail}</p>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1 text-[#1E4D5C] font-medium hover:underline cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ver site</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-[#71717A] hover:text-[#18181B] cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Workspace Main Viewport */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#E6E2DA] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#71717A]">
            <span>Painel</span>
            <span>/</span>
            <span className="font-semibold text-[#18181B]">{activeItemLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            {properties.length === 0 && empreendimentos.length === 0 && (
              <button
                type="button"
                disabled={seeding}
                onClick={handleBootstrap}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E4D5C] bg-[#F3F1EC] border border-[#E6E2DA] rounded-xl hover:bg-[#EAE6DF] cursor-pointer whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{seeding ? 'Salvando...' : 'Gravar catálogo inicial no Firestore'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={loadAllAdminData}
              disabled={loadingData}
              className="px-3.5 py-2 text-xs font-medium bg-white border border-[#E6E2DA] rounded-xl text-[#18181B] hover:bg-[#FAF9F6] cursor-pointer whitespace-nowrap"
            >
              {loadingData ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </header>

        <div className="p-6 max-w-[1400px] mx-auto space-y-4">
          {loadError ? (
            <div className="text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">
              {loadError}
            </div>
          ) : null}
          {activeTab === 'overview' && (
            <AnalyticsOverview
              leads={leads}
              pipeline={pipeline}
              visits={visits}
              proposals={proposals}
              analytics={analytics}
            />
          )}

          {(activeTab === 'pipeline' ||
            activeTab === 'leads' ||
            activeTab === 'clients' ||
            activeTab === 'visits' ||
            activeTab === 'proposals' ||
            activeTab === 'tasks') && (
            <CrmWorkspace
              section={activeTab}
              leads={leads}
              clients={clients}
              pipeline={pipeline}
              visits={visits}
              proposals={proposals}
              tasks={tasks}
              properties={properties}
              whatsappNumber={settings.whatsappNumber}
              onRefresh={loadAllAdminData}
            />
          )}

          {(activeTab === 'properties' ||
            activeTab === 'empreendimentos' ||
            activeTab === 'landing_pages' ||
            activeTab === 'media') && (
            <ContentManager
              section={activeTab}
              properties={properties}
              empreendimentos={empreendimentos}
              landingPages={landingPages}
              media={media}
              onRefresh={loadAllAdminData}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsManager
              settings={settings}
              profile={profile}
              adminUsers={adminUsers}
              onRefresh={loadAllAdminData}
            />
          )}
        </div>
      </main>
    </div>
  );
}
