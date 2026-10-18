import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  FilterX, 
  ArrowRight, 
  FolderTree, 
  Layers
} from 'lucide-react';

const homeProductRailClasses = [
  '-mx-4 grid grid-flow-col auto-cols-[88%] gap-4 overflow-x-auto overscroll-x-contain px-4 pb-3',
  'snap-x snap-mandatory scroll-px-4',
  'sm:mx-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none',
  'lg:grid-cols-3 xl:grid-cols-5',
].join(' ');

const COLLECTION_BATCH_SIZE = 4;

export const ProductGrid: React.FC = () => {
  const { 
    products, 
    collections,
    selectedCollectionId,
    selectedFormat, 
    searchQuery, 
    sortBy,
    setSearchQuery,
    setSelectedFormat
  } = useStore();
  const [visibleCollectionCount, setVisibleCollectionCount] = useState(COLLECTION_BATCH_SIZE);
  const loadMoreCollectionsRef = useRef<HTMLDivElement>(null);

  const activeProducts = useMemo(() => products.filter(p => p.active), [products]);
  const activeCollections = useMemo(() => collections
    .filter(c => c.active)
    .sort((a, b) => Number(a.homeOrder ?? 9999) - Number(b.homeOrder ?? 9999)), [collections]);

  useEffect(() => {
    if (searchQuery.trim() || selectedCollectionId !== 'all' || visibleCollectionCount >= activeCollections.length) return;
    const target = loadMoreCollectionsRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisibleCollectionCount(count => Math.min(activeCollections.length, count + COLLECTION_BATCH_SIZE));
      }
    }, { rootMargin: '600px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeCollections.length, searchQuery, selectedCollectionId, visibleCollectionCount]);

  // =========================================================================
  // CASO 1: BUSCA GLOBAL ATIVA
  // Se o cliente digitou algo na busca do topo, exibe os resultados encontrados
  // =========================================================================
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const searchResults = activeProducts.filter(product => {
      if (selectedCollectionId !== 'all' && product.collectionId !== selectedCollectionId) return false;
      if (selectedFormat !== 'all' && product.format !== selectedFormat) return false;
      const matchTitle = product.title.toLowerCase().includes(q);
      const matchDesc = product.description.toLowerCase().includes(q);
      const matchTag = product.tags.some(t => t.toLowerCase().includes(q));
      const matchJurisdiction = product.llcJurisdiction?.toLowerCase().includes(q);
      const matchAccount = product.accountDetails?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTag || matchJurisdiction || matchAccount;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return b.downloadsCount - a.downloadsCount;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 sm:pb-6 mb-6 border-b border-borderSoft gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
              Resultados para "{searchQuery}"
            </h2>
            <span className="whitespace-nowrap shrink-0 text-xs bg-surface-warm px-2.5 py-0.5 rounded-full font-medium text-ink-muted border border-borderSoft">
              {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>

          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium self-start sm:self-auto"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Limpar Busca</span>
          </button>
        </div>

        {searchResults.length === 0 ? (
          <div className="bg-surface-warm/50 rounded-md border border-borderSoft p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-ink-muted border border-borderSoft">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base text-ink">Nenhum item encontrado</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Não encontramos arquivos ou serviços para "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="h-8.5 px-4 rounded-sm bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors cursor-pointer"
            >
              Voltar ao Catálogo Completo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {searchResults.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    );
  }

  // =========================================================================
  // CASO 2: EXIBIÇÃO DAS COLEÇÕES NA HOME
  // Mostra até 5 produtos de cada coleção.
  // SE E SOMENTE SE a coleção tiver mais que 5 produtos, exibe o botão
  // "Ver mais" / "Ver tudo" que redireciona o cliente para a página da coleção.
  // Se tiver 5 ou menos, exibe apenas os produtos, sem botão de redirecionamento.
  // =========================================================================

  // Filtra as coleções a serem exibidas (todas ou a selecionada na pílula do Hero)
  const targetCollections = selectedCollectionId === 'all'
    ? activeCollections
    : activeCollections.filter(c => c.id === selectedCollectionId);

  const collectionGroups = targetCollections.map(col => {
    let colProducts = activeProducts.filter(p => p.collectionId === col.id);

    // Filtro de formato (se selecionado no Hero)
    if (selectedFormat !== 'all') {
      colProducts = colProducts.filter(p => p.format === selectedFormat);
    }

    // Ordenação
    colProducts.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return b.downloadsCount - a.downloadsCount;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

    return {
      collection: col,
      totalCount: colProducts.length,
      products: colProducts.slice(0, 5), // Mostra apenas 5 produtos de cada coleção na Home
      hasMore: colProducts.length > 5,   // Verdadeiro APENAS se houver mais que 5
    };
  }).filter(group => group.totalCount > 0);

  // Itens avulsos não vinculados a coleções (exibidos apenas quando em "Todas as Coleções")
  const uncategorizedProducts = selectedCollectionId === 'all'
    ? activeProducts.filter(p => 
        !p.collectionId || !activeCollections.some(c => c.id === p.collectionId)
      ).filter(p => selectedFormat === 'all' || p.format === selectedFormat)
    : [];

  const uncategorizedDisplayed = uncategorizedProducts.slice(0, 5);
  const displayedCollectionGroups = selectedCollectionId === 'all'
    ? collectionGroups.slice(0, visibleCollectionCount)
    : collectionGroups;

  const hasAnyProducts = collectionGroups.length > 0 || uncategorizedDisplayed.length > 0;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
      
      {/* Estado vazio quando nenhum produto é encontrado */}
      {!hasAnyProducts && (
        <div className="bg-surface-warm/50 rounded-md border border-borderSoft p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-ink-muted border border-borderSoft">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-base text-ink">Nenhum item disponível</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            Não encontramos produtos disponíveis para a seleção atual.
          </p>
          {selectedFormat !== 'all' && (
            <button
              onClick={() => setSelectedFormat('all')}
              className="h-8.5 px-4 rounded-sm bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors cursor-pointer"
            >
              Exibir Todos os Formatos
            </button>
          )}
        </div>
      )}

      {/* Renderiza cada Coleção na Home */}
      {displayedCollectionGroups.map(({ collection, totalCount, products: items, hasMore }) => (
        <div key={collection.id} className="animate-fadeIn [content-visibility:auto] [contain-intrinsic-size:700px]">
          
          {/* Header da Coleção */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-3.5 mb-5 border-b border-borderSoft gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  collection.badgeColor || 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  <FolderTree className="w-3 h-3 shrink-0" />
                  <span>Coleção Oficial</span>
                </span>
                <span className="text-[11px] text-ink-muted">
                  {totalCount} {totalCount === 1 ? 'item disponível' : 'itens disponíveis'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                {collection.name}
              </h2>

              {collection.description && (
                <p className="text-xs sm:text-sm text-ink-muted max-w-2xl line-clamp-2">
                  {collection.description}
                </p>
              )}
            </div>

            {/* BOTÃO "VER MAIS" / "VER TUDO": Aparece SOMENTE se tiver mais que 5 produtos */}
            {hasMore && (
              <div className="shrink-0 self-start sm:self-auto">
                <Link
                  to={`/colecao/${collection.slug || collection.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <span>Ver mais ({totalCount})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Trilho horizontal no mobile e grade a partir de telas médias */}
          <div className={homeProductRailClasses} role="list" aria-label={`Produtos da coleção ${collection.name}`}>
            {items.map(product => (
              <div key={product.id} role="listitem" className="snap-start h-full [&>*]:h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Botão inferior adicional SOMENTE se tiver mais que 5 produtos */}
          {hasMore && (
            <div className="mt-5 text-center">
              <Link
                to={`/colecao/${collection.slug || collection.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-surface-warm hover:bg-black/[0.05] border border-borderSoft text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                <span>Ver mais produtos desta coleção ({totalCount} no total)</span>
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
              </Link>
            </div>
          )}

        </div>
      ))}

      {selectedCollectionId === 'all' && visibleCollectionCount < collectionGroups.length && (
        <div ref={loadMoreCollectionsRef} className="flex min-h-20 items-center justify-center" aria-live="polite">
          <button
            type="button"
            onClick={() => setVisibleCollectionCount(count => Math.min(collectionGroups.length, count + COLLECTION_BATCH_SIZE))}
            className="min-h-11 rounded-sm border border-borderSoft bg-surface-warm px-5 text-xs font-semibold text-ink transition-colors hover:bg-black/[0.05]"
          >
            Carregar mais coleções
          </button>
        </div>
      )}

      {/* Se houver produtos avulsos não vinculados a coleções */}
      {uncategorizedDisplayed.length > 0 && (
        <div className="animate-fadeIn pt-4 border-t border-borderSoft">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-3.5 mb-5 border-b border-borderSoft gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-warm text-ink-muted border border-borderSoft">
                  <Layers className="w-3 h-3 shrink-0" />
                  <span>Outros Arquivos & Dossiês</span>
                </span>
                <span className="text-[11px] text-ink-muted">
                  {uncategorizedProducts.length} disponíveis
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                Mais Ativos Digitais
              </h2>
            </div>
          </div>

          <div className={homeProductRailClasses} role="list" aria-label="Outros produtos disponíveis">
            {uncategorizedDisplayed.map(product => (
              <div key={product.id} role="listitem" className="snap-start h-full [&>*]:h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};
