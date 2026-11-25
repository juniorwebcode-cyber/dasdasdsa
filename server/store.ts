import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { del as blobDel, get as blobGet, list as blobList, put as blobPut } from '@vercel/blob';
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
} from '../src/types/realEstate.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_VERCEL = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);

function resolveDataDir(): string {
  if (IS_VERCEL) {
    return path.join(os.tmpdir(), 'pv-data');
  }
  const localDir = path.resolve(__dirname, '..', '.data');
  try {
    fs.mkdirSync(localDir, { recursive: true });
    return localDir;
  } catch {
    return path.join(os.tmpdir(), 'pv-data');
  }
}

const DATA_DIR = resolveDataDir();
const DB_FILE_PATH = path.join(DATA_DIR, 'pv-database.json');
const REMOTE_DB_PREFIX = 'pv-system/db/';
const LEGACY_REMOTE_BLOB_PATH = 'pv-system/pv-database-v1.enc';
const ENVELOPE_MAGIC = Buffer.from('PVDB1', 'ascii');

export interface PersistentDatabase {
  version: number;
  hasAdminEdits: boolean;
  updatedAt: string;
  siteSettings: SiteSettings;
  professionalProfile: ProfessionalProfile;
  properties: Property[];
  empreendimentos: Empreendimento[];
  landingPages: LandingPage[];
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

export interface PublicSiteSnapshot {
  hasAdminEdits: boolean;
  updatedAt: string;
  siteSettings: SiteSettings;
  professionalProfile: ProfessionalProfile;
  properties: Property[];
  empreendimentos: Empreendimento[];
  landingPages: LandingPage[];
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'main',
  brandName: 'Patrícia Vicente',
  tagline: 'Corretora de Imóveis em Sorocaba e Região',
  logoUrl: '/src/assets/images/logo_patricia_vicente.png',
  primaryColor: '#1E4D5C',
  accentColor: '#A67C46',
  backgroundColor: '#FAF9F6',
  displayFont: 'Playfair Display',
  bodyFont: 'Plus Jakarta Sans',
  whatsappNumber: '5515998465635',
  whatsappDefaultMessage:
    'Olá, Patrícia! Vim pelo seu site e gostaria de conversar sobre imóveis em Sorocaba e região.',
  instagramUrl: 'https://www.instagram.com/patriciavicentecorretoraso/',
  heroTitle:
    '10 anos na construção civil. Agora, ajudando você a encontrar seu lar em Sorocaba e região.',
  heroSubtitle:
    'Atendimento próximo, olhar técnico de obra e seleção transparente em imóveis na planta, prontos e condomínios.',
  heroImageUrl: '/src/assets/images/hero_sorocaba_architecture_1794928223974.jpg',
  seoTitle: 'Patrícia Vicente | Corretora de Imóveis em Sorocaba e Região',
  seoDescription:
    '10 anos na construção civil. Agora, ajudando você a encontrar seu lar em Sorocaba e região. Imóveis na planta, prontos e condomínios.',
  ga4MeasurementId: '',
  gtmContainerId: '',
  googleSearchConsoleTag: '',
  googleAdsConversionId: '',
  lgpdNoticeText:
    'Utilizamos cookies essenciais e dados de contato exclusivamente para responder às suas solicitações de atendimento e agendamento de visitas, em conformidade com a LGPD.'
};

const DEFAULT_PROFESSIONAL_PROFILE: ProfessionalProfile = {
  id: 'main',
  fullName: 'Patrícia Vicente',
  roleTitle: 'Corretora de Imóveis – Sorocaba e Região',
  instagramHandle: '@patriciavicentecorretoraso',
  creciNumber: '',
  creciStatus: 'a_confirmar',
  commercialEmail: '',
  commercialEmailStatus: 'a_confirmar',
  commercialAddress: '',
  commercialAddressStatus: 'a_confirmar',
  yearsConstruction: 10,
  headline: '10 anos na construção civil. Agora, ajudando você a encontrar seu lar.',
  institutionalBio:
    'Sou Patrícia Vicente, Corretora de Imóveis em Sorocaba e região. Com 10 anos de experiência na construção civil, hoje ajudo você a encontrar o imóvel ideal — na planta, pronto ou em condomínio. Vamos conversar?',
  constructionStory:
    'Durante uma década acompanhando de perto projetos, acabamentos, cronogramas e qualidade construtiva, aprendi a enxergar o que realmente faz diferença na vida de quem vai morar em um imóvel. Hoje trago essa vivência prática para orientar cada família com clareza técnica, sem pressa e com total transparência sobre plantas, imóveis prontos e condomínios em Sorocaba e região.',
  portraitUrl: 'https://i.postimg.cc/bw8JP4Zp/Retrato-Profissional-no-Escritorio.png',
  serviceRegion: 'Sorocaba e região'
};

const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'prop-selecao-na-planta',
    code: 'PV-001',
    title: 'Apartamentos na Planta em Sorocaba',
    slug: 'apartamentos-na-planta-sorocaba',
    category: 'na_planta',
    transactionType: 'lancamento',
    region: 'Sorocaba e região',
    neighborhood: 'Região a confirmar',
    priceText: 'Valor a confirmar',
    confirmationStatus: 'a_confirmar',
    bedrooms: 'A confirmar',
    suites: 'A confirmar',
    bathrooms: 'A confirmar',
    parkingSpaces: 'A confirmar',
    areaSqm: 'A confirmar',
    description:
      'Seleção de projetos na planta em Sorocaba com acompanhamento técnico desde a leitura do memorial descritivo até as etapas de obra. Valores, plantas disponíveis, condições de pagamento e previsão de entrega são confirmados diretamente pela corretora conforme tabela vigente.',
    confirmationNote:
      'Dados de tipologia, metragem, disponibilidade de unidades e valores sujeitos à confirmação pela corretora Patrícia Vicente.',
    coverImage: '/src/assets/images/property_na_planta_launch_1794928224518.jpg',
    gallery: [
      '/src/assets/images/property_na_planta_launch_1794928224518.jpg',
      '/src/assets/images/property_pronto_apartamento_1794928224769.jpg'
    ],
    features: [
      'Análise de planta e memorial descritivo',
      'Acompanhamento de evolução de obra',
      'Atendimento personalizado em Sorocaba e região'
    ],
    empreendimentoId: 'emp-vitrine-sorocaba',
    featured: true,
    published: true
  },
  {
    id: 'prop-selecao-pronto',
    code: 'PV-002',
    title: 'Apartamento Pronto para Morar em Sorocaba',
    slug: 'apartamento-pronto-para-morar-sorocaba',
    category: 'pronto',
    transactionType: 'venda',
    region: 'Sorocaba e região',
    neighborhood: 'Bairro a confirmar',
    priceText: 'Valor a confirmar',
    confirmationStatus: 'a_confirmar',
    bedrooms: 'A confirmar',
    suites: 'A confirmar',
    bathrooms: 'A confirmar',
    parkingSpaces: 'A confirmar',
    areaSqm: 'A confirmar',
    description:
      'Imóvel pronto avaliado com olhar prático de quem conhece construção civil: verificação cuidadosa de acabamentos, insolação, ventilação natural e potencial de personalização. Entre em contato para confirmar endereço, disponibilidade e agendar visita presencial.',
    confirmationNote:
      'Valores, metragem exata e documentação detalhada sujeitos à confirmação presencial com a corretora.',
    coverImage: '/src/assets/images/property_pronto_apartamento_1794928224769.jpg',
    gallery: [
      '/src/assets/images/property_pronto_apartamento_1794928224769.jpg',
      '/src/assets/images/hero_sorocaba_architecture_1794928223974.jpg'
    ],
    features: [
      'Vistoria com olhar técnico de construção civil',
      'Agendamento de visita acompanhada',
      'Transparência documental'
    ],
    featured: true,
    published: true
  },
  {
    id: 'prop-selecao-condominio',
    code: 'PV-003',
    title: 'Residência em Condomínio Fechado — Sorocaba e Região',
    slug: 'residencia-condominio-fechado-sorocaba-regiao',
    category: 'condominio',
    transactionType: 'venda',
    region: 'Sorocaba e região',
    neighborhood: 'Condomínio a confirmar',
    priceText: 'Valor a confirmar',
    confirmationStatus: 'a_confirmar',
    bedrooms: 'A confirmar',
    suites: 'A confirmar',
    bathrooms: 'A confirmar',
    parkingSpaces: 'A confirmar',
    areaSqm: 'A confirmar',
    description:
      'Seleção de casas e terrenos em condomínios residenciais em Sorocaba e região para quem busca convivência tranquila, área verde e qualidade construtiva. Consulte opções atualizadas e agende sua visita com orientação técnica.',
    confirmationNote:
      'Taxa condominial, metragem construída/terreno e valor de venda sujeitos à confirmação pela corretora.',
    coverImage: '/src/assets/images/property_casa_condominio_1794928224557.jpg',
    gallery: [
      '/src/assets/images/property_casa_condominio_1794928224557.jpg',
      '/src/assets/images/hero_sorocaba_architecture_1794928223974.jpg'
    ],
    features: [
      'Avaliação estrutural e de acabamentos',
      'Seleção de condomínios em Sorocaba e região',
      'Atendimento consultivo do primeiro contato à visita'
    ],
    empreendimentoId: 'emp-condominios-sorocaba',
    featured: true,
    published: true
  }
];

