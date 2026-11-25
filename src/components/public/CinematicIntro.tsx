import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface CinematicIntroProps {
  brokerName?: string;
  onComplete: () => void;
}

const ARCHITECTURAL_EASE = [0.22, 1, 0.36, 1] as const;

export function CinematicIntro({
  brokerName = 'Patrícia Vicente',
  onComplete
}: CinematicIntroProps) {
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    document.body.style.overflow = '';
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (prefersReduced) {
      const quickTimer = window.setTimeout(() => setExiting(true), 500);
      const doneTimer = window.setTimeout(finish, 950);
      timersRef.current.push(quickTimer, doneTimer);
    } else {
      const fadeTimer = window.setTimeout(() => setExiting(true), 6200);
      const completeTimer = window.setTimeout(finish, 7000);
      timersRef.current.push(fadeTimer, completeTimer);
    }

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
      document.body.style.overflow = prevOverflow;
    };
  }, [finish]);

  const handleSkip = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setExiting(true);
    const skipTimer = window.setTimeout(finish, 420);
    timersRef.current.push(skipTimer);
  };

  return (
    <motion.div
      role="region"
      aria-label="Apresentação Patrícia Vicente"
      initial={{ opacity: 1 }}
      animate={
        exiting
          ? { opacity: 0, scale: 1.03, filter: 'blur(8px)' }
          : { opacity: 1, scale: 1, filter: 'blur(0px)' }
      }
      transition={{ duration: 0.8, ease: ARCHITECTURAL_EASE }}
      className="fixed inset-0 z-50 bg-[#FAF9F6] flex items-center justify-center overflow-hidden select-none"
    >
      {/* Atmosfera natural de papel arquitetônico iluminado por luz solar suave (sem caixas ou bordas) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 42%, rgba(255,255,255,0.88) 0%, rgba(243,241,236,0.55) 55%, rgba(235,230,220,0.65) 100%)'
        }}
      />

      {/* Feixe de luz dourada cinematográfica atravessando a cena */}
      <motion.div
        aria-hidden="true"
        initial={{ x: '-45%', opacity: 0 }}
        animate={{ x: '115%', opacity: [0, 0.55, 0.45, 0] }}
        transition={{ duration: 6.4, ease: 'easeInOut' }}
        className="absolute inset-y-0 w-[42vw] pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 0%, rgba(212,175,55,0.08) 45%, rgba(255,255,255,0.35) 52%, transparent 100%)',
          transform: 'skewX(-14deg)'
        }}
      />

      {/* Cena livre em tela cheia, sem quadrado nem círculo */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0.92 }}
        animate={{ scale: 1.025, opacity: 1 }}
        transition={{ duration: 6.8, ease: 'easeOut' }}
        className="relative z-10 w-[96vw] max-w-[1180px] px-2 sm:px-6 flex flex-col items-center justify-center"
      >
        <svg
          viewBox="0 0 1100 580"
          className="w-full h-auto max-h-[82vh] overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Textura sutil orgânica de papel para realismo tátil */}
            <filter id="pv-ink-soft" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="0.35" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradiente metálico realista para traços dourados */}
            <linearGradient id="pv-gold-stroke" x1="0%" y1="0%" x2="100%" y2="30%">
              <stop offset="0%" stopColor="#8C622E" />
              <stop offset="38%" stopColor="#C99A49" />
              <stop offset="68%" stopColor="#A67C46" />
              <stop offset="100%" stopColor="#7C5425" />
            </linearGradient>

            {/* Gradiente de sombra arquitetônica realista */}
            <linearGradient id="pv-facade-wash" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EFECE5" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#E3DDD1" stopOpacity="0.45" />
            </linearGradient>

            <linearGradient id="pv-roof-wash" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C99A49" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8C622E" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="pv-glass-wash" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E4D5C" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#7FA3AE" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#1E4D5C" stopOpacity="0.06" />
            </linearGradient>

            <linearGradient id="pv-ground-wash" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4CFC5" stopOpacity="0" />
              <stop offset="25%" stopColor="#D4CFC5" stopOpacity="0.32" />
              <stop offset="75%" stopColor="#D4CFC5" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#D4CFC5" stopOpacity="0" />
            </linearGradient>

            {/* Gradiente de tinta manuscrita realista */}
            <linearGradient id="pv-handwriting-ink" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#18181B" />
              <stop offset="48%" stopColor="#2A2622" />
              <stop offset="78%" stopColor="#7A5628" />
              <stop offset="100%" stopColor="#18181B" />
            </linearGradient>

            {/* Máscara contínua de escrita à mão da esquerda para a direita */}
            <linearGradient id="pv-mask-feather" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="92%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            <mask id="pv-handwriting-mask">
              <motion.rect
                x="110"
                y="340"
                height="160"
                fill="url(#pv-mask-feather)"
                initial={{ width: 0 }}
                animate={{ width: 900 }}
                transition={{ delay: 3.15, duration: 2.15, ease: [0.37, 0, 0.63, 1] }}
              />
            </mask>
          </defs>

          {/* 1. LINHAS DE CONSTRUÇÃO ARQUITETÔNICA A LÁPIS (surgem e suavizam como rascunho real) */}
          <motion.g
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0.16 }}
            transition={{ delay: 2.6, duration: 1.4 }}
            stroke="#A67C46"
            strokeWidth="0.75"
            strokeDasharray="4 5"
            fill="none"
          >
            <motion.path
              d="M 80 326 L 1020 326"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: ARCHITECTURAL_EASE }}
            />
            <motion.path
              d="M 520 48 L 520 342"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.15, duration: 0.85, ease: ARCHITECTURAL_EASE }}
            />
            <motion.path
              d="M 210 212 L 520 76 L 860 212"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.25, duration: 1.1, ease: ARCHITECTURAL_EASE }}
            />
          </motion.g>

          {/* 2. SOMBREAMENTO E LAVAGEM REALISTA DE LUZ (aparece suavemente após o contorno) */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.45, duration: 1.5, ease: 'easeOut' }}
          >
            {/* Sombra suave no solo */}
            <polygon points="180,326 920,326 880,342 220,342" fill="url(#pv-ground-wash)" />
            {/* Volumetria principal da fachada */}
            <polygon points="365,204 520,104 685,200 685,326 365,326" fill="url(#pv-facade-wash)" />
            {/* Plano lateral em perspectiva */}
            <polygon points="685,200 825,214 825,326 685,326" fill="#E9E4DA" fillOpacity="0.6" />
            {/* Ala esquerda contemporânea */}
            <polygon points="240,224 365,208 365,326 240,326" fill="#F2EFE8" fillOpacity="0.8" />
            {/* Sombreamento sob o beiral do telhado */}
            <polygon points="338,210 520,86 710,198 696,208 520,103 352,216" fill="url(#pv-roof-wash)" />
            {/* Vidraças com reflexo céu/petróleo */}
            <polygon points="484,142 556,142 556,232 484,232" fill="url(#pv-glass-wash)" />
            <polygon points="712,238 800,242 800,326 712,326" fill="url(#pv-glass-wash)" />
            <polygon points="264,254 338,248 338,308 264,308" fill="url(#pv-glass-wash)" />
            {/* Porta principal acolhedora em madeira nobre */}
            <rect x="498" y="252" width="44" height="74" fill="#A67C46" fillOpacity="0.28" />
          </motion.g>

          {/* 3. DESENHO ARQUITETÔNICO DA CASA TRAÇO POR TRAÇO */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#pv-ink-soft)">
            {/* Base e degraus de entrada */}
            <motion.path
              d="M 145 326 L 955 326"
              stroke="#18181B"
              strokeWidth="1.6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.25, duration: 1.0, ease: ARCHITECTURAL_EASE }}
            />
            <motion.path
              d="M 468 326 L 456 334 L 584 334 L 572 326"
              stroke="#52525B"
              strokeWidth="1.2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.65, duration: 0.7, ease: ARCHITECTURAL_EASE }}
            />

            {/* Ala esquerda com marquise horizontal moderna */}
            <motion.path
              d="M 226 226 L 368 208 M 240 226 L 240 326 M 226 226 L 226 234 L 365 217"
              stroke="#18181B"
              strokeWidth="1.7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.7, duration: 0.95, ease: ARCHITECTURAL_EASE }}
            />

            {/* Telhado principal duas águas com espessura de beiral */}
            <motion.path
              d="M 332 212 L 520 82 L 716 200"
              stroke="url(#pv-gold-stroke)"
              strokeWidth="3.2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.95, duration: 1.15, ease: ARCHITECTURAL_EASE }}
            />
            <motion.path
              d="M 340 220 L 520 96 L 706 208"
              stroke="#18181B"
              strokeWidth="1.6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.15, duration: 1.05, ease: ARCHITECTURAL_EASE }}
            />

            {/* Chaminé arquitetônica */}
            <motion.path
              d="M 612 134 L 612 90 L 642 90 L 642 152 M 608 90 L 646 90"
              stroke="url(#pv-gold-stroke)"
              strokeWidth="2.0"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.45, duration: 0.65, ease: ARCHITECTURAL_EASE }}
            />

            {/* Colunas e paredes principais + ala direita em perspectiva */}
            <motion.path
              d="M 365 204 L 365 326 M 685 196 L 685 326 M 685 200 L 836 214 L 836 222 L 685 209 M 825 221 L 825 326"
              stroke="#18181B"
              strokeWidth="1.75"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.35, duration: 1.1, ease: ARCHITECTURAL_EASE }}
            />

            {/* Grande janela panorâmica superior + caixilhos + reflexos no vidro */}
            <motion.path
              d="M 484 142 L 556 142 L 556 232 L 484 232 Z M 520 142 L 520 232 M 484 186 L 556 186"
              stroke="#1E4D5C"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.85, duration: 0.9, ease: ARCHITECTURAL_EASE }}
            />
            <motion.path
              d="M 493 175 L 512 151 M 530 222 L 548 197"
              stroke="#1E4D5C"
              strokeOpacity="0.45"
              strokeWidth="1.0"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.25, duration: 0.5, ease: ARCHITECTURAL_EASE }}
            />

            {/* Porta principal e pórtico de entrada */}
            <motion.path
              d="M 476 246 L 564 246 M 498 326 L 498 252 L 542 252 L 542 326 M 534 289 L 534 295"
              stroke="#18181B"
              strokeWidth="1.65"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.1, duration: 0.85, ease: ARCHITECTURAL_EASE }}
            />

            {/* Janelas das alas laterais + pérgola de varanda */}
            <motion.path
              d="M 264 254 L 338 248 L 338 308 L 264 308 Z M 301 251 L 301 308 M 712 238 L 800 242 L 800 326 M 756 240 L 756 326 M 712 284 L 800 286"
              stroke="#1E4D5C"
              strokeWidth="1.4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.3, duration: 0.95, ease: ARCHITECTURAL_EASE }}
            />

            {/* Vegetação arquitetônica orgânica nas laterais */}
            <motion.path
              d="M 194 326 C 186 285, 192 232, 206 196 C 218 232, 224 285, 216 326 M 168 326 C 165 304, 174 286, 184 294 M 856 326 C 850 296, 862 252, 874 226 C 884 254, 892 296, 886 326 M 902 326 C 906 306, 918 294, 926 306"
              stroke="#52525B"
              strokeWidth="1.35"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.55, duration: 0.9, ease: ARCHITECTURAL_EASE }}
            />
          </g>

          {/* 4. ASSINATURA MANUSCRITA "Patrícia Vicente" COMO SE FOSSE ESCRITA À MÃO */}
          <g mask="url(#pv-handwriting-mask)">
            <text
              x="550"
              y="444"
              textAnchor="middle"
              fill="url(#pv-handwriting-ink)"
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: '108px',
                fontWeight: 400,
                letterSpacing: '0.01em'
              }}
            >
              {brokerName}
            </text>
          </g>

          {/* Ponta da caneta dourada acompanhando a escrita à mão em tempo real */}
          <motion.g
            initial={{ opacity: 0, x: 205, y: 422 }}
            animate={{
              opacity: [0, 1, 1, 1, 0],
              x: [205, 365, 550, 735, 895],
              y: [422, 412, 424, 414, 424]
            }}
            transition={{
              delay: 3.15,
              duration: 2.25,
              times: [0, 0.1, 0.5, 0.88, 1],
              ease: [0.37, 0, 0.63, 1]
            }}
          >
            {/* Pena dourada inclinada + brilho sutil da ponta */}
            <circle cx="0" cy="0" r="6" fill="#C99A49" fillOpacity="0.28" />
            <circle cx="0" cy="0" r="2.2" fill="#A67C46" />
            <path
              d="M 0 0 L 14 -26 L 22 -20 L 2 1 Z"
              fill="url(#pv-gold-stroke)"
              stroke="#7C5425"
              strokeWidth="0.6"
            />
          </motion.g>

          {/* Traço caligráfico de assinatura à mão abaixo do nome */}
          <motion.path
            d="M 278 468 C 405 478, 635 456, 822 466"
            fill="none"
            stroke="url(#pv-gold-stroke)"
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 4.85, duration: 0.85, ease: ARCHITECTURAL_EASE }}
          />

          {/* Subtítulo discreto abaixo da assinatura */}
          <motion.text
            x="550"
            y="514"
            textAnchor="middle"
            fill="#52525B"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 5.2, duration: 0.75, ease: ARCHITECTURAL_EASE }}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '20px',
              fontWeight: 500,
              letterSpacing: '0.12em'
            }}
          >
            Corretora de Imóveis · Sorocaba e Região
          </motion.text>
        </svg>
      </motion.div>

      {/* Botão discreto para pular a apresentação */}
      <motion.button
        type="button"
        onClick={handleSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="fixed bottom-6 right-6 z-20 text-xs font-medium text-[#52525B] hover:text-[#18181B] px-3 py-1.5 cursor-pointer"
      >
        Pular apresentação →
      </motion.button>
    </motion.div>
  );
}
