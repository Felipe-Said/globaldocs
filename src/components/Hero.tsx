import React from 'react';
import { useStore } from '../context/StoreContext';
import { FileFormat, ProductType } from '../types';
import { BannerSlider } from './BannerSlider';
import { 
  Sparkles, 
  Building2, 
  CreditCard, 
  Package, 
  FileCheck,
  FolderTree,
  Briefcase
} from 'lucide-react';

const FORMATS: (FileFormat | 'all')[] = [
  'all',
  'DOCX',
  'ZIP',
  'XLSX',
  'FIG',
  'PDF',
  'PACOTE',
];

export const Hero: React.FC = () => {
  const { 
    products,
    selectedProductType,
    setSelectedProductType,
    selectedCollectionId,
    setSelectedCollectionId,
    selectedFormat,
    setSelectedFormat,
    sortBy,
    setSortBy,
    collections
  } = useStore();

  const getTypeMeta = (type: string) => {
    const lower = type.toLowerCase();
    if (lower === 'all') return { label: 'Todos os Itens', icon: Sparkles };
    if (lower === 'digital') return { label: 'Arquivos Digitais', icon: FileCheck };
    if (lower === 'llc' || lower.includes('llc') || lower.includes('usa')) return { label: type === 'llc' ? 'Kits LLC & USA' : type, icon: Building2 };
    if (lower === 'contas' || lower.includes('conta') || lower.includes('banc')) return { label: type === 'contas' ? 'Contas & Validações' : type, icon: CreditCard };
    if (lower.includes('serviço') || lower.includes('consultoria') || lower.includes('assessoria') || lower.includes('mentoria')) return { label: type, icon: Briefcase };
    return { label: type.charAt(0).toUpperCase() + type.slice(1), icon: FileCheck };
  };

  const baseTypeIds = ['all', 'digital', 'llc', 'contas'];
  const customTypes = Array.from(new Set(products.map(p => p.productType).filter(Boolean)))
    .filter(t => !baseTypeIds.includes(t.toLowerCase()) && t.toLowerCase() !== 'fisico');

  const typeFilters = [...baseTypeIds, ...customTypes].map(id => ({
    id,
    ...getTypeMeta(id)
  }));

  return (
    <section className="bg-surface border-b border-borderSoft pt-5 sm:pt-12 pb-5 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Headline */}
        <div className="text-left sm:text-center max-w-4xl sm:mx-auto space-y-2 sm:space-y-4">
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-bold text-ink tracking-tight leading-[1.18]">
            Ativos, arquivos e estruturas prontas para operar.
          </h1>
          <p className="text-xs sm:text-base md:text-lg text-ink-muted font-normal max-w-2xl sm:mx-auto leading-relaxed">
            Formação de LLC americana, dossiês de contas globais, minutas contratuais revisadas e downloads digitais com entrega imediata.
          </p>
        </div>

        {/* Banner Section (Sem bordas, proporções desktop e mobile configuráveis) */}
        <BannerSlider />

        {/* Collections Shelf (Clean, smooth carousel with touch margins) */}
        <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-borderSoft">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <FolderTree className="w-3.5 h-3.5 text-primary" />
              <span>Coleções Oficiais:</span>
            </div>
            {selectedCollectionId !== 'all' && (
              <button
                onClick={() => setSelectedCollectionId('all')}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Limpar seleção
              </button>
            )}
          </div>

          <div className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 py-1">
            <button
              onClick={() => setSelectedCollectionId('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                selectedCollectionId === 'all'
                  ? 'bg-ink text-white shadow-xs'
                  : 'bg-surface-warm text-ink-muted hover:text-ink border border-borderSoft'
              }`}
            >
              Todas as Coleções
            </button>
            {collections.filter(c => c.active).map((col) => (
              <button
                key={col.id}
                onClick={() => setSelectedCollectionId(col.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                  selectedCollectionId === col.id
                    ? 'bg-ink text-white font-semibold shadow-xs'
                    : 'bg-surface-warm text-ink-muted hover:text-ink border border-borderSoft'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>

        {/* Type & Format Filters (Clean, unified layout for mobile & desktop) */}
        <div className="mt-4 pt-4 border-t border-borderSoft space-y-3">
          
          {/* Row 1: Type Pills with smooth touch scroll */}
          <div className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1.5 py-1">
            {typeFilters.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedProductType === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedProductType(t.id)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-primary-tint border-primary text-primary-pressed font-semibold'
                      : 'bg-surface border-borderSoft text-ink-muted hover:bg-surface-warm hover:text-ink'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Dropdowns - full width 2-column grid on mobile, inline on desktop */}
          <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:justify-end sm:items-center text-xs">
            <div className="flex items-center gap-1.5 bg-surface-warm border border-borderSoft rounded-sm px-2.5 py-1.5">
              <span className="text-ink-muted text-[11px] shrink-0">Formato:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="w-full bg-transparent font-medium text-ink focus:outline-none text-xs"
              >
                {FORMATS.map(f => (
                  <option key={f} value={f}>
                    {f === 'all' ? 'Todos' : f}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-surface-warm border border-borderSoft rounded-sm px-2.5 py-1.5">
              <span className="text-ink-muted text-[11px] shrink-0">Ordem:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-transparent font-medium text-ink focus:outline-none text-xs"
              >
                <option value="featured">Destaques</option>
                <option value="popular">Mais Baixados</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
                <option value="newest">Mais Recentes</option>
              </select>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
