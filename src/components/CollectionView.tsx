import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { FileFormat } from '../types';
import { 
  FolderTree, 
  ArrowLeft, 
  Search, 
  FileText, 
  FilterX, 
  ChevronRight, 
  Home,
  SlidersHorizontal
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

export const CollectionView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { collections, products } = useStore();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FileFormat | 'all'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular' | 'newest'>('featured');

  // Encontra a coleção pelo slug ou pelo id
  const collection = useMemo(() => {
    if (!slug) return null;
    const normalized = slug.trim().toLowerCase();
    return collections.find(c => 
      (c.slug && c.slug.trim().toLowerCase() === normalized) || 
      c.id.toLowerCase() === normalized
    ) || null;
  }, [slug, collections]);

  // Atualiza tags de SEO e título da página dinamicamente
  useEffect(() => {
    if (collection) {
      document.title = `${collection.name} | GlobalDOCS`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content', 
          collection.description || `Confira todos os itens e documentos da coleção ${collection.name} no GlobalDOCS.`
        );
      }
    } else {
      document.title = 'Coleção não encontrada | GlobalDOCS';
    }

    // Scroll para o topo ao carregar a página da coleção
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [collection]);

  // Produtos que pertencem a esta coleção
  const collectionProducts = useMemo(() => {
    if (!collection) return [];
    return products.filter(p => p.collectionId === collection.id);
  }, [collection, products]);

  // Produtos filtrados e ordenados
  const filteredProducts = useMemo(() => {
    return collectionProducts.filter(product => {
      // Formato
      if (selectedFormat !== 'all' && product.format !== selectedFormat) {
        return false;
      }

      // Busca local
      if (localSearch.trim()) {
        const q = localSearch.toLowerCase();
        const matchTitle = product.title.toLowerCase().includes(q);
        const matchDesc = product.description.toLowerCase().includes(q);
        const matchTag = product.tags.some(t => t.toLowerCase().includes(q));
        const matchJurisdiction = product.llcJurisdiction?.toLowerCase().includes(q);
        const matchAccount = product.accountDetails?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTag && !matchJurisdiction && !matchAccount) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return b.downloadsCount - a.downloadsCount;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [collectionProducts, selectedFormat, localSearch, sortBy]);

  // Outras coleções ativas para navegação rápida
  const otherCollections = useMemo(() => {
    if (!collection) return [];
    return collections.filter(c => c.active && c.id !== collection.id);
  }, [collections, collection]);

  // Se a coleção não for encontrada
  if (!collection) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-warm border border-borderSoft flex items-center justify-center text-ink-muted">
          <FolderTree className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Coleção não encontrada</h1>
        <p className="text-sm text-ink-muted max-w-md mx-auto">
          A coleção solicitada não existe ou foi temporariamente desativada. Explore nosso catálogo completo na página inicial.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a Página Inicial</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Banner / Breadcrumb Header */}
      <section className="bg-surface-warm/70 border-b border-borderSoft pt-6 pb-8 sm:pt-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <nav aria-label="Navegação" className="flex items-center gap-1.5 text-xs text-ink-muted mb-4 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
              <Home className="w-3.5 h-3.5" />
              <span>Início</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-ink-faint shrink-0" />
            <Link to="/" className="hover:text-primary transition-colors">
              Coleções
            </Link>
            <ChevronRight className="w-3 h-3 text-ink-faint shrink-0" />
            <span className="font-semibold text-ink truncate max-w-xs">{collection.name}</span>
          </nav>

          {/* Collection Title & Meta */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  collection.badgeColor || 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  <FolderTree className="w-3 h-3 shrink-0" />
                  <span>Coleção Oficial</span>
                </span>
                <span className="text-xs bg-white border border-borderSoft px-2.5 py-0.5 rounded-full font-medium text-ink-muted">
                  {collectionProducts.length} {collectionProducts.length === 1 ? 'produto registrado' : 'produtos registrados'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold text-ink tracking-tight">
                {collection.name}
              </h1>

              {collection.description && (
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  {collection.description}
                </p>
              )}
            </div>

            <Link
              to="/"
              className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-white border border-borderSoft hover:bg-black/[0.03] text-xs font-semibold text-ink transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-ink-muted" />
              <span>Ver Todas as Coleções</span>
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="mt-6 pt-5 border-t border-borderSoft/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search inside this collection */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder={`Buscar em ${collection.name}...`}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-borderSoft rounded-sm text-ink placeholder:text-ink-faint focus:border-primary transition-all"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Format & Sort Selects */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-white border border-borderSoft rounded-sm px-2.5 py-1.5 flex-1 sm:flex-none">
                <span className="text-ink-muted text-[11px] shrink-0">Formato:</span>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as any)}
                  className="w-full sm:w-auto bg-transparent font-medium text-ink focus:outline-none text-xs cursor-pointer"
                >
                  {FORMATS.map(f => (
                    <option key={f} value={f}>
                      {f === 'all' ? 'Todos' : f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-borderSoft rounded-sm px-2.5 py-1.5 flex-1 sm:flex-none">
                <span className="text-ink-muted text-[11px] shrink-0">Ordem:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto bg-transparent font-medium text-ink focus:outline-none text-xs cursor-pointer"
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

      {/* Products Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Results Counter & Clear Filter */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-borderSoft text-xs">
          <div className="flex items-center gap-2 font-medium text-ink">
            <span>Mostrando {filteredProducts.length} de {collectionProducts.length} produtos desta coleção</span>
          </div>

          {(localSearch || selectedFormat !== 'all') && (
            <button
              onClick={() => {
                setLocalSearch('');
                setSelectedFormat('all');
              }}
              className="text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-surface-warm/40 rounded-md border border-borderSoft p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-ink-muted border border-borderSoft">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base text-ink">Nenhum produto encontrado nesta coleção</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              {collectionProducts.length === 0
                ? 'Nenhum item foi vinculado a esta coleção até o momento.'
                : 'Não há itens correspondentes aos filtros aplicados.'}
            </p>
            {(localSearch || selectedFormat !== 'all') ? (
              <button
                onClick={() => {
                  setLocalSearch('');
                  setSelectedFormat('all');
                }}
                className="h-8.5 px-4 rounded-sm bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors cursor-pointer"
              >
                Limpar Filtros da Coleção
              </button>
            ) : (
              <Link
                to="/"
                className="inline-block h-8.5 px-4 leading-8 rounded-sm bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors cursor-pointer"
              >
                Explorar Todas as Coleções
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Shelf of other collections */}
        {otherCollections.length > 0 && (
          <div className="mt-16 pt-8 border-t border-borderSoft space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>Navegue por outras Coleções Oficiais:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
              <Link
                to="/"
                className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-surface-warm text-ink-muted hover:text-ink border border-borderSoft transition-all"
              >
                Todas as Coleções
              </Link>
              {otherCollections.map(col => (
                <Link
                  key={col.id}
                  to={`/colecao/${col.slug || col.id}`}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-surface-warm text-ink-muted hover:text-ink border border-borderSoft transition-all"
                >
                  {col.name}
                </Link>
              ))}
            </div>
          </div>
        )}

      </section>
    </div>
  );
};