const DEFAULT_EMPREENDIMENTOS: Empreendimento[] = [
  {
    id: 'emp-vitrine-sorocaba',
    name: 'Seleção Empreendimentos na Planta — Sorocaba',
    slug: 'selecao-empreendimentos-na-planta-sorocaba',
    category: 'na_planta',
    region: 'Sorocaba e região',
    developer: 'A confirmar conforme projeto',
    stage: 'Lançamento / Em obras (a confirmar)',
    deliveryForecast: 'A confirmar',
    priceRangeText: 'Sob consulta — valores a confirmar',
    confirmationStatus: 'a_confirmar',
    description:
      'Portfólio de empreendimentos selecionados em Sorocaba com acompanhamento próximo sobre estágio de obra, especificações construtivas e plantas disponíveis.',
    highlights: [
      'Leitura clara do memorial de acabamentos',
      'Acompanhamento de obra e visitas técnicas',
      'Atendimento direto com Patrícia Vicente'
    ],
    coverImage: '/src/assets/images/property_na_planta_launch_1794928224518.jpg',
    gallery: [
      '/src/assets/images/property_na_planta_launch_1794928224518.jpg',
      '/src/assets/images/hero_sorocaba_architecture_1794928223974.jpg'
    ],
    featured: true,
    published: true
  },
  {
    id: 'emp-condominios-sorocaba',
    name: 'Roteiro de Condomínios Residenciais — Sorocaba e Região',
    slug: 'roteiro-condominios-residenciais-sorocaba-regiao',
    category: 'condominio',
    region: 'Sorocaba e região',
    developer: 'Diversos empreendimentos',
    stage: 'Pronto / Em expansão (a confirmar)',
    deliveryForecast: 'A confirmar',
    priceRangeText: 'Sob consulta — valores a confirmar',
    confirmationStatus: 'a_confirmar',
    description:
      'Conheça os condomínios residenciais com casas prontas ou lotes disponíveis em Sorocaba e região, com orientação prática para escolher a melhor implantação e padrão construtivo.',
    highlights: [
      'Comparativo técnico de implantação e estrutura',
      'Visitas guiadas com horário agendado',
      'Suporte transparente durante toda a escolha'
    ],
    coverImage: '/src/assets/images/property_casa_condominio_1794928224557.jpg',
    gallery: [
      '/src/assets/images/property_casa_condominio_1794928224557.jpg',
      '/src/assets/images/hero_sorocaba_architecture_1794928223974.jpg'
    ],
    featured: true,
    published: true
  }
];

