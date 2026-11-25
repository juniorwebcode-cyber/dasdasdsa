import { Check, Instagram, MessageCircle } from 'lucide-react';
import type { ProfessionalProfile, SiteSettings } from '../types/realEstate';
import { buildWhatsAppUrl } from '../utils/utm';
import { ResilientImage } from '../components/common/ResilientImage';
import { LeadCaptureForm } from '../components/public/LeadCaptureForm';
import { BlurTextReveal, NumberTicker } from '../components/motion/MotionPrimitives';

export function AboutPage({
  profile,
  settings,
  onTrackWhatsApp
}: {
  profile: ProfessionalProfile;
  settings: SiteSettings;
  onTrackWhatsApp: (source: string) => void;
}) {
  const whatsappHref = buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <div className="bg-[#FAF9F6]">
      <section className="bg-[#F3F1EC] border-b border-[#E6E2DA]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-medium text-[#1E4D5C]">Sobre Mim · {profile.serviceRegion}</p>
            <BlurTextReveal
              text={profile.headline}
              className="font-display text-3xl sm:text-5xl font-semibold text-[#18181B] leading-tight"
            />
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              {profile.institutionalBio}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackWhatsApp('about')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar pelo WhatsApp</span>
              </a>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#18181B] bg-white border border-[#E6E2DA] rounded-xl"
              >
                <Instagram className="w-4 h-4 text-[#1E4D5C]" />
                <span>{profile.instagramHandle}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[460px] rounded-2xl overflow-hidden border border-[#E6E2DA] bg-white shadow-[0_12px_32px_-16px_rgba(24,24,27,0.12)]">
              <ResilientImage
                src={profile.portraitUrl}
                alt={profile.fullName}
                fallbackTitle={profile.fullName}
                className="w-full h-auto object-contain block"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="font-display text-3xl font-semibold text-[#18181B]">
            <NumberTicker value={profile.yearsConstruction || 10} /> anos na construção civil
          </h2>
          <p className="text-base text-[#52525B] leading-relaxed whitespace-pre-line">
            {profile.constructionStory}
          </p>

          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#18181B]">Dados Profissionais</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-[#71717A]">Atuação</dt>
                <dd className="font-medium text-[#18181B]">{profile.serviceRegion}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">CRECI</dt>
                <dd className="font-medium text-[#18181B]">
                  {profile.creciStatus === 'confirmado' && profile.creciNumber
                    ? profile.creciNumber
                    : 'A confirmar pela corretora'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">E-mail comercial</dt>
                <dd className="font-medium text-[#18181B]">
                  {profile.commercialEmailStatus === 'confirmado' && profile.commercialEmail
                    ? profile.commercialEmail
                    : 'A confirmar pela corretora'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#71717A]">Endereço comercial</dt>
                <dd className="font-medium text-[#18181B]">
                  {profile.commercialAddressStatus === 'confirmado' && profile.commercialAddress
                    ? profile.commercialAddress
                    : 'Atendimento agendado em Sorocaba e região'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-5">
          <LeadCaptureForm
            settings={settings}
            source="sobre_contato"
            defaultInterestType="contato"
            title="Fale diretamente com Patrícia"
            subtitle="Tire dúvidas sobre imóveis na planta, prontos ou condomínios em Sorocaba e região."
          />
        </div>
      </section>
    </div>
  );
}

export function ContactPage({
  profile,
  settings,
  onTrackWhatsApp
}: {
  profile: ProfessionalProfile;
  settings: SiteSettings;
  onTrackWhatsApp: (source: string) => void;
}) {
  const whatsappHref = buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <div className="bg-[#FAF9F6] py-14 sm:py-20">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-xs font-medium text-[#1E4D5C]">Atendimento · {profile.serviceRegion}</p>
          <h1 className="font-display text-4xl font-semibold text-[#18181B] text-balance">
            Vamos encontrar seu próximo lar em Sorocaba e região
          </h1>
          <p className="text-base text-[#52525B] leading-relaxed">{profile.institutionalBio}</p>

          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackWhatsApp('contact_page')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Oficial · (15) 99846-5635</span>
            </a>

            <ul className="space-y-2.5 text-sm text-[#52525B] pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1E4D5C]" />
                <span>Instagram: {profile.instagramHandle}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1E4D5C]" />
                <span>
                  CRECI:{' '}
                  {profile.creciStatus === 'confirmado' && profile.creciNumber
                    ? profile.creciNumber
                    : 'A confirmar'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          <LeadCaptureForm
            settings={settings}
            source="pagina_contato"
            defaultInterestType="agendamento_visita"
            showVisitDate
            title="Enviar mensagem ou agendar visita"
            subtitle="Preencha os campos abaixo e retornaremos pelo WhatsApp ou telefone informado."
          />
        </div>
      </div>
    </div>
  );
}

export function PrivacyLgpdPage({
  profile,
  settings
}: {
  profile: ProfessionalProfile;
  settings: SiteSettings;
}) {
  return (
    <div className="bg-[#FAF9F6] py-14 sm:py-20">
      <div className="max-w-[820px] mx-auto px-5 sm:px-8 space-y-8">
        <div className="space-y-3 border-b border-[#E6E2DA] pb-6">
          <p className="text-xs font-medium text-[#1E4D5C]">Transparência & LGPD</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#18181B]">
            Política de Privacidade e Proteção de Dados
          </h1>
        </div>

        <div className="space-y-6 text-sm sm:text-base text-[#52525B] leading-relaxed">
          <p>
            Este site institucional de <strong>{profile.fullName}</strong> ({profile.roleTitle})
            respeita a sua privacidade e trata os dados pessoais coletados em conformidade com a
            Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>

          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-[#18181B]">
              1. Dados coletados e finalidade
            </h2>
            <p>
              Quando você envia um formulário de contato ou agendamento de visita, coletamos nome,
              telefone/WhatsApp, e-mail (quando informado), preferências de imóvel e parâmetros de
              origem da visita (UTMs) exclusivamente para retornar seu atendimento imobiliário.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-[#18181B]">
              2. Cookies e métricas
            </h2>
            <p>{settings.lgpdNoticeText}</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-[#18181B]">
              3. Direitos do titular
            </h2>
            <p>
              Você pode solicitar confirmação, correção ou exclusão dos seus dados de contato a
              qualquer momento diretamente pelo WhatsApp oficial (15) 99846-5635.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
