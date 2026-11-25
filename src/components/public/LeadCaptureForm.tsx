import React, { useState } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import {
  submitPublicLeadUnified as submitPublicLead,
  trackAnalyticsEventUnified as trackAnalyticsEvent
} from '../../services/adminStoreService';
import type { Lead, SiteSettings } from '../../types/realEstate';
import { buildWhatsAppUrl, captureUtmFromLocation } from '../../utils/utm';

interface LeadCaptureFormProps {
  settings: SiteSettings;
  source: string;
  defaultInterestType?: Lead['interestType'];
  propertyId?: string;
  propertyTitle?: string;
  empreendimentoId?: string;
  showVisitDate?: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

export function LeadCaptureForm({
  settings,
  source,
  defaultInterestType = 'contato',
  propertyId,
  propertyTitle,
  empreendimentoId,
  showVisitDate = false,
  title = 'Converse com Patrícia Vicente',
  subtitle = 'Preencha seus dados para receber informações confirmadas, plantas ou agendar uma visita em Sorocaba e região.',
  submitLabel = 'Enviar solicitação'
}: LeadCaptureFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interestType, setInterestType] = useState<Lead['interestType']>(defaultInterestType);
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      setError('Informe um telefone ou WhatsApp válido com DDD.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('O e-mail informado não parece válido.');
      return;
    }
    if (!lgpdConsent) {
      setError('É necessário concordar com o uso dos dados conforme a LGPD.');
      return;
    }

    setSubmitting(true);
    try {
      const utms = captureUtmFromLocation();
      await submitPublicLead({
        name,
        phone,
        email: email.trim() || undefined,
        message: message.trim() || undefined,
        interestType,
        preferredDate: preferredDate.trim() || undefined,
        propertyId,
        propertyTitle,
        empreendimentoId,
        source,
        utmSource: utms.utmSource || undefined,
        utmMedium: utms.utmMedium || undefined,
        utmCampaign: utms.utmCampaign || undefined,
        utmContent: utms.utmContent || undefined,
        utmTerm: utms.utmTerm || undefined,
        lgpdConsent: true
      });

      await trackAnalyticsEvent({
        eventType: 'lead_submit',
        path: window.location.pathname,
        targetId: propertyId || empreendimentoId,
        source,
        utmSource: utms.utmSource || undefined,
        utmMedium: utms.utmMedium || undefined,
        utmCampaign: utms.utmCampaign || undefined
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error && !err.message.startsWith('{')
          ? err.message
          : 'Não foi possível enviar agora. Você também pode falar diretamente pelo WhatsApp.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappDirectUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    `Olá, Patrícia! Meu nome é ${name || 'cliente'} e gostaria de conversar${
      propertyTitle ? ` sobre "${propertyTitle}"` : ' sobre imóveis em Sorocaba e região'
    }.${preferredDate ? ` Preferência de data: ${preferredDate}.` : ''}`
  );

  if (submitted) {
    return (
      <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#1E4D5C]/10 text-[#1E4D5C]">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-semibold text-[#18181B]">
            Solicitação recebida com sucesso
          </h3>
          <p className="text-sm text-[#52525B] leading-relaxed">
            Seus dados foram registrados para atendimento direto com Patrícia Vicente. Caso prefira
            agilizar a conversa agora mesmo, continue pelo WhatsApp oficial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={whatsappDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl hover:bg-[#173c48] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Continuar no WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setName('');
              setPhone('');
              setEmail('');
              setMessage('');
              setPreferredDate('');
            }}
            className="px-4 py-3 text-sm font-medium text-[#52525B] hover:text-[#18181B] cursor-pointer"
          >
            Enviar outra mensagem
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-5"
    >
      <div className="space-y-1.5">
        <h3 className="font-display text-2xl font-semibold text-[#18181B]">{title}</h3>
        <p className="text-sm text-[#52525B] leading-relaxed">{subtitle}</p>
      </div>

      {error ? (
        <div
          role="alert"
          className="text-xs font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3"
        >
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#18181B]">Nome completo *</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1E4D5C]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#18181B]">WhatsApp / Telefone *</span>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(15) 99999-9999"
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1E4D5C]"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#18181B]">E-mail (opcional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1E4D5C]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#18181B]">Interesse principal</span>
          <select
            value={interestType}
            onChange={(e) => setInterestType(e.target.value as Lead['interestType'])}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] focus:outline-none focus:border-[#1E4D5C]"
          >
            <option value="contato">Atendimento geral</option>
            <option value="agendamento_visita">Agendamento de visita</option>
            <option value="na_planta">Imóveis na Planta</option>
            <option value="pronto">Imóveis Prontos</option>
            <option value="condominio">Condomínios</option>
            <option value="landing_page">Apresentação exclusiva</option>
          </select>
        </label>
      </div>

      {(showVisitDate || interestType === 'agendamento_visita') && (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#18181B]">
            Preferência de data e turno para visita
          </span>
          <input
            type="text"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            placeholder="Ex: Sábado pela manhã ou quinta às 15h"
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1E4D5C]"
          />
        </label>
      )}

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-[#18181B]">Como podemos ajudar?</span>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Conte o que você procura em Sorocaba e região (tipo de imóvel, bairro de preferência, prazo)..."
          className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1E4D5C]"
        />
      </label>

      <label className="flex items-start gap-2.5 text-xs text-[#52525B] cursor-pointer">
        <input
          type="checkbox"
          checked={lgpdConsent}
          onChange={(e) => setLgpdConsent(e.target.checked)}
          className="mt-0.5 rounded border-[#E6E2DA] text-[#1E4D5C] focus:ring-[#1E4D5C]"
        />
        <span>
          Concordo com o tratamento dos meus dados exclusivamente para retorno de atendimento e
          agendamento de visitas, conforme a LGPD.
        </span>
      </label>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl hover:bg-[#173c48] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
        >
          {submitting ? 'Enviando...' : submitLabel}
        </button>

        <a
          href={whatsappDirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-[#18181B] bg-[#F3F1EC] hover:bg-[#EAE6DF] rounded-xl transition-colors whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4 text-[#1E4D5C]" />
          <span>Ir direto ao WhatsApp</span>
        </a>
      </div>
    </form>
  );
}
