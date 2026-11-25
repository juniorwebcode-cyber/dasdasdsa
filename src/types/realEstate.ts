export type PropertyCategory = 'na_planta' | 'pronto' | 'condominio';
export type ConfirmationStatus = 'a_confirmar' | 'confirmado';
export type LeadScore = 'quente' | 'morno' | 'frio';
export type PipelineStage =
  | 'novo'
  | 'contato'
  | 'qualificado'
  | 'visita_agendada'
  | 'visita_realizada'
  | 'proposta'
  | 'negociacao'
  | 'fechado'
  | 'perdido';

export const PIPELINE_STAGES: { id: PipelineStage; label: string; description: string }[] = [
  { id: 'novo', label: 'Novo Lead', description: 'Recebido pelo site, WhatsApp ou landing page' },
  { id: 'contato', label: 'Contato', description: 'Primeiro retorno enviado pela corretora' },
  { id: 'qualificado', label: 'Qualificado', description: 'Perfil, região e objetivo alinhados' },
  { id: 'visita_agendada', label: 'Visita Agendada', description: 'Data e horário definidos com o cliente' },
  { id: 'visita_realizada', label: 'Visita Realizada', description: 'Visita concluída e percepções registradas' },
  { id: 'proposta', label: 'Proposta', description: 'Condições enviadas para análise' },
  { id: 'negociacao', label: 'Negociação', description: 'Ajuste de fluxo e documentação' },
  { id: 'fechado', label: 'Fechado', description: 'Negócio concluído com sucesso' },
  { id: 'perdido', label: 'Perdido', description: 'Oportunidade encerrada ou adiada' }
];

export const CATEGORY_LABELS: Record<PropertyCategory, string> = {
  na_planta: 'Na Planta',
  pronto: 'Pronto',
  condominio: 'Condomínio'
};

export const SCORE_LABELS: Record<LeadScore, string> = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio'
};

export interface SiteSettings {
  id?: string;
  brandName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  displayFont: string;
  bodyFont: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  instagramUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  ga4MeasurementId: string;
  gtmContainerId: string;
  googleSearchConsoleTag: string;
  googleAdsConversionId: string;
  lgpdNoticeText: string;
  updatedAt?: unknown;
}

export interface ProfessionalProfile {
  id?: string;
  fullName: string;
  roleTitle: string;
  instagramHandle: string;
  creciNumber: string;
  creciStatus: ConfirmationStatus;
  commercialEmail: string;
  commercialEmailStatus: ConfirmationStatus;
  commercialAddress: string;
  commercialAddressStatus: ConfirmationStatus;
  yearsConstruction: number;
  headline: string;
  institutionalBio: string;
  constructionStory: string;
  portraitUrl: string;
  serviceRegion: string;
  updatedAt?: unknown;
}

export interface Property {
  id: string;
  code: string;
  title: string;
  slug: string;
  category: PropertyCategory;
  transactionType: 'venda' | 'lancamento';
  region: string;
  neighborhood?: string;
  priceText: string;
  priceNumeric?: number;
  confirmationStatus: ConfirmationStatus;
  bedrooms?: string;
  suites?: string;
  bathrooms?: string;
  parkingSpaces?: string;
  areaSqm?: string;
  description?: string;
  confirmationNote?: string;
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  features?: string[];
  empreendimentoId?: string;
  featured: boolean;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Empreendimento {
  id: string;
  name: string;
  slug: string;
  category: PropertyCategory;
  region: string;
  developer?: string;
  stage: string;
  deliveryForecast?: string;
  priceRangeText?: string;
  confirmationStatus: ConfirmationStatus;
  description?: string;
  highlights?: string[];
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  featured: boolean;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  targetType: 'property' | 'empreendimento' | 'campaign';
  targetId?: string;
  isPremiumShowcase: boolean;
  heroKicker?: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroCtaLabel: string;
  heroImage?: string;
  architecturalThesis?: string;
  highlights?: string[];
  gallery?: string[];
  formTitle?: string;
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  interestType: 'contato' | 'agendamento_visita' | 'na_planta' | 'pronto' | 'condominio' | 'landing_page' | 'whatsapp';
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
  score: LeadScore;
  status: PipelineStage;
  lgpdConsent: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  origin?: string;
  score: LeadScore;
  stage: PipelineStage;
  budgetText?: string;
  preferredRegions?: string[];
  tags?: string[];
  interestPropertyIds?: string[];
  interactions?: string[];
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PipelineItem {
  id: string;
  clientId?: string;
  clientName: string;
  leadId?: string;
  propertyId?: string;
  propertyTitle?: string;
  stage: PipelineStage;
  score: LeadScore;
  estimatedValue?: number;
  tags?: string[];
  nextFollowUpAt?: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Visit {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  propertyId?: string;
  propertyTitle: string;
  scheduledAt: string;
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'reagendada';
  reminderEnabled: boolean;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Proposal {
  id: string;
  clientId?: string;
  clientName: string;
  propertyId?: string;
  propertyTitle: string;
  valueText: string;
  paymentConditions?: string;
  status: 'rascunho' | 'enviada' | 'em_analise' | 'aceita' | 'recusada';
  documentUrl?: string;
  documentName?: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  dueDate?: string;
  priority: 'alta' | 'media' | 'baixa';
  completed: boolean;
  automationTrigger?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MediaAsset {
  id: string;
  url: string;
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
  category: 'imovel' | 'empreendimento' | 'landing_page' | 'perfil' | 'documento';
  altText?: string;
  storageProvider: 'vercel_blob' | 'local_asset' | 'external_url';
  createdAt?: unknown;
}

export interface AnalyticsEvent {
  id: string;
  eventType:
    | 'page_view'
    | 'property_view'
    | 'empreendimento_view'
    | 'landing_view'
    | 'whatsapp_click'
    | 'lead_submit'
    | 'share_click';
  path: string;
  targetId?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt?: unknown;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin';
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}
