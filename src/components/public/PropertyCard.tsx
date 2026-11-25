import { ArrowUpRight } from 'lucide-react';
import { CATEGORY_LABELS, type Property } from '../../types/realEstate';
import { ResilientImage } from '../common/ResilientImage';
import { SpotlightCard } from '../motion/MotionPrimitives';

export function PropertyCard({
  property,
  onSelect
}: {
  property: Property;
  onSelect: (slug: string) => void;
}) {
  const categoryLabel = CATEGORY_LABELS[property.category] || 'Imóvel';

  return (
    <SpotlightCard className="group flex flex-col h-full">
      <a
        href={`/imovel/${property.slug}`}
        onClick={(e) => {
          e.preventDefault();
          onSelect(property.slug);
        }}
        className="flex flex-col h-full text-left"
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-[#F3F1EC] relative">
          <ResilientImage
            src={property.coverImage}
            alt={property.title}
            fallbackTitle={property.title}
            className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        </div>

        <div className="p-6 flex flex-col flex-1 justify-between gap-4">
          <div className="space-y-2.5">
            {/* Zero-Pill Metadata Discipline: clean unboxed text with typographic separators */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#71717A]">
              <span className="font-medium text-[#1E4D5C]">{categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{property.region}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{property.code}</span>
            </div>

            <h3 className="font-display text-xl font-semibold text-[#18181B] leading-snug group-hover:text-[#1E4D5C] transition-colors">
              {property.title}
            </h3>

            {property.description ? (
              <p className="text-sm text-[#52525B] line-clamp-2 leading-relaxed">
                {property.description}
              </p>
            ) : null}
          </div>

          <div className="pt-4 border-t border-[#E6E2DA] flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-[#71717A]">
                {property.confirmationStatus === 'confirmado'
                  ? 'Valor confirmado'
                  : 'Sujeito à confirmação'}
              </p>
              <p className="text-base font-semibold text-[#18181B] tabular-nums">
                {property.priceText}
              </p>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4D5C] whitespace-nowrap">
              <span>Ver detalhes</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </a>
    </SpotlightCard>
  );
}
