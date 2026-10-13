import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { FileText, FilterX } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const { 
    products, 
    collections,
    selectedCategory, 
    selectedProductType,
    selectedCollectionId,
    selectedFormat, 
    searchQuery, 
    sortBy,
    setSearchQuery,
    setSelectedCategory,
    setSelectedProductType,
    setSelectedCollectionId,
    setSelectedFormat
  } = useStore();

  const activeProducts = products.filter(p => p.active);

  const filtered = activeProducts.filter(product => {
    // Type filter
    if (selectedProductType !== 'all' && product.productType !== selectedProductType) {
      return false;
    }

    // Collection filter
    if (selectedCollectionId !== 'all' && product.collectionId !== selectedCollectionId) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }

    // Format filter
    if (selectedFormat !== 'all' && product.format !== selectedFormat) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = product.title.toLowerCase().includes(q);
      const matchDesc = product.description.toLowerCase().includes(q);
      const matchTag = product.tags.some(t => t.toLowerCase().includes(q));
      const matchJurisdiction = product.llcJurisdiction?.toLowerCase().includes(q);
      const matchAccount = product.accountDetails?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTag && !matchJurisdiction && !matchAccount) return false;
    }

    return true;
  });

  // Sort products
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'popular') return b.downloadsCount - a.downloadsCount;
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const activeCollection = collections.find(c => c.id === selectedCollectionId);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Grid Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 sm:pb-6 mb-6 border-b border-borderSoft gap-2 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
              {activeCollection ? `Coleção: ${activeCollection.name}` : 'Todos os Itens Disponíveis'}
            </h2>
            <span className="whitespace-nowrap shrink-0 text-xs bg-surface-warm px-2.5 py-0.5 rounded-full font-medium text-ink-muted border border-borderSoft">
              {sorted.length} {sorted.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>
          {activeCollection && (
            <p className="text-xs text-ink-muted mt-1 max-w-xl">
              {activeCollection.description}
            </p>
          )}
        </div>

        {(searchQuery || selectedCategory !== 'all' || selectedProductType !== 'all' || selectedCollectionId !== 'all' || selectedFormat !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedProductType('all');
              setSelectedCollectionId('all');
              setSelectedFormat('all');
            }}
            className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium self-start sm:self-auto"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Limpar Todos os Filtros</span>
          </button>
        )}
      </div>

      {/* Grid Body */}
      {sorted.length === 0 ? (
        <div className="bg-surface-warm/50 rounded-md border border-borderSoft p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-ink-muted border border-borderSoft">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-base text-ink">Nenhum item encontrado</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            Não encontramos arquivos ou serviços correspondentes aos filtros ativos. Tente selecionar "Todos os Tipos" ou outra coleção.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedProductType('all');
              setSelectedCollectionId('all');
              setSelectedFormat('all');
            }}
            className="h-8.5 px-4 rounded-sm bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors cursor-pointer"
          >
            Ver Todos os Itens
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sorted.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};
