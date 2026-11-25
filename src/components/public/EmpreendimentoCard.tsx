import { ArrowUpRight } from 'lucide-react';
import { CATEGORY_LABELS, type Empreendimento } from '../../types/realEstate';
import { ResilientImage } from '../common/ResilientImage';
import { SpotlightCard } from '../motion/MotionPrimitives';

export function EmpreendimentoCard({
  empreendimento,
  onSelect
}: {
  empreendimento: Empreendimento;
  onSelect: (slug: string) => void;
}) {
  return (
    <SpotlightCard className="group flex flex-col h-full">
      <a
        href={`/empreendimento/${empreendimento.slug}`}
        onClick={(e) => {
          e.preventDefault();
          onSelect(empreendimento.slug);
        }}
        className="flex flex-col h-full text-left"
      >
        <div className="aspect-[16/10] w-full overflow-hidden bg-[#F3F1EC]">
          <ResilientImage
            src={empreendimento.coverImage}
            alt={empreendimento.name}
            fallbackTitle={empreendimento.name}
            className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        </div>

        <div className="p-6 flex flex-col flex-1 justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#71717A]">
              <span className="font-medium text-[#1E4D5C]">
                {CATEGORY_LABELS[empreendimento.category]}
              </span>
              <span aria-hidden="true">·</span>
              <span>{empreendimento.region}</span>
              <span aria-hidden="true">·</span>
              <span>{empreendimento.stage}</span>
            </div>

            <h3 className="font-display text-xl font-semibold text-[#18181B] leading-snug group-hover:text-[#1E4D5C] transition-colors">
              {empreendimento.name}
            </h3>

            {empreendimento.description ? (
              <p className="text-sm text-[#52525B] line-clamp-2 leading-relaxed">
                {empreendimento.description}
              </p>
            ) : null}
          </div>

          <div className="pt-4 border-t border-[#E6E2DA] flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-[#71717A]">
                {empreendimento.confirmationStatus === 'confirmado'
                  ? 'Referência de valores'
                  : 'Valores e unidades a confirmar'}
              </p>
              <p className="text-sm font-semibold text-[#18181B]">
                {empreendimento.priceRangeText || 'Sob consulta'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4D5C] whitespace-nowrap">
              <span>Explorar</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </a>
    </SpotlightCard>
  );
}
