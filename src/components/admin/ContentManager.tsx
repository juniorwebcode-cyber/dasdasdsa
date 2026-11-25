import React, { useState } from 'react';
import { ExternalLink, Pencil, Star, Trash2, Upload } from 'lucide-react';
import {
  CATEGORY_LABELS,
  type ConfirmationStatus,
  type Empreendimento,
  type LandingPage,
  type MediaAsset,
  type Property,
  type PropertyCategory
} from '../../types/realEstate';
import { ASSET_IMAGES } from '../../lib/seedDefaults';
import {
  removeEmpreendimento,
  removeLandingPage,
  removeMediaAsset,
  removeProperty,
  saveEmpreendimento,
  saveLandingPage,
  saveProperty
} from '../../services/adminStoreService';
import { uploadMediaWithCompression } from '../../services/blobUploadService';
import { formatBytes } from '../../utils/mediaCompression';
import { slugifyText } from '../../utils/utm';
import { ResilientImage } from '../common/ResilientImage';
import { PropertyMediaUploader } from './PropertyMediaUploader';

interface ContentManagerProps {
  section: 'properties' | 'empreendimentos' | 'landing_pages' | 'media';
  properties: Property[];
  empreendimentos: Empreendimento[];
  landingPages: LandingPage[];
  media: MediaAsset[];
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function ContentManager({
  section,
  properties,
  empreendimentos,
  landingPages,
  media,
  onRefresh,
  onNavigate
}: ContentManagerProps) {
  // Property editor state
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propTitle, setPropTitle] = useState('');
  const [propCode, setPropCode] = useState('PV-004');
  const [propSlug, setPropSlug] = useState('');
  const [propCategory, setPropCategory] = useState<PropertyCategory>('na_planta');
  const [propTx, setPropTx] = useState<'venda' | 'lancamento'>('venda');
  const [propRegion, setPropRegion] = useState('Sorocaba e região');
  const [propNeighborhood, setPropNeighborhood] = useState('');
  const [propPriceText, setPropPriceText] = useState('Valor a confirmar');
  const [propPriceNumeric, setPropPriceNumeric] = useState('');
  const [propConfirmStatus, setPropConfirmStatus] = useState<ConfirmationStatus>('a_confirmar');
  const [propBeds, setPropBeds] = useState('A confirmar');
  const [propSuites, setPropSuites] = useState('A confirmar');
  const [propBaths, setPropBaths] = useState('A confirmar');
  const [propParking, setPropParking] = useState('A confirmar');
  const [propArea, setPropArea] = useState('A confirmar');
  const [propCover, setPropCover] = useState(ASSET_IMAGES.naPlantaLaunch);
  const [propGallery, setPropGallery] = useState<string[]>([ASSET_IMAGES.naPlantaLaunch]);
  const [propVideos, setPropVideos] = useState<string[]>([]);
  const [propDesc, setPropDesc] = useState('');
  const [propEmpId, setPropEmpId] = useState('');
  const [propFeatured, setPropFeatured] = useState(true);
  const [propPublished, setPropPublished] = useState(true);

