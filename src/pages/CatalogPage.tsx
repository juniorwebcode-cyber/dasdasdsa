import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  type Empreendimento,
  type Property,
  type PropertyCategory,
  type SiteSettings
} from '../types/realEstate';
import { PropertyCard } from '../components/public/PropertyCard';
import { EmpreendimentoCard } from '../components/public/EmpreendimentoCard';
import { LeadCaptureForm } from '../components/public/LeadCaptureForm';

interface CatalogPageProps {
  mode: 'all' | PropertyCategory | 'empreendimentos';
  properties: Property[];
  empreendimentos: Empreendimento[];
  settings: SiteSettings;
  onNavigate: (path: string) => void;
}

export function CatalogPage({
  mode,
  properties,
  empreendimentos,
  settings,
  onNavigate
}: CatalogPageProps) {
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);

  const [category, setCategory] = useState<string>(
    mode === 'na_planta' || mode === 'pronto' || mode === 'condominio'
      ? mode
      : initialParams.get('tipo') || 'todos'
  );
  const [regionFilter, setRegionFilter] = useState(initialParams.get('regiao') || '');
  const [searchQuery, setSearchQuery] = useState(initialParams.get('q') || '');
  const [priceRange, setPriceRange] = useState<string>('todos');
  const [minBeds, setMinBeds] = useState<string>('todos');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [sortBy, setSortBy] = useState<'destaques' | 'menor_preco' | 'maior_preco' | 'recentes'>(
    'destaques'
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const pageMeta = useMemo(() => {
    switch (mode) {
      case 'na_planta':
        return {
          title: 'Imóveis na Planta em Sorocaba e Região',
          subtitle:
            'Acompanhe lançamentos e unidades na planta com leitura técnica de planta, memorial descritivo e etapas de obra.'
        };
      case 'pronto':
        return {
          title: 'Imóveis Prontos em Sorocaba e Região',
          subtitle:
            'Apartamentos e casas prontas avaliados com olhar prático de construção civil e visitas acompanhadas.'
        };
      case 'condominio':
        return {
          title: 'Condomínios em Sorocaba e Região',
          subtitle:
            'Casas e terrenos em condomínios residenciais selecionados com transparência e orientação presencial.'
        };
      case 'empreendimentos':
        return {
          title: 'Empreendimentos em Sorocaba e Região',
          subtitle:
            'Conheça os empreendimentos acompanhados por Patrícia Vicente, com status e informações confirmadas.'
        };
      default:
        return {
          title: 'Comprar Imóveis em Sorocaba e Região',
          subtitle:
            'Busque entre imóveis na planta, prontos e condomínios com atendimento direto e transparente.'
        };
    }
  }, [mode]);

  const filteredProperties = useMemo(() => {
    return properties
      .filter((item) => {
        if (category !== 'todos' && item.category !== category) return false;
        if (onlyFeatured && !item.featured) return false;
        if (regionFilter.trim()) {
          const r = regionFilter.toLowerCase();
          const matchRegion =
            item.region.toLowerCase().includes(r) ||
            (item.neighborhood || '').toLowerCase().includes(r);
          if (!matchRegion) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const haystack = `${item.title} ${item.code} ${item.description || ''} ${item.region} ${
            item.neighborhood || ''
          }`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (priceRange !== 'todos') {
          if (priceRange === 'a_confirmar') {
            if (item.confirmationStatus !== 'a_confirmar') return false;
          } else {
            const p = item.priceNumeric || 0;
            if (!p) return false;
            if (priceRange === 'ate_500' && p > 500000) return false;
            if (priceRange === '500_1000' && (p < 500000 || p > 1000000)) return false;
            if (priceRange === 'acima_1000' && p < 1000000) return false;
          }
        }
        if (minBeds !== 'todos') {
          const bedsNum = parseInt((item.bedrooms || '').replace(/\D/g, ''), 10);
          if (Number.isNaN(bedsNum) || bedsNum < Number(minBeds)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'destaques') return Number(b.featured) - Number(a.featured);
        if (sortBy === 'menor_preco') return (a.priceNumeric || Infinity) - (b.priceNumeric || Infinity);
        if (sortBy === 'maior_preco') return (b.priceNumeric || 0) - (a.priceNumeric || 0);
        return a.title.localeCompare(b.title);
      });
  }, [properties, category, onlyFeatured, regionFilter, searchQuery, priceRange, minBeds, sortBy]);

  const filteredEmpreendimentos = useMemo(() => {
    return empreendimentos.filter((emp) => {
      if (category !== 'todos' && emp.category !== category) return false;
      if (regionFilter.trim() && !emp.region.toLowerCase().includes(regionFilter.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${emp.name} ${emp.region} ${emp.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [empreendimentos, category, regionFilter, searchQuery]);

  const clearFilters = () => {
    setCategory(mode === 'na_planta' || mode === 'pronto' || mode === 'condominio' ? mode : 'todos');
    setRegionFilter('');
    setSearchQuery('');
    setPriceRange('todos');
    setMinBeds('todos');
    setOnlyFeatured(false);
    setSortBy('destaques');
  };

  return (
    <div className="bg-[#FAF9F6] min-h-[75vh]">
      <section className="bg-[#F3F1EC] border-b border-[#E6E2DA]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#1E4D5C]">
            <span>Patrícia Vicente</span>
            <span aria-hidden="true">·</span>
            <span>Sorocaba e região</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold text-[#18181B] text-balance">
            {pageMeta.title}
          </h1>
          <p className="text-base text-[#52525B] max-w-2xl leading-relaxed">
            {pageMeta.subtitle}
          </p>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 space-y-8">
        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <p className="text-sm text-[#52525B] tabular-nums">
            {mode === 'empreendimentos'
              ? `${filteredEmpreendimentos.length} empreendimento(s)`
              : `${filteredProperties.length} imóvel(is) encontrado(s)`}
          </p>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-[#E6E2DA] rounded-xl text-[#18181B] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div
          className={`bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-4 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#71717A]">Busca</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Título, código ou palavra..."
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl focus:outline-none focus:border-[#1E4D5C]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#71717A]">Tipo</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl focus:outline-none focus:border-[#1E4D5C]"
              >
                <option value="todos">Todos</option>
                <option value="na_planta">{CATEGORY_LABELS.na_planta}</option>
                <option value="pronto">{CATEGORY_LABELS.pronto}</option>
                <option value="condominio">{CATEGORY_LABELS.condominio}</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#71717A]">Região / Bairro</span>
              <input
                type="text"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                placeholder="Sorocaba e região"
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl focus:outline-none focus:border-[#1E4D5C]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#71717A]">Faixa de valor</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl focus:outline-none focus:border-[#1E4D5C]"
              >
                <option value="todos">Qualquer valor</option>
                <option value="a_confirmar">Valores a confirmar</option>
                <option value="ate_500">Até R$ 500 mil</option>
                <option value="500_1000">R$ 500 mil a R$ 1 milhão</option>
                <option value="acima_1000">Acima de R$ 1 milhão</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#71717A]">Dormitórios</span>
              <select
                value={minBeds}
                onChange={(e) => setMinBeds(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl focus:outline-none focus:border-[#1E4D5C]"
              >
                <option value="todos">Indiferente</option>
                <option value="2">2+ dormitórios</option>
                <option value="3">3+ dormitórios</option>
                <option value="4">4+ dormitórios</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#71717A]">Ordenar por</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl focus:outline-none focus:border-[#1E4D5C]"
              >
                <option value="destaques">Destaques</option>
                <option value="menor_preco">Menor valor confirmado</option>
                <option value="maior_preco">Maior valor confirmado</option>
                <option value="recentes">Ordem alfabética</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E6E2DA]">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#52525B] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyFeatured}
                onChange={(e) => setOnlyFeatured(e.target.checked)}
                className="rounded border-[#E6E2DA] text-[#1E4D5C]"
              />
              <span>Somente imóveis em destaque</span>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#18181B] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>

        {/* Results */}
        {mode === 'empreendimentos' ? (
          filteredEmpreendimentos.length === 0 ? (
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-10 text-center space-y-3">
              <p className="font-display text-xl font-semibold text-[#18181B]">
                Nenhum empreendimento encontrado com esses filtros
              </p>
              <p className="text-sm text-[#52525B]">
                Ajuste os filtros ou fale diretamente com Patrícia Vicente para opções sob medida.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEmpreendimentos.map((emp) => (
                <EmpreendimentoCard
                  key={emp.id}
                  empreendimento={emp}
                  onSelect={(slug) => onNavigate(`/empreendimento/${slug}`)}
                />
              ))}
            </div>
          )
        ) : (
          <>
            {filteredProperties.length === 0 ? (
              <div className="bg-white border border-[#E6E2DA] rounded-2xl p-10 text-center space-y-3">
                <p className="font-display text-xl font-semibold text-[#18181B]">
                  Nenhum imóvel encontrado para os critérios selecionados
                </p>
                <p className="text-sm text-[#52525B]">
                  Você pode limpar os filtros ou enviar o perfil que deseja no formulário abaixo.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
                >
                  Ver todos os imóveis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    onSelect={(slug) => onNavigate(`/imovel/${slug}`)}
                  />
                ))}
              </div>
            )}

            {filteredEmpreendimentos.length > 0 && (
              <div className="pt-10 space-y-6 border-t border-[#E6E2DA]">
                <h2 className="font-display text-2xl font-semibold text-[#18181B]">
                  Empreendimentos relacionados em Sorocaba e região
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEmpreendimentos.map((emp) => (
                    <EmpreendimentoCard
                      key={emp.id}
                      empreendimento={emp}
                      onSelect={(slug) => onNavigate(`/empreendimento/${slug}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="pt-8">
          <LeadCaptureForm
            settings={settings}
            source={`catalogo_${mode}`}
            defaultInterestType={
              mode === 'na_planta' || mode === 'pronto' || mode === 'condominio'
                ? mode
                : 'contato'
            }
            showVisitDate
            title="Não encontrou exatamente o que procura?"
            subtitle="Conte os detalhes do imóvel ideal em Sorocaba e região e receba uma seleção personalizada."
          />
        </div>
      </section>
    </div>
  );
}