const DEFAULT_LANDING_PAGE: LandingPage = {
  id: 'lp-sorocaba-exclusiva',
  title: 'Apresentação Exclusiva — Seu Lar em Sorocaba com Olhar da Construção Civil',
  slug: 'seu-lar-em-sorocaba',
  targetType: 'campaign',
  targetId: 'emp-vitrine-sorocaba',
  isPremiumShowcase: true,
  heroKicker: 'Sorocaba e região · Atendimento consultivo',
  heroTitle: 'Escolher um imóvel exige mais do que fotos bonitas: exige quem entende de obra.',
  heroSubtitle:
    'Com 10 anos de experiência na construção civil, Patrícia Vicente acompanha você na escolha segura de imóveis na planta, prontos ou em condomínios.',
  heroCtaLabel: 'Agendar conversa com Patrícia',
  heroImage: '/src/assets/images/hero_sorocaba_architecture_1794928223974.jpg',
  architecturalThesis:
    'Antes de apresentar opções, ouvimos como você e sua família vivem. A leitura técnica de plantas, insolação, materiais e cronograma de obra evita surpresas e transforma a busca pelo lar ideal em uma decisão tranquila e bem informada em Sorocaba e região.',
  highlights: [
    '01. Leitura técnica de plantas, acabamentos e memorial descritivo',
    '02. Seleção sob medida entre imóveis na planta, prontos e condomínios',
    '03. Visitas acompanhadas e informações confirmadas com transparência'
  ],
  gallery: [
    '/src/assets/images/hero_sorocaba_architecture_1794928223974.jpg',
    '/src/assets/images/property_casa_condominio_1794928224557.jpg',
    '/src/assets/images/property_na_planta_launch_1794928224518.jpg'
  ],
  formTitle: 'Solicite atendimento personalizado ou agende sua visita',
  seoTitle: 'Encontre seu Lar em Sorocaba e Região | Patrícia Vicente',
  seoDescription:
    'Atendimento imobiliário consultivo em Sorocaba com 10 anos de experiência na construção civil. Imóveis na planta, prontos e condomínios.',
  published: true
};

