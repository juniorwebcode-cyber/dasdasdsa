import React, { useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ASSET_IMAGES } from '../../lib/seedDefaults';
import type { ProfessionalProfile, SiteSettings } from '../../types/realEstate';
import { buildWhatsAppUrl } from '../../utils/utm';
import { ResilientImage } from '../common/ResilientImage';

interface FloatingSocialAndAssistantProps {
  settings: SiteSettings;
  profile: ProfessionalProfile;
  onNavigate: (path: string) => void;
  onTrackWhatsApp: (source: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  showSocialActions?: boolean;
  quickLink?: { label: string; path: string };
}

const QUICK_TOPICS = [
  { label: 'Imóveis na planta', query: 'Como funcionam os imóveis na planta?' },
  { label: 'Prontos e condomínios', query: 'Quais opções de prontos e condomínios?' },
  { label: 'Agendar visita', query: 'Como agendar uma visita em Sorocaba?' },
  { label: 'Falar nas redes', query: 'Quais são o WhatsApp e Instagram?' }
];

function WhatsAppOfficialIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16.004c0 2.352.616 4.651 1.787 6.677L2.56 29.599l7.093-1.861a13.28 13.28 0 0 0 6.351 1.613h.005c7.36 0 13.329-5.973 13.329-13.347 0-3.562-1.387-6.912-3.904-9.435a13.248 13.248 0 0 0-9.43-3.902Zm0 24.432h-.004a11.04 11.04 0 0 1-5.632-1.541l-.404-.24-4.209 1.104 1.124-4.104-.263-.42a11.036 11.036 0 0 1-1.693-5.894c0-6.101 4.965-11.067 11.081-11.067 2.957 0 5.739 1.152 7.829 3.243a11.002 11.002 0 0 1 3.243 7.829c0 6.101-4.965 11.09-11.072 11.09Zm6.074-8.288c-.333-.167-1.973-.973-2.277-1.083-.307-.112-.528-.167-.751.167-.221.333-.861 1.083-1.056 1.307-.195.221-.389.249-.723.083-.333-.167-1.407-.519-2.68-1.653-.99-.884-1.659-1.976-1.853-2.309-.195-.333-.021-.513.147-.68.149-.149.333-.389.5-.583.167-.195.221-.333.333-.556.111-.221.056-.417-.028-.583-.083-.167-.751-1.807-1.029-2.475-.271-.651-.547-.562-.751-.573l-.64-.011c-.221 0-.583.083-.888.417-.307.333-1.168 1.14-1.168 2.78 0 1.64 1.195 3.224 1.361 3.447.167.221 2.352 3.591 5.699 5.035.796.344 1.417.549 1.901.703.8.255 1.528.219 2.104.133.642-.096 1.973-.807 2.251-1.585.277-.779.277-1.445.195-1.585-.084-.14-.307-.223-.641-.391Z" />
    </svg>
  );
}

function InstagramOfficialIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm9.1 1.45a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
    </svg>
  );
}

