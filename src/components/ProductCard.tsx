import React from 'react';
import { DigitalProduct, FileFormat, ProductType } from '../types';
import { useStore } from '../context/StoreContext';
import { detectBrands } from '../utils/brandDetection';
import { BrandLogosList } from './BrandLogos';
import { detectCountries } from '../utils/countryDetection';
import { CountryBadgesList } from './CountryBadge';
import { 
  Download, 
  FileCode, 
  FileSpreadsheet, 
  FileText, 
  FileArchive, 
  Palette, 
  Star, 
  Check, 
  Plus, 
  Eye,
  Building2,
  CreditCard,
  Package,
  FileCheck,
  Briefcase,
  Zap,
  Clock,
  Rocket
  ,Layers
} from 'lucide-react';

interface ProductCardProps {
  product: DigitalProduct;
}

const getFormatBadge = (format: FileFormat) => {
  switch (format) {
    case 'DOCX':
      return { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText, label: 'Word .docx' };
    case 'XLSX':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet, label: 'Excel .xlsx' };
    case 'FIG':
      return { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Palette, label: 'Figma .fig' };
    case 'ZIP':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileArchive, label: 'Pacote .zip' };
    case 'PDF':
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: FileText, label: 'PDF Oficial' };
    case 'PACOTE':
      return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Package, label: 'Pacote Digital' };
    default:
      return { bg: 'bg-neutral-50 text-neutral-700 border-neutral-200', icon: FileCode, label: format };
  }
};