function createSeedDatabase(): PersistentDatabase {
  const now = new Date().toISOString();
  return {
    version: 1,
    hasAdminEdits: false,
    updatedAt: now,
    siteSettings: { ...DEFAULT_SITE_SETTINGS },
    professionalProfile: { ...DEFAULT_PROFESSIONAL_PROFILE },
    properties: DEFAULT_PROPERTIES.map((p) => ({ ...p })),
    empreendimentos: DEFAULT_EMPREENDIMENTOS.map((e) => ({ ...e })),
    landingPages: [{ ...DEFAULT_LANDING_PAGE }],
    leads: [],
    clients: [],
    pipeline: [],
    visits: [],
    proposals: [],
    tasks: [],
    media: [],
    analytics: [],
    adminUsers: []
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 110);
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeDatabase(raw: Partial<PersistentDatabase> | null | undefined): PersistentDatabase {
  const seed = createSeedDatabase();
  if (!raw || typeof raw !== 'object') return seed;

  const siteSettings: SiteSettings = raw.siteSettings
    ? { ...seed.siteSettings, ...raw.siteSettings, id: 'main' }
    : seed.siteSettings;
  if (
    typeof siteSettings.logoUrl === 'string' &&
    siteSettings.logoUrl.includes('Logo-Dourado-Patricia-Vicente-Imoveis.png')
  ) {
    siteSettings.logoUrl = seed.siteSettings.logoUrl;
  }

  const professionalProfile: ProfessionalProfile = raw.professionalProfile
    ? { ...seed.professionalProfile, ...raw.professionalProfile, id: 'main' }
    : seed.professionalProfile;
  if (
    typeof professionalProfile.portraitUrl === 'string' &&
    professionalProfile.portraitUrl.includes('patricia_construction_portrait_1794928223577')
  ) {
    professionalProfile.portraitUrl = seed.professionalProfile.portraitUrl;
  }

  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    hasAdminEdits: Boolean(raw.hasAdminEdits),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : seed.updatedAt,
    siteSettings,
    professionalProfile,
    properties: Array.isArray(raw.properties) ? raw.properties : seed.properties,
    empreendimentos: Array.isArray(raw.empreendimentos)
      ? raw.empreendimentos
      : seed.empreendimentos,
    landingPages: Array.isArray(raw.landingPages) ? raw.landingPages : seed.landingPages,
    leads: Array.isArray(raw.leads) ? raw.leads : [],
    clients: Array.isArray(raw.clients) ? raw.clients : [],
    pipeline: Array.isArray(raw.pipeline) ? raw.pipeline : [],
    visits: Array.isArray(raw.visits) ? raw.visits : [],
    proposals: Array.isArray(raw.proposals) ? raw.proposals : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    media: Array.isArray(raw.media) ? raw.media : [],
    analytics: Array.isArray(raw.analytics) ? raw.analytics : [],
    adminUsers: Array.isArray(raw.adminUsers) ? raw.adminUsers : []
  };
}

let cachedDb: PersistentDatabase | null = null;
let lastRemoteSyncAt = 0;
let lastRemoteBlobUrl: string | null = null;
let inFlightRemoteLoad: Promise<PersistentDatabase> | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();
let derivedVaultKeyCache: { source: string; key: Buffer } | null = null;

function getBlobToken(): string {
  return (process.env.BLOB_READ_WRITE_TOKEN || '').trim().replace(/^["']+|["']+$/g, '');
}

function getVaultEncryptionKey(token: string): Buffer {
  const secretSource = `${token}:${process.env.ADMIN_SESSION_SECRET || 'pv-corretora-blob-vault-v1'}`;
  if (derivedVaultKeyCache && derivedVaultKeyCache.source === secretSource) {
    return derivedVaultKeyCache.key;
  }
  const key = crypto.scryptSync(secretSource, 'pv-blob-vault-salt-2026', 32);
  derivedVaultKeyCache = { source: secretSource, key };
  return key;
}

function encryptDatabasePayload(db: PersistentDatabase, token: string): Buffer {
  const key = getVaultEncryptionKey(token);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(db), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([ENVELOPE_MAGIC, iv, authTag, encrypted]);
}

function decryptDatabasePayload(payload: Buffer, token: string): PersistentDatabase | null {
  if (payload.length < ENVELOPE_MAGIC.length + 12 + 16) return null;
  if (!payload.subarray(0, ENVELOPE_MAGIC.length).equals(ENVELOPE_MAGIC)) return null;
  const ivStart = ENVELOPE_MAGIC.length;
  const tagStart = ivStart + 12;
  const dataStart = tagStart + 16;
  const iv = payload.subarray(ivStart, tagStart);
  const authTag = payload.subarray(tagStart, dataStart);
  const ciphertext = payload.subarray(dataStart);
  const key = getVaultEncryptionKey(token);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return normalizeDatabase(JSON.parse(decrypted) as Partial<PersistentDatabase>);
}

async function readStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function loadDatabaseFromDisk(): PersistentDatabase {
  if (cachedDb) return cachedDb;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content) as Partial<PersistentDatabase>;
      cachedDb = normalizeDatabase(parsed);
      return cachedDb;
    }
  } catch {
    // Ignore local disk read errors and initialize cleanly
  }
  const initial = createSeedDatabase();
  persistDatabaseLocalSync(initial);
  cachedDb = initial;
  return cachedDb;
}