export function FloatingSocialAndAssistant({
  settings,
  profile,
  onNavigate,
  onTrackWhatsApp
}: FloatingSocialAndAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Olá! Eu sou a Camila, assistente virtual da Patrícia Vicente. Posso tirar dúvidas básicas sobre imóveis na planta, prontos e condomínios em ${profile.serviceRegion} ou te conectar diretamente ao WhatsApp e Instagram oficiais.`,
      showSocialActions: true
    }
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    settings.whatsappDefaultMessage
  );

  const buildAssistantReply = (rawText: string): Omit<ChatMessage, 'id' | 'sender'> => {
    const q = rawText.toLowerCase();

    if (q.includes('planta') || q.includes('lançamento') || q.includes('lancamento')) {
      return {
        text: 'A Patrícia acompanha imóveis na planta com o olhar técnico de 10 anos na construção civil: análise de planta, memorial descritivo e evolução de obra. Valores e disponibilidade são confirmados na hora pelo WhatsApp.',
        showSocialActions: true,
        quickLink: { label: 'Ver imóveis na planta', path: '/na-planta' }
      };
    }

    if (q.includes('condom') || q.includes('pronto') || q.includes('casa') || q.includes('apartamento')) {
      return {
        text: 'Temos opções selecionadas de imóveis prontos e condomínios fechados em Sorocaba e região, com avaliação cuidadosa de acabamentos e estrutura durante as visitas. Você pode explorar o catálogo ou chamar a Patrícia nas redes.',
        showSocialActions: true,
        quickLink: { label: 'Explorar imóveis', path: '/comprar' }
      };
    }

    if (q.includes('visita') || q.includes('agend') || q.includes('horário') || q.includes('horario')) {
      return {
        text: 'As visitas em Sorocaba e região são agendadas diretamente com a Patrícia para garantir atendimento dedicado e informações confirmadas. Chame pelo WhatsApp ou preencha a página de contato!',
        showSocialActions: true,
        quickLink: { label: 'Ir para Contato e Visitas', path: '/contato' }
      };
    }

    if (q.includes('valor') || q.includes('preço') || q.includes('preco') || q.includes('financi')) {
      return {
        text: 'Os valores, metragens e condições são sempre confirmados diretamente pela Patrícia Vicente conforme tabela atualizada, sem estimativas genéricas. Fale com ela no WhatsApp para receber as informações exatas.',
        showSocialActions: true
      };
    }

    if (
      q.includes('whatsapp') ||
      q.includes('insta') ||
      q.includes('rede') ||
      q.includes('falar') ||
      q.includes('contato')
    ) {
      return {
        text: `Os canais oficiais da Patrícia Vicente são o WhatsApp (15) 99846-5635 e o Instagram ${profile.instagramHandle}. Escolha abaixo por onde prefere conversar:`,
        showSocialActions: true
      };
    }

    if (q.includes('quem') || q.includes('patr') || q.includes('creci') || q.includes('sobre')) {
      return {
        text: 'Patrícia Vicente é Corretora de Imóveis em Sorocaba e região, com 10 anos de experiência na construção civil antes de se dedicar a ajudar famílias a encontrarem o lar ideal.',
        showSocialActions: true,
        quickLink: { label: 'Conhecer trajetória', path: '/sobre' }
      };
    }

    return {
      text: `Posso te ajudar a navegar entre imóveis na planta, prontos e condomínios em ${profile.serviceRegion}. Para detalhes confirmados, fotos de obras e atendimento pessoal, acesse o WhatsApp ou o Instagram da Patrícia:`,
      showSocialActions: true
    };
  };

  const sendMessage = (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: clean
    };
    const reply = buildAssistantReply(clean);
    const assistantMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      sender: 'assistant',
      ...reply
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* LADO DIREITO: Botões Flutuantes Oficiais WhatsApp & Instagram */}
      <div
        aria-label="Canais sociais oficiais"
        className="fixed right-4 sm:right-6 bottom-5 z-40 flex flex-col items-end gap-3"
      >
        <a
          href={settings.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram oficial Patrícia Vicente"
          title="Instagram @patriciavicentecorretoraso"
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]"
        >
          <InstagramOfficialIcon className="w-6 h-6" />
        </a>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTrackWhatsApp('floating_whatsapp')}
          aria-label="WhatsApp oficial Patrícia Vicente"
          title="WhatsApp (15) 99846-5635"
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 bg-[#25D366]"
        >
          <WhatsAppOfficialIcon className="w-6 h-6" />
        </a>
      </div>

      {/* LADO ESQUERDO: Assistente Virtual Humanizada (Camila) */}
      <div className="fixed left-4 sm:left-6 bottom-5 z-40">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3 w-[calc(100vw-2rem)] sm:w-[360px] bg-white border border-[#E6E2DA] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Cabeçalho humanizado da Assistente */}
              <div className="px-4 py-3.5 bg-[#F3F1EC] border-b border-[#E6E2DA] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E6E2DA] shrink-0 bg-white">
                    <ResilientImage
                      src={ASSET_IMAGES.assistantAvatar}
                      alt="Camila — Assistente Virtual"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] truncate">Camila</p>
                    <p className="text-[11px] text-[#52525B] truncate">
                      Assistente · Patrícia Vicente
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fechar assistente"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#52525B] hover:bg-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conversa */}
              <div
                ref={listRef}
                className="p-4 space-y-3 max-h-[300px] overflow-y-auto bg-[#FAF9F6]"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-2 ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#1E4D5C] text-white'
                          : 'bg-white border border-[#E6E2DA] text-[#18181B]'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.sender === 'assistant' && (msg.showSocialActions || msg.quickLink) && (
                      <div className="flex flex-wrap items-center gap-1.5 max-w-[92%]">
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onTrackWhatsApp('assistant_whatsapp')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-[#25D366] rounded-lg hover:opacity-95"
                        >
                          <WhatsAppOfficialIcon className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={settings.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-white rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95"
                        >
                          <InstagramOfficialIcon className="w-3.5 h-3.5" />
                          <span>Instagram</span>
                        </a>

                        {msg.quickLink ? (
                          <button
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              onNavigate(msg.quickLink!.path);
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-medium text-[#1E4D5C] bg-white border border-[#E6E2DA] rounded-lg hover:border-[#1E4D5C] cursor-pointer"
                          >
                            {msg.quickLink.label}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tópicos rápidos */}
              <div className="px-3 py-2 bg-white border-t border-[#E6E2DA] flex gap-1.5 overflow-x-auto">
                {QUICK_TOPICS.map((topic) => (
                  <button
                    key={topic.label}
                    type="button"
                    onClick={() => sendMessage(topic.query)}
                    className="px-2.5 py-1 text-[11px] font-medium text-[#52525B] bg-[#F3F1EC] hover:bg-[#EAE6DF] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>

              {/* Campo de envio */}
              <form
                onSubmit={handleSubmit}
                className="p-2.5 bg-white border-t border-[#E6E2DA] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua dúvida básica..."
                  className="flex-1 px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1E4D5C]"
                />
                <button
                  type="submit"
                  aria-label="Enviar dúvida"
                  className="w-9 h-9 rounded-xl bg-[#1E4D5C] text-white inline-flex items-center justify-center hover:bg-[#173c48] shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão flutuante da Assistente Virtual */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label="Abrir atendimento com Camila, Assistente Virtual"
          className="inline-flex items-center gap-2.5 pr-4 pl-1.5 py-1.5 bg-white border border-[#E6E2DA] rounded-full shadow-lg hover:border-[#1E4D5C] transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#E6E2DA] shrink-0">
            <ResilientImage
              src={ASSET_IMAGES.assistantAvatar}
              alt="Camila, Assistente Virtual"
            />
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-semibold text-[#18181B] whitespace-nowrap">
              Camila
            </p>
            <p className="hidden sm:block text-[10px] text-[#52525B] whitespace-nowrap">
              Assistente Virtual · Dúvidas rápidas
            </p>
          </div>
          <MessageCircle className="w-3.5 h-3.5 text-[#1E4D5C] ml-0.5 shrink-0" />
        </button>
      </div>
    </>
  );
}