  // Empreendimento editor state
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empName, setEmpName] = useState('');
  const [empSlug, setEmpSlug] = useState('');
  const [empCategory, setEmpCategory] = useState<PropertyCategory>('na_planta');
  const [empRegion, setEmpRegion] = useState('Sorocaba e região');
  const [empDeveloper, setEmpDeveloper] = useState('');
  const [empStage, setEmpStage] = useState('Lançamento / A confirmar');
  const [empDelivery, setEmpDelivery] = useState('A confirmar');
  const [empPriceRange, setEmpPriceRange] = useState('Valores a confirmar');
  const [empConfirmStatus, setEmpConfirmStatus] = useState<ConfirmationStatus>('a_confirmar');
  const [empCover, setEmpCover] = useState(ASSET_IMAGES.naPlantaLaunch);
  const [empGallery, setEmpGallery] = useState<string[]>([ASSET_IMAGES.naPlantaLaunch]);
  const [empVideos, setEmpVideos] = useState<string[]>([]);
  const [empDesc, setEmpDesc] = useState('');
  const [empFeatured, setEmpFeatured] = useState(true);
  const [empPublished, setEmpPublished] = useState(true);

  // Landing Page editor state
  const [editingLpId, setEditingLpId] = useState<string | null>(null);
  const [lpTitle, setLpTitle] = useState('');
  const [lpSlug, setLpSlug] = useState('');
  const [lpTargetType, setLpTargetType] = useState<'property' | 'empreendimento' | 'campaign'>('campaign');
  const [lpTargetId, setLpTargetId] = useState('');
  const [lpIsPremium, setLpIsPremium] = useState(true);
  const [lpKicker, setLpKicker] = useState('Sorocaba e região · Seleção Exclusiva');
  const [lpHeroTitle, setLpHeroTitle] = useState('');
  const [lpHeroSubtitle, setLpHeroSubtitle] = useState('');
  const [lpCtaLabel, setLpCtaLabel] = useState('Agendar conversa com Patrícia');
  const [lpHeroImage, setLpHeroImage] = useState(ASSET_IMAGES.heroArchitecture);
  const [lpThesis, setLpThesis] = useState('');
  const [lpHighlights, setLpHighlights] = useState('');
  const [lpPublished, setLpPublished] = useState(true);

  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaCategory, setMediaCategory] = useState<MediaAsset['category']>('imovel');
  const [mediaStatusMsg, setMediaStatusMsg] = useState('');

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  const resetPropForm = () => {
    setEditingPropId(null);
    setPropTitle('');
    setPropCode(`PV-${String(properties.length + 1).padStart(3, '0')}`);
    setPropSlug('');
    setPropCategory('na_planta');
    setPropTx('venda');
    setPropRegion('Sorocaba e região');
    setPropNeighborhood('');
    setPropPriceText('Valor a confirmar');
    setPropPriceNumeric('');
    setPropConfirmStatus('a_confirmar');
    setPropBeds('A confirmar');
    setPropSuites('A confirmar');
    setPropBaths('A confirmar');
    setPropParking('A confirmar');
    setPropArea('A confirmar');
    setPropCover(ASSET_IMAGES.naPlantaLaunch);
    setPropGallery([ASSET_IMAGES.naPlantaLaunch]);
    setPropVideos([]);
    setPropDesc('');
    setPropEmpId('');
    setPropFeatured(true);
    setPropPublished(true);
  };

  const startEditProp = (p: Property) => {
    const existingGallery =
      p.gallery && p.gallery.length > 0 ? p.gallery : p.coverImage ? [p.coverImage] : [];
    setEditingPropId(p.id);
    setPropTitle(p.title);
    setPropCode(p.code);
    setPropSlug(p.slug);
    setPropCategory(p.category);
    setPropTx(p.transactionType);
    setPropRegion(p.region);
    setPropNeighborhood(p.neighborhood || '');
    setPropPriceText(p.priceText);
    setPropPriceNumeric(p.priceNumeric ? String(p.priceNumeric) : '');
    setPropConfirmStatus(p.confirmationStatus);
    setPropBeds(p.bedrooms || 'A confirmar');
    setPropSuites(p.suites || 'A confirmar');
    setPropBaths(p.bathrooms || 'A confirmar');
    setPropParking(p.parkingSpaces || 'A confirmar');
    setPropArea(p.areaSqm || 'A confirmar');
    setPropCover(p.coverImage || existingGallery[0] || '');
    setPropGallery(existingGallery);
    setPropVideos(p.videos || []);
    setPropDesc(p.description || '');
    setPropEmpId(p.empreendimentoId || '');
    setPropFeatured(p.featured);
    setPropPublished(p.published);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveNotice('');
    setErrorNotice('');
    try {
      const finalGallery =
        propGallery.length > 0 ? propGallery : propCover ? [propCover] : [];
      const finalCover = propCover || finalGallery[0] || ASSET_IMAGES.naPlantaLaunch;
      await saveProperty({
        id: editingPropId || undefined,
        code: propCode,
        title: propTitle,
        slug: propSlug || slugifyText(propTitle),
        category: propCategory,
        transactionType: propTx,
        region: propRegion,
        neighborhood: propNeighborhood || undefined,
        priceText: propPriceText,
        priceNumeric: propPriceNumeric ? Number(propPriceNumeric) : undefined,
        confirmationStatus: propConfirmStatus,
        bedrooms: propBeds,
        suites: propSuites,
        bathrooms: propBaths,
        parkingSpaces: propParking,
        areaSqm: propArea,
        coverImage: finalCover,
        gallery: finalGallery.length > 0 ? finalGallery : [finalCover],
        videos: propVideos,
        description: propDesc,
        empreendimentoId: propEmpId || undefined,
        featured: propFeatured,
        published: propPublished
      });
      const wasEditing = Boolean(editingPropId);
      resetPropForm();
      await onRefresh();
      setSaveNotice(
        wasEditing
          ? 'Imóvel atualizado permanentemente no banco de dados e no site.'
          : 'Imóvel cadastrado permanentemente no banco de dados e no site.'
      );
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Não foi possível salvar o imóvel.');
    } finally {
      setSaving(false);
    }
  };

  const resetEmpForm = () => {
    setEditingEmpId(null);
    setEmpName('');
    setEmpSlug('');
    setEmpCategory('na_planta');
    setEmpRegion('Sorocaba e região');
    setEmpDeveloper('');
    setEmpStage('Lançamento / A confirmar');
    setEmpDelivery('A confirmar');
    setEmpPriceRange('Valores a confirmar');
    setEmpConfirmStatus('a_confirmar');
    setEmpCover(ASSET_IMAGES.naPlantaLaunch);
    setEmpGallery([ASSET_IMAGES.naPlantaLaunch]);
    setEmpVideos([]);
    setEmpDesc('');
    setEmpFeatured(true);
    setEmpPublished(true);
  };

  const startEditEmp = (emp: Empreendimento) => {
    const existingGallery =
      emp.gallery && emp.gallery.length > 0
        ? emp.gallery
        : emp.coverImage
          ? [emp.coverImage]
          : [];
    setEditingEmpId(emp.id);
    setEmpName(emp.name);
    setEmpSlug(emp.slug);
    setEmpCategory(emp.category);
    setEmpRegion(emp.region);
    setEmpDeveloper(emp.developer || '');
    setEmpStage(emp.stage);
    setEmpDelivery(emp.deliveryForecast || 'A confirmar');
    setEmpPriceRange(emp.priceRangeText || 'Valores a confirmar');
    setEmpConfirmStatus(emp.confirmationStatus);
    setEmpCover(emp.coverImage || existingGallery[0] || '');
    setEmpGallery(existingGallery);
    setEmpVideos(emp.videos || []);
    setEmpDesc(emp.description || '');
    setEmpFeatured(emp.featured);
    setEmpPublished(emp.published);
  };

  const handleSaveEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveNotice('');
    setErrorNotice('');
    try {
      const finalGallery = empGallery.length > 0 ? empGallery : empCover ? [empCover] : [];
      const finalCover = empCover || finalGallery[0] || ASSET_IMAGES.naPlantaLaunch;
      await saveEmpreendimento({
        id: editingEmpId || undefined,
        name: empName,
        slug: empSlug || slugifyText(empName),
        category: empCategory,
        region: empRegion,
        developer: empDeveloper || undefined,
        stage: empStage,
        deliveryForecast: empDelivery,
        priceRangeText: empPriceRange,
        confirmationStatus: empConfirmStatus,
        coverImage: finalCover,
        gallery: finalGallery.length > 0 ? finalGallery : [finalCover],
        videos: empVideos,
        description: empDesc,
        featured: empFeatured,
        published: empPublished
      });
      const wasEditing = Boolean(editingEmpId);
      resetEmpForm();
      await onRefresh();
      setSaveNotice(
        wasEditing
          ? 'Empreendimento atualizado permanentemente no banco de dados e no site.'
          : 'Empreendimento cadastrado permanentemente no banco de dados e no site.'
      );
    } catch (err) {
      setErrorNotice(
        err instanceof Error ? err.message : 'Não foi possível salvar o empreendimento.'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetLpForm = () => {
    setEditingLpId(null);
    setLpTitle('');
    setLpSlug('');
    setLpTargetType('campaign');
    setLpTargetId('');
    setLpIsPremium(true);
    setLpKicker('Sorocaba e região · Seleção Exclusiva');
    setLpHeroTitle('');
    setLpHeroSubtitle('');
    setLpCtaLabel('Agendar conversa com Patrícia');
    setLpHeroImage(ASSET_IMAGES.heroArchitecture);
    setLpThesis('');
    setLpHighlights('');
    setLpPublished(true);
  };

  const startEditLp = (lp: LandingPage) => {
    setEditingLpId(lp.id);
    setLpTitle(lp.title);
    setLpSlug(lp.slug);
    setLpTargetType(lp.targetType);
    setLpTargetId(lp.targetId || '');
    setLpIsPremium(lp.isPremiumShowcase);
    setLpKicker(lp.heroKicker || '');
    setLpHeroTitle(lp.heroTitle);
    setLpHeroSubtitle(lp.heroSubtitle || '');
    setLpCtaLabel(lp.heroCtaLabel);
    setLpHeroImage(lp.heroImage || ASSET_IMAGES.heroArchitecture);
    setLpThesis(lp.architecturalThesis || '');
    setLpHighlights((lp.highlights || []).join('\n'));
    setLpPublished(lp.published);
  };

  const handleSaveLp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveNotice('');
    setErrorNotice('');
    try {
      await saveLandingPage({
        id: editingLpId || undefined,
        title: lpTitle,
        slug: lpSlug || slugifyText(lpTitle),
        targetType: lpTargetType,
        targetId: lpTargetId || undefined,
        isPremiumShowcase: lpIsPremium,
        heroKicker: lpKicker,
        heroTitle: lpHeroTitle,
        heroSubtitle: lpHeroSubtitle,
        heroCtaLabel: lpCtaLabel,
        heroImage: lpHeroImage,
        architecturalThesis: lpThesis,
        highlights: lpHighlights
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        gallery: lpHeroImage ? [lpHeroImage] : [],
        seoTitle: lpTitle.slice(0, 120),
        seoDescription: lpHeroSubtitle.slice(0, 240),
        published: lpPublished
      });
      const wasEditing = Boolean(editingLpId);
      resetLpForm();
      await onRefresh();
      setSaveNotice(
        wasEditing
          ? 'Landing page atualizada permanentemente no banco de dados e no site.'
          : 'Landing page criada permanentemente no banco de dados e no site.'
      );
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Não foi possível salvar a landing page.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadingMedia(true);
    setMediaStatusMsg('');
    const files = Array.from(fileList);
    let totalOrig = 0;
    let totalFinal = 0;
    let usedVercelBlob = false;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadMediaWithCompression(file, {
          category: mediaCategory,
          onStageChange: (_stage, pct, detail) => {
            setMediaStatusMsg(`(${i + 1}/${files.length}) ${file.name} · ${pct}% — ${detail || ''}`);
          }
        });
        totalOrig += res.originalSizeBytes;
        totalFinal += res.uploadedSizeBytes;
        if (res.storageProvider === 'vercel_blob') usedVercelBlob = true;
      }
      const savedPct =
        totalOrig > totalFinal ? Math.round(((totalOrig - totalFinal) / totalOrig) * 100) : 0;
      setMediaStatusMsg(
        `${files.length} arquivo(s) enviado(s)${
          usedVercelBlob ? ' para Vercel Blob' : ''
        }: ${formatBytes(totalOrig)} → ${formatBytes(totalFinal)}${
          savedPct > 0 ? ` (-${savedPct}% preservando qualidade)` : ''
        }.`
      );
      await onRefresh();
    } catch (err) {
      setMediaStatusMsg(err instanceof Error ? err.message : 'Erro ao enviar arquivo.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  // =========================================================================
  // 1. PROPERTIES CRUD
  // =========================================================================
  if (section === 'properties') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveProperty}
          className="lg:col-span-5 bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-[#18181B]">
              {editingPropId ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
            </h3>
            {editingPropId ? (
              <button
                type="button"
                onClick={resetPropForm}
                className="text-xs text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                Cancelar edição
              </button>
            ) : null}
          </div>

          {saveNotice ? (
            <div className="text-xs font-medium text-[#1E4D5C] bg-[#FAF9F6] border border-[#1E4D5C]/30 rounded-xl px-3 py-2">
              {saveNotice}
            </div>
          ) : null}
          {errorNotice ? (
            <div className="text-xs font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2">
              {errorNotice}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-1 space-y-1">
              <span className="text-xs text-[#71717A]">Código *</span>
              <input
                type="text"
                required
                value={propCode}
                onChange={(e) => setPropCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
              />
            </label>
            <label className="col-span-2 space-y-1">
              <span className="text-xs text-[#71717A]">Título *</span>
              <input
                type="text"
                required
                value={propTitle}
                onChange={(e) => {
                  setPropTitle(e.target.value);
                  if (!editingPropId) setPropSlug(slugifyText(e.target.value));
                }}
                placeholder="Ex: Casa em condomínio..."
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Slug (URL compartilhável)</span>
            <input
              type="text"
              required
              value={propSlug}
              onChange={(e) => setPropSlug(slugifyText(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Categoria</span>
              <select
                value={propCategory}
                onChange={(e) => setPropCategory(e.target.value as PropertyCategory)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              >
                <option value="na_planta">Na Planta</option>
                <option value="pronto">Pronto</option>
                <option value="condominio">Condomínio</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Status dos Dados</span>
              <select
                value={propConfirmStatus}
                onChange={(e) => setPropConfirmStatus(e.target.value as ConfirmationStatus)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              >
                <option value="a_confirmar">A confirmar</option>
                <option value="confirmado">Confirmado</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Valor exibido *</span>
              <input
                type="text"
                required
                value={propPriceText}
                onChange={(e) => setPropPriceText(e.target.value)}
                placeholder="Valor a confirmar"
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Valor numérico (p/ filtro)</span>
              <input
                type="number"
                value={propPriceNumeric}
                onChange={(e) => setPropPriceNumeric(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Região *</span>
              <input
                type="text"
                required
                value={propRegion}
                onChange={(e) => setPropRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Bairro / Condomínio</span>
              <input
                type="text"
                value={propNeighborhood}
                onChange={(e) => setPropNeighborhood(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <label className="space-y-1">
              <span className="text-[11px] text-[#71717A]">Dorms</span>
              <input
                type="text"
                value={propBeds}
                onChange={(e) => setPropBeds(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[#71717A]">Suítes</span>
              <input
                type="text"
                value={propSuites}
                onChange={(e) => setPropSuites(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[#71717A]">Banh.</span>
              <input
                type="text"
                value={propBaths}
                onChange={(e) => setPropBaths(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[#71717A]">Vagas</span>
              <input
                type="text"
                value={propParking}
                onChange={(e) => setPropParking(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[#71717A]">Área</span>
              <input
                type="text"
                value={propArea}
                onChange={(e) => setPropArea(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
              />
            </label>
          </div>

          <PropertyMediaUploader
            coverImage={propCover}
            gallery={propGallery}
            videos={propVideos}
            category="imovel"
            mediaLibrary={media}
            onMediaLibraryUpdated={onRefresh}
            onChange={(next) => {
              setPropCover(next.coverImage);
              setPropGallery(next.gallery);
              setPropVideos(next.videos);
            }}
          />

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Empreendimento vinculado (opcional)</span>
            <select
              value={propEmpId}
              onChange={(e) => setPropEmpId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            >
              <option value="">Nenhum</option>
              {empreendimentos.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Descrição</span>
            <textarea
              rows={3}
              value={propDesc}
              onChange={(e) => setPropDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>

          <div className="flex items-center gap-5 text-xs text-[#52525B]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={propFeatured}
                onChange={(e) => setPropFeatured(e.target.checked)}
              />
              <span>Destaque na Home</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={propPublished}
                onChange={(e) => setPropPublished(e.target.checked)}
              />
              <span>Publicado no site</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
          >
            {saving ? 'Salvando...' : editingPropId ? 'Atualizar Imóvel' : 'Salvar Imóvel'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#E6E2DA]">
          {properties.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A]">
              Nenhum imóvel cadastrado ainda.
            </div>
          ) : (
            properties.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#F3F1EC] shrink-0">
                    <ResilientImage src={p.coverImage} alt={p.title} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] truncate">{p.title}</p>
                    <p className="text-xs text-[#71717A]">
                      {p.code} · {CATEGORY_LABELS[p.category]} ·{' '}
                      {p.published ? 'Publicado' : 'Rascunho'} · {p.priceText} ·{' '}
                      {(p.gallery?.length || (p.coverImage ? 1 : 0))} foto(s)
                      {p.videos && p.videos.length > 0 ? ` · ${p.videos.length} vídeo(s)` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/imovel/${p.slug}`)}
                    className="p-1.5 text-[#52525B] hover:text-[#1E4D5C] cursor-pointer"
                    title="Abrir página"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditProp(p)}
                    className="p-1.5 text-[#52525B] hover:text-[#18181B] cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === p.id}
                    onClick={async () => {
                      setDeletingId(p.id);
                      setSaveNotice('');
                      setErrorNotice('');
                      try {
                        await removeProperty(p.id);
                        if (editingPropId === p.id) {
                          resetPropForm();
                        }
                        await onRefresh();
                        setSaveNotice('Imóvel excluído permanentemente do banco de dados e do site.');
                      } catch (err) {
                        setErrorNotice(
                          err instanceof Error ? err.message : 'Não foi possível excluir o imóvel.'
                        );
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] disabled:opacity-40 cursor-pointer"
                    title="Excluir imóvel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. EMPREENDIMENTOS CRUD (Adicionar, Editar, Remover)
  // =========================================================================
  if (section === 'empreendimentos') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveEmp}
          className="lg:col-span-5 bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-[#18181B]">
              {editingEmpId ? 'Editar Empreendimento' : 'Adicionar Empreendimento'}
            </h3>
            {editingEmpId ? (
              <button
                type="button"
                onClick={resetEmpForm}
                className="text-xs text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          {saveNotice ? (
            <div className="text-xs font-medium text-[#1E4D5C] bg-[#FAF9F6] border border-[#1E4D5C]/30 rounded-xl px-3 py-2">
              {saveNotice}
            </div>
          ) : null}
          {errorNotice ? (
            <div className="text-xs font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2">
              {errorNotice}
            </div>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Nome do Empreendimento *</span>
            <input
              type="text"
              required
              value={empName}
              onChange={(e) => {
                setEmpName(e.target.value);
                if (!editingEmpId) setEmpSlug(slugifyText(e.target.value));
              }}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Slug (URL)</span>
            <input
              type="text"
              required
              value={empSlug}
              onChange={(e) => setEmpSlug(slugifyText(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Categoria</span>
              <select
                value={empCategory}
                onChange={(e) => setEmpCategory(e.target.value as PropertyCategory)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              >
                <option value="na_planta">Na Planta</option>
                <option value="pronto">Pronto</option>
                <option value="condominio">Condomínio</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Confirmação</span>
              <select
                value={empConfirmStatus}
                onChange={(e) => setEmpConfirmStatus(e.target.value as ConfirmationStatus)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              >
                <option value="a_confirmar">A confirmar</option>
                <option value="confirmado">Confirmado</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Região *</span>
              <input
                type="text"
                required
                value={empRegion}
                onChange={(e) => setEmpRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Estágio da obra *</span>
              <input
                type="text"
                required
                value={empStage}
                onChange={(e) => setEmpStage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Previsão de entrega</span>
              <input
                type="text"
                value={empDelivery}
                onChange={(e) => setEmpDelivery(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Faixa de valor</span>
              <input
                type="text"
                value={empPriceRange}
                onChange={(e) => setEmpPriceRange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
          </div>

          <PropertyMediaUploader
            coverImage={empCover}
            gallery={empGallery}
            videos={empVideos}
            category="empreendimento"
            mediaLibrary={media}
            onMediaLibraryUpdated={onRefresh}
            onChange={(next) => {
              setEmpCover(next.coverImage);
              setEmpGallery(next.gallery);
              setEmpVideos(next.videos);
            }}
          />

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Descrição</span>
            <textarea
              rows={3}
              value={empDesc}
              onChange={(e) => setEmpDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>

          <div className="flex items-center gap-5 text-xs text-[#52525B]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={empFeatured}
                onChange={(e) => setEmpFeatured(e.target.checked)}
              />
              <span>Destaque</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={empPublished}
                onChange={(e) => setEmpPublished(e.target.checked)}
              />
              <span>Publicado</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
          >
            {saving
              ? 'Salvando...'
              : editingEmpId
                ? 'Atualizar Empreendimento'
                : 'Salvar Empreendimento'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#E6E2DA]">
          {empreendimentos.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A]">
              Nenhum empreendimento cadastrado ainda.
            </div>
          ) : (
            empreendimentos.map((emp) => (
              <div key={emp.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#F3F1EC] shrink-0">
                    <ResilientImage src={emp.coverImage} alt={emp.name} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] truncate">{emp.name}</p>
                    <p className="text-xs text-[#71717A]">
                      {CATEGORY_LABELS[emp.category]} · {emp.stage} ·{' '}
                      {emp.published ? 'Publicado' : 'Rascunho'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/empreendimento/${emp.slug}`)}
                    className="p-1.5 text-[#52525B] hover:text-[#1E4D5C] cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditEmp(emp)}
                    className="p-1.5 text-[#52525B] hover:text-[#18181B] cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === emp.id}
                    onClick={async () => {
                      setDeletingId(emp.id);
                      setSaveNotice('');
                      setErrorNotice('');
                      try {
                        await removeEmpreendimento(emp.id);
                        if (editingEmpId === emp.id) {
                          resetEmpForm();
                        }
                        await onRefresh();
                        setSaveNotice('Empreendimento excluído permanentemente do banco de dados e do site.');
                      } catch (err) {
                        setErrorNotice(
                          err instanceof Error
                            ? err.message
                            : 'Não foi possível excluir o empreendimento.'
                        );
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] disabled:opacity-40 cursor-pointer"
                    title="Excluir empreendimento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. LANDING PAGES (Exatamente 1 Landing Page Premium Sofisticada)
  // =========================================================================
  if (section === 'landing_pages') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveLp}
          className="lg:col-span-5 bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-[#18181B]">
                {editingLpId ? 'Editar Landing Page' : 'Criar Landing Page'}
              </h3>
              {editingLpId ? (
                <button
                  type="button"
                  onClick={resetLpForm}
                  className="text-xs text-[#71717A] cursor-pointer"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
            <p className="text-xs text-[#52525B]">
              Regra ativa: apenas <strong>1 Landing Page Premium</strong> fica publicada em
              destaque por vez. Ao publicar uma nova como destaque, a anterior é automaticamente
              desativada do destaque.
            </p>
          </div>

          {saveNotice ? (
            <div className="text-xs font-medium text-[#1E4D5C] bg-[#FAF9F6] border border-[#1E4D5C]/30 rounded-xl px-3 py-2">
              {saveNotice}
            </div>
          ) : null}
          {errorNotice ? (
            <div className="text-xs font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2">
              {errorNotice}
            </div>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Título da campanha / página *</span>
            <input
              type="text"
              required
              value={lpTitle}
              onChange={(e) => {
                setLpTitle(e.target.value);
                if (!editingLpId) setLpSlug(slugifyText(e.target.value));
              }}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Slug (/lp/...)</span>
              <input
                type="text"
                required
                value={lpSlug}
                onChange={(e) => setLpSlug(slugifyText(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Vínculo</span>
              <select
                value={lpTargetType}
                onChange={(e) => setLpTargetType(e.target.value as typeof lpTargetType)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              >
                <option value="campaign">Campanha Geral</option>
                <option value="property">Imóvel Específico</option>
                <option value="empreendimento">Empreendimento</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Headline principal do Hero *</span>
            <input
              type="text"
              required
              value={lpHeroTitle}
              onChange={(e) => setLpHeroTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Subtítulo</span>
            <textarea
              rows={2}
              value={lpHeroSubtitle}
              onChange={(e) => setLpHeroSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Texto do botão CTA *</span>
              <input
                type="text"
                required
                value={lpCtaLabel}
                onChange={(e) => setLpCtaLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#71717A]">Imagem Hero (URL)</span>
              <input
                type="text"
                value={lpHeroImage}
                onChange={(e) => setLpHeroImage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Tese / Narrativa construtiva</span>
            <textarea
              rows={3}
              value={lpThesis}
              onChange={(e) => setLpThesis(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-[#71717A]">Destaques (1 por linha)</span>
            <textarea
              rows={3}
              value={lpHighlights}
              onChange={(e) => setLpHighlights(e.target.value)}
              placeholder={'01. Leitura de planta\n02. Acabamento e obra\n03. Visita acompanhada'}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>

          <div className="flex items-center gap-5 text-xs text-[#52525B]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lpIsPremium}
                onChange={(e) => setLpIsPremium(e.target.checked)}
              />
              <span>Landing Page Premium Exclusiva</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lpPublished}
                onChange={(e) => setLpPublished(e.target.checked)}
              />
              <span>Publicada</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
          >
            {saving ? 'Salvando...' : editingLpId ? 'Atualizar Landing Page' : 'Criar Landing Page'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#E6E2DA]">
          {landingPages.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A]">
              Nenhuma landing page cadastrada no Firestore ainda.
            </div>
          ) : (
            landingPages.map((lp) => (
              <div key={lp.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#18181B] truncate">{lp.title}</p>
                    {lp.isPremiumShowcase && (
                      <Star className="w-3.5 h-3.5 text-[#A67C46] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#71717A] font-mono-tabular">
                    /lp/{lp.slug} · {lp.published ? 'Publicada' : 'Rascunho'}
                    {lp.isPremiumShowcase ? ' · Showcase Premium Exclusivo' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/lp/${lp.slug}`)}
                    className="p-1.5 text-[#52525B] hover:text-[#1E4D5C] cursor-pointer"
                    title="Visualizar Landing Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditLp(lp)}
                    className="p-1.5 text-[#52525B] hover:text-[#18181B] cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === lp.id}
                    onClick={async () => {
                      setDeletingId(lp.id);
                      setSaveNotice('');
                      setErrorNotice('');
                      try {
                        await removeLandingPage(lp.id);
                        if (editingLpId === lp.id) {
                          resetLpForm();
                        }
                        await onRefresh();
                        setSaveNotice('Landing page excluída permanentemente.');
                      } catch (err) {
                        setErrorNotice(
                          err instanceof Error
                            ? err.message
                            : 'Não foi possível excluir a landing page.'
                        );
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] disabled:opacity-40 cursor-pointer"
                    title="Excluir landing page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MEDIA LIBRARY (Vercel Blob + Acervo Local)
  // =========================================================================
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-xl font-semibold text-[#18181B]">
              Biblioteca de Mídia (Vercel Blob · Sem limite)
            </h3>
            <p className="text-xs text-[#52525B]">
              Suba fotos, vídeos ou PDFs direto para o Vercel Blob com compressão inteligente que mantém a nitidez.
            </p>
            {mediaStatusMsg ? (
              <p className="text-xs font-medium text-[#1E4D5C] pt-1">{mediaStatusMsg}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={mediaCategory}
              onChange={(e) => setMediaCategory(e.target.value as MediaAsset['category'])}
              className="px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            >
              <option value="imovel">Imóvel</option>
              <option value="empreendimento">Empreendimento</option>
              <option value="landing_page">Landing Page</option>
              <option value="perfil">Perfil</option>
              <option value="documento">Documento</option>
            </select>

            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingMedia ? 'Enviando...' : 'Enviar arquivos'}</span>
              <input
                type="file"
                accept="image/*,video/*,.pdf"
                multiple
                disabled={uploadingMedia}
                onChange={handleUploadMedia}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(ASSET_IMAGES).map(([key, url]) => (
            <div
              key={key}
              className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#F3F1EC]">
                <ResilientImage src={url} alt={key} />
              </div>
              <div className="p-3 space-y-1">
                <p className="text-xs font-medium text-[#18181B] truncate">{key}</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(url)}
                  className="text-[11px] font-medium text-[#1E4D5C] hover:underline cursor-pointer"
                >
                  Copiar caminho
                </button>
              </div>
            </div>
          ))}

          {media.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#F3F1EC]">
                {item.contentType?.startsWith('video/') ? (
                  <video
                    src={item.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover bg-[#18181B]"
                  />
                ) : (
                  <ResilientImage src={item.url} alt={item.fileName} />
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-xs font-medium text-[#18181B] truncate">{item.fileName}</p>
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(item.url)}
                    className="font-medium text-[#1E4D5C] hover:underline cursor-pointer"
                  >
                    Copiar URL
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={async () => {
                      setDeletingId(item.id);
                      try {
                        await removeMediaAsset(item.id);
                        await onRefresh();
                        setMediaStatusMsg('Arquivo removido da biblioteca.');
                      } catch (err) {
                        setMediaStatusMsg(
                          err instanceof Error ? err.message : 'Não foi possível excluir o arquivo.'
                        );
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    className="text-[#A1A1AA] hover:text-[#DC2626] disabled:opacity-40 cursor-pointer"
                  >
                    {deletingId === item.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}