function persistDatabaseLocalSync(nextDb: PersistentDatabase): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpPath = `${DB_FILE_PATH}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(nextDb, null, 2), 'utf8');
    fs.renameSync(tmpPath, DB_FILE_PATH);
  } catch {
    // Ignore local cache write errors on constrained environments
  }
  cachedDb = nextDb;
}

let writeSeq = 0;

function makeVersionedBlobPath(): string {
  writeSeq = (writeSeq + 1) % 10000;
  const ts = String(Date.now()).padStart(15, '0');
  const seq = String(writeSeq).padStart(4, '0');
  const rand = Math.random().toString(36).slice(2, 6);
  return `${REMOTE_DB_PREFIX}v-${ts}-${seq}-${rand}.enc`;
}

async function pruneOldRemoteSnapshots(token: string, keepUrl: string): Promise<void> {
  try {
    const listed = await blobList({ prefix: REMOTE_DB_PREFIX, limit: 100, token });
    const sorted = [...listed.blobs].sort((a, b) => b.pathname.localeCompare(a.pathname));
    const toDelete = sorted.filter((b, idx) => idx >= 2 && b.url !== keepUrl).map((b) => b.url);
    if (toDelete.length > 0) {
      await blobDel(toDelete, { token });
    }
  } catch {
    // Best-effort cleanup of superseded snapshots
  }
}

async function persistDatabaseRemote(nextDb: PersistentDatabase): Promise<void> {
  const token = getBlobToken();
  if (!token) return;
  const encrypted = encryptDatabasePayload(nextDb, token);
  const blob = await blobPut(makeVersionedBlobPath(), encrypted, {
    access: 'public',
    allowOverwrite: false,
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
    contentType: 'application/octet-stream',
    token
  });
  lastRemoteBlobUrl = blob.url;
  lastRemoteSyncAt = Date.now();
  await pruneOldRemoteSnapshots(token, blob.url);
}

async function fetchEncryptedBlobBuffer(url: string): Promise<Buffer | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function syncFromRemoteBlob(force = true): Promise<PersistentDatabase> {
  const local = loadDatabaseFromDisk();
  const token = getBlobToken();
  if (!token) return local;

  if (!force && lastRemoteSyncAt > 0 && Date.now() - lastRemoteSyncAt < 250) {
    return local;
  }

  if (inFlightRemoteLoad) {
    return inFlightRemoteLoad;
  }

  inFlightRemoteLoad = (async () => {
    try {
      const listed = await blobList({ prefix: REMOTE_DB_PREFIX, limit: 100, token });
      let rawBuf: Buffer | null = null;
      let latestRemoteUrl: string | null = null;

      if (listed.blobs.length > 0) {
        const sorted = [...listed.blobs].sort((a, b) => b.pathname.localeCompare(a.pathname));
        latestRemoteUrl = sorted[0].url;
        rawBuf = await fetchEncryptedBlobBuffer(sorted[0].url);
      } else {
        const legacy = await blobGet(LEGACY_REMOTE_BLOB_PATH, {
          access: 'public',
          useCache: false,
          token
        }).catch(() => null);
        if (legacy?.stream) {
          rawBuf = await readStreamToBuffer(legacy.stream);
        }
      }

      if (rawBuf) {
        const remoteDb = decryptDatabasePayload(rawBuf, token);
        if (remoteDb) {
          const remoteTs = Date.parse(remoteDb.updatedAt || '') || 0;
          const localTs = Date.parse(local.updatedAt || '') || 0;
          const isNewRemoteSnapshot = Boolean(latestRemoteUrl && latestRemoteUrl !== lastRemoteBlobUrl);
          if (
            !local.hasAdminEdits ||
            remoteTs > localTs ||
            (remoteDb.hasAdminEdits && (remoteTs >= localTs || isNewRemoteSnapshot))
          ) {
            persistDatabaseLocalSync(remoteDb);
            if (latestRemoteUrl) lastRemoteBlobUrl = latestRemoteUrl;
            lastRemoteSyncAt = Date.now();
            return remoteDb;
          }
        }
      } else if (local.hasAdminEdits) {
        await persistDatabaseRemote(local);
      }
      lastRemoteSyncAt = Date.now();
      return cachedDb || local;
    } catch {
      return cachedDb || local;
    } finally {
      inFlightRemoteLoad = null;
    }
  })();

  return inFlightRemoteLoad;
}

export function getFullDatabase(): PersistentDatabase {
  return loadDatabaseFromDisk();
}

export async function getFullDatabaseAsync(): Promise<PersistentDatabase> {
  return syncFromRemoteBlob(true);
}

export function getPublicSnapshot(): PublicSiteSnapshot {
  const db = loadDatabaseFromDisk();
  const publishedLanding = db.landingPages.filter((lp) => lp.published);
  return {
    hasAdminEdits: db.hasAdminEdits,
    updatedAt: db.updatedAt,
    siteSettings: db.siteSettings,
    professionalProfile: db.professionalProfile,
    properties: db.properties.filter((p) => p.published),
    empreendimentos: db.empreendimentos.filter((e) => e.published),
    landingPages: publishedLanding.length > 0 ? publishedLanding : [{ ...DEFAULT_LANDING_PAGE }]
  };
}

export async function getPublicSnapshotAsync(): Promise<PublicSiteSnapshot> {
  const db = await syncFromRemoteBlob(true);
  const publishedLanding = db.landingPages.filter((lp) => lp.published);
  return {
    hasAdminEdits: db.hasAdminEdits,
    updatedAt: db.updatedAt,
    siteSettings: db.siteSettings,
    professionalProfile: db.professionalProfile,
    properties: db.properties.filter((p) => p.published),
    empreendimentos: db.empreendimentos.filter((e) => e.published),
    landingPages: publishedLanding.length > 0 ? publishedLanding : [{ ...DEFAULT_LANDING_PAGE }]
  };
}

function mutateDb<T>(
  mutator: (db: PersistentDatabase) => T,
  options?: { skipRemoteSync?: boolean }
): Promise<T> {
  const task = writeQueue.then(async () => {
    const current = await syncFromRemoteBlob(true);
    const next = JSON.parse(JSON.stringify(current)) as PersistentDatabase;
    const result = mutator(next);
    const hasRemote = Boolean(getBlobToken());
    if (!options?.skipRemoteSync || !hasRemote) {
      next.updatedAt = new Date().toISOString();
    }
    if (!options?.skipRemoteSync) {
      await persistDatabaseRemote(next);
    }
    persistDatabaseLocalSync(next);
    return result;
  });
  writeQueue = task.catch(() => undefined);
  return task;
}

export function dbSaveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  return mutateDb((db) => {
    db.hasAdminEdits = true;
    db.siteSettings = {
      ...db.siteSettings,
      ...settings,
      id: 'main',
      updatedAt: new Date().toISOString()
    };
    return db.siteSettings;
  });
}

export function dbSaveProfessionalProfile(
  profile: ProfessionalProfile
): Promise<ProfessionalProfile> {
  return mutateDb((db) => {
    db.hasAdminEdits = true;
    db.professionalProfile = {
      ...db.professionalProfile,
      ...profile,
      id: 'main',
      updatedAt: new Date().toISOString()
    };
    return db.professionalProfile;
  });
}

export function dbSaveProperty(
  input: Omit<Property, 'id'> & { id?: string }
): Promise<Property> {
  return mutateDb((db) => {
    db.hasAdminEdits = true;
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('prop');
    const existing = db.properties.find((p) => p.id === id);
    const nextItem: Property = {
      ...input,
      id,
      slug: slugify(input.slug || input.title) || id,
      gallery: Array.isArray(input.gallery) ? input.gallery.slice(0, 100) : [],
      videos: Array.isArray(input.videos) ? input.videos.slice(0, 30) : [],
      createdAt: existing?.createdAt || input.createdAt || now,
      updatedAt: now
    };
    db.properties = existing
      ? db.properties.map((p) => (p.id === id ? nextItem : p))
      : [nextItem, ...db.properties];
    return nextItem;
  });
}

export function dbDeleteProperty(id: string): Promise<void> {
  return mutateDb((db) => {
    db.hasAdminEdits = true;
    db.properties = db.properties.filter((p) => p.id !== id);
  });
}

export function dbSaveEmpreendimento(
  input: Omit<Empreendimento, 'id'> & { id?: string }
): Promise<Empreendimento> {
  return mutateDb((db) => {
    db.hasAdminEdits = true;
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('emp');
    const existing = db.empreendimentos.find((e) => e.id === id);
    const nextItem: Empreendimento = {
      ...input,
      id,
      slug: slugify(input.slug || input.name) || id,
      gallery: Array.isArray(input.gallery) ? input.gallery.slice(0, 100) : [],
      videos: Array.isArray(input.videos) ? input.videos.slice(0, 30) : [],
      createdAt: existing?.createdAt || input.createdAt || now,
      updatedAt: now
    };
    db.empreendimentos = existing
      ? db.empreendimentos.map((e) => (e.id === id ? nextItem : e))
      : [nextItem, ...db.empreendimentos];
    return nextItem;
  });
}

export function dbDeleteEmpreendimento(id: string): Promise<void> {
  return mutateDb((db) => {
    db.hasAdminEdits = true;
    db.empreendimentos = db.empreendimentos.filter((e) => e.id !== id);
  });
}

export function dbSaveLandingPage(
  input: Omit<LandingPage, 'id'> & { id?: string }
): Promise<LandingPage> {
  return mutateDb((db) => {
    db.hasAdminEdits = true;
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('lp');
    if (input.isPremiumShowcase && input.published) {
      db.landingPages = db.landingPages.map((lp) =>
        lp.id !== id ? { ...lp, isPremiumShowcase: false, updatedAt: now } : lp
      );
    }
    const existing = db.landingPages.find((lp) => lp.id === id);
    const nextItem: LandingPage = {
      ...input,
      id,
      slug: slugify(input.slug || input.title) || id,
      createdAt: existing?.createdAt || input.createdAt || now,
      updatedAt: now
    };
    db.landingPages = existing
      ? db.landingPages.map((lp) => (lp.id === id ? nextItem : lp))
      : [nextItem, ...db.landingPages];
    return nextItem;
  });
}

export function dbDeleteLandingPage(id: string): Promise<void> {
  return mutateDb((db) => {
    db.hasAdminEdits = true;
    db.landingPages = db.landingPages.filter((lp) => lp.id !== id);
  });
}

export function dbSubmitPublicLead(
  input: Omit<Lead, 'id' | 'score' | 'status' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Lead> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('lead');
    const score: Lead['score'] =
      input.interestType === 'agendamento_visita' ||
      Boolean(input.preferredDate) ||
      Boolean(input.propertyId)
        ? 'quente'
        : input.message && input.message.trim().length > 25
          ? 'morno'
          : 'frio';
    const nextLead: Lead = {
      ...input,
      id,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      message: input.message?.trim() || undefined,
      source: input.source || 'site',
      score,
      status: 'novo',
      lgpdConsent: true,
      createdAt: now,
      updatedAt: now
    };
    db.leads = [nextLead, ...db.leads.filter((l) => l.id !== id)];
    return nextLead;
  });
}

export function dbUpdateLead(
  id: string,
  updates: Partial<Pick<Lead, 'score' | 'status' | 'message'>>
): Promise<void> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    db.leads = db.leads.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: now } : l));
  });
}

export function dbDeleteLead(id: string): Promise<void> {
  return mutateDb((db) => {
    db.leads = db.leads.filter((l) => l.id !== id);
  });
}

export function dbConvertLeadToCrm(
  lead: Lead,
  forcedIds?: { clientId?: string; pipelineId?: string; taskId?: string }
): Promise<{ clientId: string; pipelineId: string }> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const clientId = forcedIds?.clientId || makeId('client');
    const pipelineId = forcedIds?.pipelineId || makeId('pipe');
    const taskId = forcedIds?.taskId || makeId('task');

    const initialInteraction = `[${new Date().toLocaleDateString('pt-BR')}] Lead capturado via ${
      lead.source
    }: ${lead.message || lead.interestType}`;

    const newClient: Client = {
      id: clientId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      origin: lead.utmSource || lead.source,
      score: lead.score,
      stage: 'contato',
      preferredRegions: ['Sorocaba e região'],
      tags: [lead.interestType, lead.utmCampaign || 'organico'].filter(Boolean),
      interestPropertyIds: lead.propertyId ? [lead.propertyId] : [],
      interactions: [initialInteraction],
      notes: lead.message || '',
      createdAt: now,
      updatedAt: now
    };

    const newPipeline: PipelineItem = {
      id: pipelineId,
      clientId,
      clientName: lead.name,
      leadId: lead.id,
      propertyId: lead.propertyId,
      propertyTitle: lead.propertyTitle,
      stage: lead.interestType === 'agendamento_visita' ? 'visita_agendada' : 'contato',
      score: lead.score,
      tags: [lead.interestType],
      notes: lead.message,
      createdAt: now,
      updatedAt: now
    };

    const newTask: Task = {
      id: taskId,
      title: `Primeiro retorno para ${lead.name}`,
      description: `Contato via ${lead.phone}${
        lead.propertyTitle ? ` sobre ${lead.propertyTitle}` : ''
      }`,
      clientId,
      clientName: lead.name,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: lead.score === 'quente' ? 'alta' : 'media',
      completed: false,
      automationTrigger: 'conversao_lead',
      createdAt: now,
      updatedAt: now
    };

    db.clients = [newClient, ...db.clients.filter((c) => c.id !== clientId)];
    db.pipeline = [newPipeline, ...db.pipeline.filter((p) => p.id !== pipelineId)];
    db.tasks = [newTask, ...db.tasks.filter((t) => t.id !== taskId)];
    db.leads = db.leads.map((l) =>
      l.id === lead.id ? { ...l, status: 'contato', updatedAt: now } : l
    );

    return { clientId, pipelineId };
  });
}

export function dbSaveClient(input: Omit<Client, 'id'> & { id?: string }): Promise<Client> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('client');
    const existing = db.clients.find((c) => c.id === id);
    const nextItem: Client = {
      ...input,
      id,
      createdAt: existing?.createdAt || input.createdAt || now,
      updatedAt: now
    };
    db.clients = existing
      ? db.clients.map((c) => (c.id === id ? nextItem : c))
      : [nextItem, ...db.clients];
    return nextItem;
  });
}

export function dbDeleteClient(id: string): Promise<void> {
  return mutateDb((db) => {
    db.clients = db.clients.filter((c) => c.id !== id);
  });
}

export function dbSavePipelineItem(
  input: Omit<PipelineItem, 'id'> & { id?: string }
): Promise<PipelineItem> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('pipe');
    const existing = db.pipeline.find((p) => p.id === id);
    const nextItem: PipelineItem = {
      ...input,
      id,
      createdAt: existing?.createdAt || input.createdAt || now,
      updatedAt: now
    };
    db.pipeline = existing
      ? db.pipeline.map((p) => (p.id === id ? nextItem : p))
      : [nextItem, ...db.pipeline];
    return nextItem;
  });
}

export function dbMovePipelineStage(id: string, stage: PipelineStage): Promise<void> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    db.pipeline = db.pipeline.map((p) => (p.id === id ? { ...p, stage, updatedAt: now } : p));
  });
}

export function dbDeletePipelineItem(id: string): Promise<void> {
  return mutateDb((db) => {
    db.pipeline = db.pipeline.filter((p) => p.id !== id);
  });
}

export function dbSaveVisit(input: Omit<Visit, 'id'> & { id?: string }): Promise<Visit> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('visit');
    const existing = db.visits.find((v) => v.id === id);
    const nextItem: Visit = {
      ...input,
      id,
      createdAt: existing?.createdAt || input.createdAt || now,
      updatedAt: now
    };
    db.visits = existing
      ? db.visits.map((v) => (v.id === id ? nextItem : v))
      : [nextItem, ...db.visits];

    if (!existing) {
      db.tasks = [
        {
          id: makeId('task'),
          title: `Confirmar visita com ${input.clientName}`,
          description: `Imóvel: ${input.propertyTitle} · Horário: ${input.scheduledAt}`,
          dueDate: input.scheduledAt.slice(0, 10),
          priority: 'alta',
          completed: false,
          automationTrigger: 'visita_agendada',
          createdAt: now,
          updatedAt: now
        },
        ...db.tasks
      ];
    }
    return nextItem;
  });
}

export function dbDeleteVisit(id: string): Promise<void> {
  return mutateDb((db) => {
    db.visits = db.visits.filter((v) => v.id !== id);
  });
}

export function dbSaveProposal(
  input: Omit<Proposal, 'id'> & { id?: string }
): Promise<Proposal> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('prop-doc');
    const existing = db.proposals.find((p) => p.id === id);
    const nextItem: Proposal = {
      ...input,
      id,
      createdAt: existing?.createdAt || input.createdAt || now,
      updatedAt: now
    };
    db.proposals = existing
      ? db.proposals.map((p) => (p.id === id ? nextItem : p))
      : [nextItem, ...db.proposals];
    return nextItem;
  });
}

export function dbDeleteProposal(id: string): Promise<void> {
  return mutateDb((db) => {
    db.proposals = db.proposals.filter((p) => p.id !== id);
  });
}

export function dbSaveTask(input: Omit<Task, 'id'> & { id?: string }): Promise<Task> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('task');
    const existing = db.tasks.find((t) => t.id === id);
    const nextItem: Task = {
      ...input,
      id,
      createdAt: existing?.createdAt || input.createdAt || now,
      updatedAt: now
    };
    db.tasks = existing
      ? db.tasks.map((t) => (t.id === id ? nextItem : t))
      : [nextItem, ...db.tasks];
    return nextItem;
  });
}

export function dbDeleteTask(id: string): Promise<void> {
  return mutateDb((db) => {
    db.tasks = db.tasks.filter((t) => t.id !== id);
  });
}

export function dbSaveMediaAsset(
  input: Omit<MediaAsset, 'id'> & { id?: string }
): Promise<MediaAsset> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const id = input.id?.trim() || makeId('media');
    const nextItem: MediaAsset = {
      ...input,
      id,
      createdAt: input.createdAt || now
    };
    db.media = [nextItem, ...db.media.filter((m) => m.id !== id)];
    return nextItem;
  });
}

export function dbDeleteMediaAsset(id: string): Promise<void> {
  return mutateDb((db) => {
    db.media = db.media.filter((m) => m.id !== id);
  });
}

export function dbSaveAdminUser(uid: string, user: Omit<AdminUser, 'id'>): Promise<AdminUser> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const existing = db.adminUsers.find((u) => u.id === uid);
    const nextItem: AdminUser = {
      ...user,
      id: uid,
      createdAt: existing?.createdAt || now
    };
    db.adminUsers = existing
      ? db.adminUsers.map((u) => (u.id === uid ? nextItem : u))
      : [nextItem, ...db.adminUsers];
    return nextItem;
  });
}

export function dbDeleteAdminUser(uid: string): Promise<void> {
  return mutateDb((db) => {
    db.adminUsers = db.adminUsers.filter((u) => u.id !== uid);
  });
}

export function dbRecordAnalytics(
  input: Omit<AnalyticsEvent, 'id' | 'createdAt'>
): Promise<void> {
  return mutateDb(
    (db) => {
      const evt: AnalyticsEvent = {
        ...input,
        id: makeId('evt'),
        path: input.path || '/',
        createdAt: new Date().toISOString()
      };
      db.analytics = [evt, ...db.analytics].slice(0, 1000);
    },
    { skipRemoteSync: input.eventType === 'page_view' }
  );
}

export function dbBootstrapDefaults(): Promise<PersistentDatabase> {
  return mutateDb((db) => {
    const seed = createSeedDatabase();
    if (db.properties.length === 0) db.properties = seed.properties;
    if (db.empreendimentos.length === 0) db.empreendimentos = seed.empreendimentos;
    if (db.landingPages.length === 0) db.landingPages = seed.landingPages;
    return db;
  });
}
