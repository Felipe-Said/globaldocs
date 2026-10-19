import React from 'react';
import { useStore } from '../context/StoreContext';
import { detectBrands } from '../utils/brandDetection';
import { BrandLogosList } from './BrandLogos';
import { 
  X, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Building2,
  CreditCard,
  Package,
  FileCheck,
  Truck,
  Briefcase,
  Zap,
  Clock,
  Rocket,
  Minus,
  Plus,
  Download
} from 'lucide-react';
import { buildProductSEO, updateDocumentSEO } from '../utils/seo';
import { detectCountries } from '../utils/countryDetection';
import { CountryBadgesList } from './CountryBadge';
import { UsdtEstimate } from './UsdtEstimate';

export const ProductDetailModal: React.FC = () => {
  const { selectedProduct, setSelectedProduct, addToCart, updateCartQuantity, setIsCartOpen, cart, collections } = useStore();
  const [quantity, setQuantity] = React.useState(1);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (selectedProduct) {
      const seo = buildProductSEO(selectedProduct);
      updateDocumentSEO(seo);
    }
    return () => {
      updateDocumentSEO({
        title: 'GlobalDOCS — Ativos, Arquivos e Estruturas Prontas para Operar',
        description: 'Formação de LLC americana, dossiês de contas globais, minutas contratuais revisadas e downloads digitais com entrega imediata.',
        keywords: 'LLC, Delaware, Wyoming, Contas Globais, Mercury, Stripe, Contratos, Templates, Serviços',
      });
    };
  }, [selectedProduct]);

  React.useEffect(() => {
    if (!selectedProduct) return;
    const current = cart.find(item => item.product.id === selectedProduct.id);
    setQuantity(current?.quantity || Math.max(1, Number(selectedProduct.minimumOrder || 1)));
  }, [selectedProduct?.id]);

  React.useEffect(() => {
    if (!selectedProduct) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedProduct(null);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedProduct?.id, setSelectedProduct]);

  if (!selectedProduct) return null;

  const isInCart = cart.some(item => item.product.id === selectedProduct.id);
  const cartItem = cart.find(item => item.product.id === selectedProduct.id);
  const collection = collections.find(c => c.id === selectedProduct.collectionId);
  const detectedBrands = detectBrands(selectedProduct);
  const detectedCountries = detectCountries(selectedProduct);

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleBuyNow = () => {
    if (isInCart) updateCartQuantity(selectedProduct.id, quantity);
    else addToCart(selectedProduct, quantity);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const minimumQuantity = Math.max(1, Number(selectedProduct.minimumOrder || 1));
  const maximumQuantity = selectedProduct.unlimitedStock ? 10000 : Math.max(minimumQuantity, Number(selectedProduct.stockQuantity || minimumQuantity));
  const usesQuantity = maximumQuantity > 1 || minimumQuantity > 1;
  const changeQuantity = (next: number) => setQuantity(Math.max(minimumQuantity, Math.min(maximumQuantity, Math.floor(next || minimumQuantity))));

  const getTypeLabel = (type: string) => {
    const lower = (type || '').toLowerCase();
    let icon = FileCheck;
    let color = 'bg-blue-50 text-blue-800 border-blue-200';

    if (lower.includes('llc') || lower.includes('usa') || lower.includes('empresa')) {
      icon = Building2;
      color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (lower.includes('conta') || lower.includes('banc') || lower.includes('finance')) {
      icon = CreditCard;
      color = 'bg-indigo-50 text-indigo-800 border-indigo-200';
    } else if (lower.includes('serviço') || lower.includes('servico') || lower.includes('consultoria') || lower.includes('assessoria') || lower.includes('mentoria')) {
      icon = Briefcase;
      color = 'bg-purple-50 text-purple-800 border-purple-200';
    }

    return { label: type || 'Digital', icon, color };
  };

  const typeInfo = getTypeLabel(selectedProduct.productType || 'digital');
  const TypeIcon = typeInfo.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/55 p-0 backdrop-blur-xs animate-fadeIn sm:items-center sm:p-6"
      onClick={() => setSelectedProduct(null)}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden border-0 bg-surface shadow-notion-modal animate-slideUpMobile sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-md sm:border sm:border-borderSoft sm:animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Notch Handle */}
        <div className="absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-borderSoft sm:hidden" aria-hidden="true" />

        {/* Header Bar */}
        <div className="flex shrink-0 items-start justify-between border-b border-borderSoft bg-surface px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] sm:p-6">
          <div className="min-w-0 flex-1 pr-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border whitespace-nowrap shrink-0 ${typeInfo.color}`}>
                <TypeIcon className="w-3 h-3 shrink-0" />
                {typeInfo.label}
              </span>
              {detectedCountries.length > 0 && <div className="hidden sm:block"><CountryBadgesList countries={detectedCountries} size="sm" /></div>}
              {collection && (
                <span className="inline-flex max-w-[180px] shrink-0 items-center gap-1 truncate whitespace-nowrap rounded-full border border-borderSoft bg-surface-warm px-2 py-0.5 text-[10px] font-semibold text-ink-muted sm:max-w-none sm:text-xs">
                  <Package className="size-3 shrink-0" aria-hidden="true" /> {collection.name}
                </span>
              )}
              <span className="hidden whitespace-nowrap text-xs text-ink-muted sm:inline">
                {selectedProduct.version}
              </span>
            </div>
            <h2 id="product-detail-title" className="line-clamp-3 text-lg font-bold leading-snug tracking-tight text-ink sm:text-3xl sm:leading-tight">
              {selectedProduct.title}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setSelectedProduct(null)}
            className="ml-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-warm text-ink-muted transition-colors hover:bg-black/[0.08] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Fechar detalhes do produto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 pb-6 sm:space-y-6 sm:p-6">
          {/* Subtitle / Tagline */}
          <p className="text-xs sm:text-base text-ink-muted leading-relaxed">
            {selectedProduct.tagline}
          </p>

          {/* Países / Jurisdições Detectadas com Bandeiras Oficiais FlagCDN */}
          {detectedCountries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-surface-warm/70 rounded-sm text-xs" style={{ border: 'none' }}>
              <span className="font-semibold text-ink-muted text-[11px] whitespace-nowrap">
                País / Jurisdição:
              </span>
              <CountryBadgesList countries={detectedCountries} size="sm" />
            </div>
          )}

          {/* Marcas Detectadas via theSVG (sem bordas) */}
          {detectedBrands.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-surface-warm/70 rounded-sm text-xs" style={{ border: 'none' }}>
              <span className="font-semibold text-ink-muted text-[11px] whitespace-nowrap">
                Compatível / Integrado com:
              </span>
              <BrandLogosList brands={detectedBrands} size="sm" maxItems={8} />
            </div>
          )}

          {/* Specific Notices */}
          {selectedProduct.llcJurisdiction && (
            <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-sm border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span><strong>Jurisdição Americana Oficial:</strong> {selectedProduct.llcJurisdiction}</span>
            </div>
          )}


          {selectedProduct.accountDetails && (
            <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-sm border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-700 shrink-0" />
              <span><strong>Estrutura de Contas:</strong> {selectedProduct.accountDetails}</span>
            </div>
          )}

          {/* Prazo Médio & Agilidade de Entrega */}
          {(selectedProduct.deliverySpeed || selectedProduct.deliveryTime) && (
            <div className={`p-3 sm:p-3.5 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              selectedProduct.deliverySpeed === 'immediate' || selectedProduct.deliveryTime?.toLowerCase().includes('imediato')
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : selectedProduct.deliverySpeed === 'fast'
                ? 'bg-blue-50/80 border-blue-300 text-blue-950'
                : 'bg-surface-warm border-borderSoft text-ink'
            }`}>
              <div className="flex items-center gap-2.5">
                {selectedProduct.deliverySpeed === 'immediate' || selectedProduct.deliveryTime?.toLowerCase().includes('imediato') ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-emerald-700 fill-emerald-500" />
                  </div>
                ) : selectedProduct.deliverySpeed === 'fast' ? (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4 text-blue-700" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-black/[0.05] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-ink-muted" />
                  </div>
                )}
                <div>
                  <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                    {selectedProduct.deliverySpeed === 'immediate' || selectedProduct.deliveryTime?.toLowerCase().includes('imediato') ? (
                      <span>Pronta Entrega / Disponibilização Imediata</span>
                    ) : selectedProduct.deliverySpeed === 'fast' ? (
                      <span>Entrega Rápida Prioritária</span>
                    ) : (
                      <span>Prazo Médio de Execução / Envio</span>
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs opacity-80 mt-0.5">
                    {selectedProduct.deliverySpeed === 'immediate'
                      ? (selectedProduct.accessLogins || selectedProduct.proxyDetails)
                        ? 'Produto em mãos • Arquivo, credenciais e configurações de proxy liberados imediatamente após confirmação'
                        : 'Produto em mãos • Pacote ZIP e documentação liberados para download instantâneo'
                      : `Prazo médio estimado para entrega/conclusão: ${selectedProduct.deliveryTime || 'Conforme agendamento'}`}
                  </div>
                </div>
              </div>

              {selectedProduct.deliveryTime && (
                <span className="text-xs font-bold px-2.5 py-1 bg-white/90 text-ink rounded border border-black/10 whitespace-nowrap self-start sm:self-auto shadow-2xs">
                  {selectedProduct.deliveryTime}
                </span>
              )}
            </div>
          )}

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-surface-warm rounded-sm border border-borderSoft text-center">
            <div>
              <div className="text-[10px] sm:text-xs text-ink-muted">Formato / Envio</div>
              <div className="text-xs sm:text-sm font-bold text-ink mt-0.5">{selectedProduct.format}</div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-ink-muted">Tamanho / Peso</div>
              <div className="text-xs sm:text-sm font-bold text-ink mt-0.5">{selectedProduct.fileSize}</div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-ink-muted">Avaliação</div>
              <div className="text-xs sm:text-sm font-bold text-ink mt-0.5 flex items-center justify-center gap-1">
                {selectedProduct.rating > 0 ? (
                  <>
                    <Star className="w-3 h-3 fill-accent-amber text-accent-amber shrink-0" />
                    <span>{selectedProduct.rating.toFixed(1)}</span>
                    <span className="text-ink-muted text-[11px] font-normal">({selectedProduct.reviewsCount})</span>
                  </>
                ) : (
                  <span className="text-ink-muted text-xs font-normal">Novo</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-ink-muted">Atualização</div>
              <div className="text-xs sm:text-sm font-bold text-ink mt-0.5">
                {new Date(selectedProduct.updatedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Resumo de valor para telas pequenas */}
          <div className="rounded-xl border border-borderSoft bg-surface-warm/70 p-3.5 sm:hidden">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Valor do item</div>
              <div className="mt-0.5 text-xl font-bold tracking-tight text-ink">{formatPrice(selectedProduct.price * quantity)}</div>
              <UsdtEstimate amount={selectedProduct.price * quantity} compact />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-ink mb-1.5 uppercase tracking-wider text-[11px] text-ink-muted">
              Visão Geral
            </h4>
            <p className="text-xs sm:text-sm text-ink leading-relaxed">
              {selectedProduct.description}
            </p>
          </div>

          {/* Included Features List */}
          <div>
            <h4 className="font-bold text-ink mb-2 uppercase tracking-wider text-[11px] text-ink-muted">
              O que está incluído
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedProduct.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-ink bg-surface p-2 rounded-sm border border-borderSoft">
                  <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Preview Snippet */}
          {selectedProduct.fileContentSample && (
            <div>
              <h4 className="font-bold text-ink mb-1.5 uppercase tracking-wider text-[11px] text-ink-muted flex items-center justify-between">
                <span>Amostra do Arquivo</span>
                <span className="text-[10px] text-primary">Preview Seguro</span>
              </h4>
              <div className="bg-surface-warm p-3 rounded-sm border border-borderSoft font-mono text-[11px] text-ink-muted whitespace-pre-wrap max-h-32 overflow-y-auto">
                {selectedProduct.fileContentSample}
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout Action */}
        <div className="flex shrink-0 flex-col gap-2.5 border-t border-borderSoft bg-surface-warm px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:p-5">
          <div className="flex min-w-0 items-end justify-between sm:block">
            <div>
            <div className="text-[10px] text-ink-muted sm:text-xs">Total:</div>
            <div className="flex items-baseline gap-1.5">
              <span className="truncate text-lg font-bold text-ink sm:text-2xl">
                {formatPrice(selectedProduct.price * quantity)}
              </span>
              {selectedProduct.originalPrice && (
                <span className="hidden text-xs text-ink-faint line-through sm:inline">
                  {formatPrice(selectedProduct.originalPrice * quantity)}
                </span>
              )}
            </div>
            </div>
            {usesQuantity && (
              <span className="pb-0.5 text-[10px] font-medium text-ink-muted sm:hidden">
                {selectedProduct.unlimitedStock ? 'Disponibilidade contínua' : `${maximumQuantity.toLocaleString('pt-BR')} disponíveis`}
              </span>
            )}
            <div className="hidden sm:block"><UsdtEstimate amount={selectedProduct.price * quantity} compact /></div>
            {selectedProduct.downloadsCount > 0 && (
              <div className="mt-1 hidden items-center gap-1.5 text-[11px] font-medium text-ink-muted sm:flex">
                <Download className="w-3 h-3 text-ink-muted shrink-0" />
                <span>{selectedProduct.downloadsCount.toLocaleString('pt-BR')} solicitações confirmadas</span>
              </div>
            )}
          </div>

          <div className="flex w-full items-stretch gap-2 sm:w-auto sm:shrink-0 sm:items-end">
            {usesQuantity && (
              <div className="hidden sm:block">
                <label htmlFor="product-quantity" className="block text-[10px] font-semibold text-ink-muted mb-1">
                  Quantidade {minimumQuantity > 1 ? `(mín. ${minimumQuantity})` : ''}
                </label>
                <div className="flex items-center rounded-sm border border-borderSoft bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => changeQuantity(quantity - 1)}
                    disabled={quantity <= minimumQuantity}
                    className="w-11 h-11 inline-flex items-center justify-center text-ink hover:bg-surface-warm disabled:opacity-35 disabled:cursor-not-allowed"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="product-quantity"
                    type="number"
                    min={minimumQuantity}
                    max={maximumQuantity}
                    value={quantity}
                    onChange={event => changeQuantity(Number(event.target.value))}
                    className="w-14 h-11 border-x border-borderSoft text-center text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-describedby="product-quantity-stock"
                  />
                  <button
                    type="button"
                    onClick={() => changeQuantity(quantity + 1)}
                    disabled={quantity >= maximumQuantity}
                    className="w-11 h-11 inline-flex items-center justify-center text-ink hover:bg-surface-warm disabled:opacity-35 disabled:cursor-not-allowed"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div id="product-quantity-stock" className="mt-1 text-[10px] text-ink-muted">
                  {selectedProduct.unlimitedStock ? 'Disponibilidade contínua' : `${maximumQuantity.toLocaleString('pt-BR')} disponíveis`}
                </div>
              </div>
            )}
            {usesQuantity && (
              <div className="flex h-12 shrink-0 items-center overflow-hidden rounded-lg border border-borderSoft bg-white sm:hidden">
                <button
                  type="button"
                  onClick={() => changeQuantity(quantity - 1)}
                  disabled={quantity <= minimumQuantity}
                  className="inline-flex h-12 w-11 items-center justify-center text-ink transition-colors hover:bg-surface-warm disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="size-4" />
                </button>
                <input
                  id="product-quantity-mobile"
                  type="number"
                  inputMode="numeric"
                  min={minimumQuantity}
                  max={maximumQuantity}
                  value={quantity}
                  onChange={event => changeQuantity(Number(event.target.value))}
                  className="h-12 w-11 border-x border-borderSoft text-center text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20"
                  aria-label="Quantidade do produto"
                />
                <button
                  type="button"
                  onClick={() => changeQuantity(quantity + 1)}
                  disabled={quantity >= maximumQuantity}
                  className="inline-flex h-12 w-11 items-center justify-center text-ink transition-colors hover:bg-surface-warm disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            )}
            <button
              onClick={handleBuyNow}
              className="flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 sm:h-11 sm:flex-none sm:rounded-sm sm:px-6 sm:text-xs"
            >
              <span>{cartItem ? 'Atualizar compra' : 'Comprar agora'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
