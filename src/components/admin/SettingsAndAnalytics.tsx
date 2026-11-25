import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  PIPELINE_STAGES,
  type AdminUser,
  type AnalyticsEvent,
  type ConfirmationStatus,
  type Lead,
  type PipelineItem,
  type ProfessionalProfile,
  type Proposal,
  type SiteSettings,
  type Visit
} from '../../types/realEstate';
import {
  removeAdminUser,
  saveAdminUser,
  saveProfessionalProfile,
  saveSiteSettings
} from '../../services/adminStoreService';

export function AnalyticsOverview({
  leads,
  pipeline,
  visits,
  proposals,
  analytics
}: {
  leads: Lead[];
  pipeline: PipelineItem[];
  visits: Visit[];
  proposals: Proposal[];
  analytics: AnalyticsEvent[];
}) {
  const stats = useMemo(() => {
    const totalViews = analytics.filter((e) =>
      ['page_view', 'property_view', 'empreendimento_view', 'landing_view'].includes(e.eventType)
    ).length;
    const whatsappClicks = analytics.filter((e) => e.eventType === 'whatsapp_click').length;
    const closedDeals = pipeline.filter((p) => p.stage === 'fechado').length;
    const conversionRate =
      totalViews > 0 ? ((leads.length / totalViews) * 100).toFixed(1) : '0.0';

    const bySource: Record<string, number> = {};
    leads.forEach((l) => {
      const key = l.utmSource || l.source || 'direto';
      bySource[key] = (bySource[key] || 0) + 1;
    });

    const confirmedForecast = pipeline
      .filter((p) => p.stage !== 'perdido' && typeof p.estimatedValue === 'number')
      .reduce((acc, cur) => acc + (cur.estimatedValue || 0), 0);

    return {
      totalViews,
      whatsappClicks,
      closedDeals,
      conversionRate,
      bySource: Object.entries(bySource).sort((a, b) => b[1] - a[1]),
      confirmedForecast
    };
  }, [leads, pipeline, analytics]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Leads capturados', value: leads.length },
          { label: 'Negócios no pipeline', value: pipeline.length },
          { label: 'Visitas agendadas', value: visits.length },
          { label: 'Cliques no WhatsApp', value: stats.whatsappClicks },
          { label: 'Taxa de conversão', value: `${stats.conversionRate}%` }
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-1.5"
          >
            <p className="text-xs text-[#71717A]">{kpi.label}</p>
            <p className="font-display text-3xl font-semibold text-[#18181B] tabular-nums">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-xl font-semibold text-[#18181B]">
            Distribuição do Funil de Vendas
          </h3>
          <div className="space-y-2.5">
            {PIPELINE_STAGES.map((stage) => {
              const count = pipeline.filter((p) => p.stage === stage.id).length;
              const pct = pipeline.length > 0 ? Math.round((count / pipeline.length) * 100) : 0;
              return (
                <div key={stage.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#18181B]">{stage.label}</span>
                    <span className="font-mono-tabular text-[#52525B]">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3F1EC] overflow-hidden">
                    <div
                      className="h-full bg-[#1E4D5C] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-5">
          <h3 className="font-display text-xl font-semibold text-[#18181B]">
            Origem dos Leads & Propostas
          </h3>
          <div className="space-y-2">
            {stats.bySource.length === 0 ? (
              <p className="text-xs text-[#71717A]">
                Os canais de origem (formulários, UTMs e landing page) aparecerão aqui conforme os
                leads entrarem.
              </p>
            ) : (
              stats.bySource.map(([source, count]) => (
                <div
                  key={source}
                  className="flex items-center justify-between text-xs py-2 border-b border-[#E6E2DA] last:border-0"
                >
                  <span className="font-medium text-[#18181B]">{source}</span>
                  <span className="font-mono-tabular text-[#52525B]">{count} lead(s)</span>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-[#E6E2DA] space-y-1 text-xs text-[#52525B]">
            <p>
              Propostas registradas: <strong className="tabular-nums">{proposals.length}</strong>
            </p>
            <p>
              Negócios fechados: <strong className="tabular-nums">{stats.closedDeals}</strong>
            </p>
            <p>
              Visualizações registradas:{' '}
              <strong className="tabular-nums">{stats.totalViews}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsManager({
  settings,
  profile,
  adminUsers,
  onRefresh
}: {
  settings: SiteSettings;
  profile: ProfessionalProfile;
  adminUsers: AdminUser[];
  onRefresh: () => Promise<void>;
}) {
  const [siteForm, setSiteForm] = useState<SiteSettings>(settings);
  const [profForm, setProfForm] = useState<ProfessionalProfile>(profile);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [savedNotice, setSavedNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSiteForm(settings);
  }, [settings]);

  useEffect(() => {
    setProfForm(profile);
  }, [profile]);

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice('');
    setErrorNotice('');
    try {
      await saveSiteSettings(siteForm);
      await saveProfessionalProfile(profForm);
      await onRefresh();
      setSavedNotice('Configurações do site, perfil e integrações salvas permanentemente no banco de dados e no site.');
    } catch (err) {
      setErrorNotice(
        err instanceof Error ? err.message : 'Erro ao salvar configurações no banco de dados.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim() || !newAdminEmail.trim()) return;
    setErrorNotice('');
    try {
      await saveAdminUser(newAdminUid.trim(), {
        email: newAdminEmail.trim(),
        displayName: newAdminName.trim() || undefined,
        role: 'admin',
        active: true
      });
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      await onRefresh();
    } catch (err) {
      setErrorNotice(
        err instanceof Error ? err.message : 'Erro ao adicionar administrador.'
      );
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSaveSite} className="space-y-6">
        {savedNotice ? (
          <div className="text-xs font-medium text-[#1E4D5C] bg-white border border-[#1E4D5C]/30 rounded-xl px-4 py-3">
            {savedNotice}
          </div>
        ) : null}
        {errorNotice ? (
          <div className="text-xs font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">
            {errorNotice}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dados Profissionais & Campos Pendentes */}
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-xl font-semibold text-[#18181B]">
              Perfil Profissional & Campos Pendentes
            </h3>
            <p className="text-xs text-[#52525B]">
              Confirme aqui CRECI, e-mail e endereço comercial apenas quando estiverem validados.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Número CRECI</span>
                <input
                  type="text"
                  value={profForm.creciNumber}
                  onChange={(e) => setProfForm({ ...profForm, creciNumber: e.target.value })}
                  placeholder="A confirmar"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Status CRECI</span>
                <select
                  value={profForm.creciStatus}
                  onChange={(e) =>
                    setProfForm({ ...profForm, creciStatus: e.target.value as ConfirmationStatus })
                  }
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                >
                  <option value="a_confirmar">A confirmar</option>
                  <option value="confirmado">Confirmado (exibir no site)</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">E-mail comercial</span>
                <input
                  type="email"
                  value={profForm.commercialEmail}
                  onChange={(e) => setProfForm({ ...profForm, commercialEmail: e.target.value })}
                  placeholder="A confirmar"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Status E-mail</span>
                <select
                  value={profForm.commercialEmailStatus}
                  onChange={(e) =>
                    setProfForm({
                      ...profForm,
                      commercialEmailStatus: e.target.value as ConfirmationStatus
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                >
                  <option value="a_confirmar">A confirmar</option>
                  <option value="confirmado">Confirmado</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Endereço comercial</span>
                <input
                  type="text"
                  value={profForm.commercialAddress}
                  onChange={(e) =>
                    setProfForm({ ...profForm, commercialAddress: e.target.value })
                  }
                  placeholder="A confirmar"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Status Endereço</span>
                <select
                  value={profForm.commercialAddressStatus}
                  onChange={(e) =>
                    setProfForm({
                      ...profForm,
                      commercialAddressStatus: e.target.value as ConfirmationStatus
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                >
                  <option value="a_confirmar">A confirmar</option>
                  <option value="confirmado">Confirmado</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs text-[#71717A]">URL da foto de perfil (Seção Sobre)</span>
              <input
                type="text"
                value={profForm.portraitUrl}
                onChange={(e) => setProfForm({ ...profForm, portraitUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-[#71717A]">Apresentação institucional</span>
              <textarea
                rows={3}
                value={profForm.institutionalBio}
                onChange={(e) => setProfForm({ ...profForm, institutionalBio: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>
          </div>

          {/* Identidade Visual (Tema Claro) & SEO / GA4 */}
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-xl font-semibold text-[#18181B]">
              Identidade Visual (Tema Claro), WhatsApp & SEO
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Cor Principal</span>
                <input
                  type="color"
                  value={siteForm.primaryColor}
                  onChange={(e) => setSiteForm({ ...siteForm, primaryColor: e.target.value })}
                  className="w-full h-9 rounded-lg border border-[#E6E2DA] cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Cor de Destaque</span>
                <input
                  type="color"
                  value={siteForm.accentColor}
                  onChange={(e) => setSiteForm({ ...siteForm, accentColor: e.target.value })}
                  className="w-full h-9 rounded-lg border border-[#E6E2DA] cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Fundo Claro</span>
                <input
                  type="color"
                  value={siteForm.backgroundColor}
                  onChange={(e) => setSiteForm({ ...siteForm, backgroundColor: e.target.value })}
                  className="w-full h-9 rounded-lg border border-[#E6E2DA] cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">WhatsApp (somente dígitos)</span>
                <input
                  type="text"
                  value={siteForm.whatsappNumber}
                  onChange={(e) => setSiteForm({ ...siteForm, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">URL do Logotipo (opcional)</span>
                <input
                  type="text"
                  value={siteForm.logoUrl}
                  onChange={(e) => setSiteForm({ ...siteForm, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs text-[#71717A]">Título Hero da Home</span>
              <input
                type="text"
                value={siteForm.heroTitle}
                onChange={(e) => setSiteForm({ ...siteForm, heroTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">GA4 Measurement ID</span>
                <input
                  type="text"
                  value={siteForm.ga4MeasurementId}
                  onChange={(e) => setSiteForm({ ...siteForm, ga4MeasurementId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">GTM Container ID</span>
                <input
                  type="text"
                  value={siteForm.gtmContainerId}
                  onChange={(e) => setSiteForm({ ...siteForm, gtmContainerId: e.target.value })}
                  placeholder="GTM-XXXXXXX"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Google Search Console</span>
                <input
                  type="text"
                  value={siteForm.googleSearchConsoleTag}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, googleSearchConsoleTag: e.target.value })
                  }
                  placeholder="Token de verificação"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#71717A]">Google Ads ID</span>
                <input
                  type="text"
                  value={siteForm.googleAdsConversionId}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, googleAdsConversionId: e.target.value })
                  }
                  placeholder="AW-XXXXXXXXX"
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
        >
          {saving ? 'Salvando configurações...' : 'Salvar todas as configurações'}
        </button>
      </form>

      {/* Equipe Admin (Provisionamento de novos administradores) */}
      <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="font-display text-xl font-semibold text-[#18181B]">
            Administradores Autorizados
          </h3>
          <p className="text-xs text-[#52525B]">
            Adicione o UID e o e-mail Google da corretora Patrícia Vicente para liberar acesso total
            ao painel e ao CRM.
          </p>
        </div>

        <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            value={newAdminUid}
            onChange={(e) => setNewAdminUid(e.target.value)}
            placeholder="UID do Firebase Auth *"
            className="px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl font-mono-tabular"
          />
          <input
            type="email"
            required
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="E-mail Google *"
            className="px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
          />
          <input
            type="text"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            placeholder="Nome (ex: Patrícia Vicente)"
            className="px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
          >
            Autorizar Admin
          </button>
        </form>

        <div className="divide-y divide-[#E6E2DA]">
          {adminUsers.map((adm) => (
            <div key={adm.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <p className="font-semibold text-[#18181B]">
                  {adm.displayName || adm.email} · {adm.active ? 'Ativo' : 'Inativo'}
                </p>
                <p className="text-[#71717A] font-mono-tabular">
                  {adm.email} · UID: {adm.id}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await removeAdminUser(adm.id);
                  await onRefresh();
                }}
                className="text-[#A1A1AA] hover:text-[#DC2626] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