const getTypePill = (type: string) => {
  const lower = (type || '').toLowerCase();
  let icon = FileCheck;
  let bg = 'bg-blue-100 text-blue-800 border-blue-200';

  if (lower.includes('llc') || lower.includes('usa') || lower.includes('empresa')) {
    icon = Building2;
    bg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (lower.includes('conta') || lower.includes('banc') || lower.includes('finance')) {
    icon = CreditCard;
    bg = 'bg-indigo-100 text-indigo-800 border-indigo-200';
  } else if (lower.includes('serviço') || lower.includes('servico') || lower.includes('consultoria') || lower.includes('assessoria') || lower.includes('mentoria')) {
    icon = Briefcase;
    bg = 'bg-purple-100 text-purple-800 border-purple-200';
  }

  return { bg, icon, label: type || 'Digital' };
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setSelectedProduct, cart, collections } = useStore();
  const formatBadge = getFormatBadge(product.format);
  const typePill = getTypePill(product.productType || 'digital');
  const TypeIcon = typePill.icon;
  const collection = collections.find(c => c.id === product.collectionId);

  const isInCart = cart.some(item => item.product.id === product.id);
  const detectedBrands = detectBrands(product);
  const detectedCountries = detectCountries(product);

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="h-full bg-surface rounded-md border border-borderSoft p-5 flex flex-col justify-between hover:shadow-notion-card transition-all duration-200 group relative">
      <div>
        {/* Top Header: Type Pill & Countries & Rating */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap shrink-0 ${typePill.bg}`}>
              <TypeIcon className="w-3 h-3 shrink-0" />
              <span>{typePill.label}</span>
            </span>

            {/* Bandeiras Vetoriais e Siglas Oficiais (Uniforme, sem emojis, sem bordas) */}
            {detectedCountries.length > 0 && (
              <CountryBadgesList countries={detectedCountries} size="xs" maxItems={2} />
            )}
          </div>

          {product.rating > 0 ? (
            <div className="flex items-center gap-1 text-[11px] text-ink font-medium shrink-0">
              <Star className="w-3 h-3 fill-accent-amber text-accent-amber shrink-0" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-[10px] text-ink-faint">Novo</span>
          )}
        </div>

        {/* Collection & Format */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-[10px] font-mono text-ink-muted bg-surface-warm px-1.5 py-0.5 rounded border border-borderSoft whitespace-nowrap shrink-0">
            {formatBadge.label}
          </span>
          {collection && (
            <span className="inline-flex items-center gap-1 text-[10px] text-primary truncate max-w-[140px] font-medium whitespace-nowrap">
              <Layers className="w-3 h-3 shrink-0" aria-hidden="true" />
              {collection.name}
            </span>
          )}
        </div>

        {product.subcategory && (
          <div className="mb-2">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
              {product.subcategory}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 
          onClick={() => setSelectedProduct(product)}
          className="font-bold text-base text-ink group-hover:text-primary transition-colors cursor-pointer line-clamp-2 leading-snug tracking-tight mb-1.5"
        >
          {product.title}
        </h3>

        {/* Tagline / Subtitle */}
        <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed mb-3">
          {product.tagline}
        </p>

        {/* Delivery / Agilidade Notice */}
        {product.deliverySpeed === 'immediate' || product.deliveryTime?.toLowerCase().includes('imediato') ? (
          <div className="mb-2.5 text-[11px] bg-emerald-50/90 text-emerald-950 px-2 py-1 rounded border border-emerald-200 font-semibold flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500 shrink-0" />
            <span>Pronta Entrega / Imediato</span>
          </div>
        ) : product.deliverySpeed === 'fast' ? (
          <div className="mb-2.5 text-[11px] bg-blue-50/90 text-blue-950 px-2 py-1 rounded border border-blue-200 font-semibold flex items-center gap-1.5">
            <Rocket className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Entrega Rápida • {product.deliveryTime || 'Poucas horas'}</span>
          </div>
        ) : product.deliveryTime ? (
          <div className="mb-2.5 text-[11px] bg-surface-warm text-ink-muted px-2 py-1 rounded border border-borderSoft font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-ink-muted shrink-0" />
            <span>Prazo médio: <strong className="text-ink">{product.deliveryTime}</strong></span>
          </div>
        ) : null}

        {/* Detected Brand Logos from theSVG (sem quebrar layout) */}
        {detectedBrands.length > 0 && (
          <div className="mb-3">
            <BrandLogosList brands={detectedBrands} size="sm" maxItems={3} />
          </div>
        )}

        {/* Specific Type Notice */}
        {product.llcJurisdiction && (
          <div className="mb-3 text-[11px] bg-emerald-50/70 text-emerald-900 px-2 py-1 rounded border border-emerald-200 font-medium truncate">
            Jurisdição: {product.llcJurisdiction}
          </div>
        )}
        {product.shippingInfo && (
          <div className="mb-3 text-[11px] bg-amber-50/70 text-amber-900 px-2 py-1 rounded border border-amber-200 font-medium truncate">
            {product.shippingInfo}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {product.tags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx}
              className="text-[10px] px-1.5 py-0.5 bg-surface-warm text-ink-muted rounded-xs border border-borderSoft"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Price & Buttons */}
      <div className="pt-3 border-t border-borderSoft/60 mt-auto">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-ink tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-ink-faint line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="text-[10px] text-ink-muted flex items-center gap-1">
              <Download className="w-2.5 h-2.5" />
              <span>{product.downloadsCount.toLocaleString('pt-BR')} solicitações</span>
            </div>
            {!product.unlimitedStock && product.stockQuantity > 1 && (
              <div className="mt-1 text-[10px] font-medium text-ink-muted">
                {Number(product.minimumOrder || 1) > 1
                  ? `Pedido mínimo: ${Number(product.minimumOrder).toLocaleString('pt-BR')} unidades`
                  : `Escolha de 1 a ${product.stockQuantity.toLocaleString('pt-BR')} unidades`}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedProduct(product)}
            className="h-9 px-2 rounded-sm bg-surface-warm hover:bg-black/[0.05] text-ink text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-borderSoft"
          >
            <Eye className="w-3.5 h-3.5 text-ink-muted" />
            <span>Detalhes</span>
          </button>

          <button
            onClick={() => addToCart(product)}
            disabled={isInCart}
            className={`h-9 px-2 rounded-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isInCart
                ? 'bg-success-tint text-success cursor-default'
                : 'bg-primary hover:bg-primary-pressed text-white'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span>No Carrinho</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Comprar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
