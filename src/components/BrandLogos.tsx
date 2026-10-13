import React, { useState } from 'react';
import { BrandInfo } from '../utils/brandDetection';

interface BrandBadgeProps {
  brand: BrandInfo;
  size?: 'xs' | 'sm' | 'md';
  showName?: boolean;
}

export const BrandBadge: React.FC<BrandBadgeProps> = ({ 
  brand, 
  size = 'sm', 
  showName = true 
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // If SVG fails to load, gracefully fall back to clean text pill without breaking layout
    return showName ? (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-surface-warm text-ink-muted whitespace-nowrap shrink-0 select-none">
        {brand.name}
      </span>
    ) : null;
  }

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  const textSizes = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-xs',
  };

  return (
    <span 
      title={`Compatível / Integrado com ${brand.name} (via thesvg.org)`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[#ECECEF] hover:bg-[#E2E2E6] text-ink whitespace-nowrap shrink-0 transition-colors select-none ${
        size === 'xs' ? 'py-0.5 px-1.5' : ''
      }`}
      style={{ border: 'none' }}
    >
      <img
        src={brand.url}
        alt={brand.name}
        className={`${iconSizes[size]} object-contain shrink-0`}
        loading="lazy"
        style={{
          // Ensures micro-contrast so white/light logo strokes never vanish on light mode
          filter: 'drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.14))',
        }}
        onError={() => setHasError(true)}
      />
      {showName && (
        <span className={`font-semibold text-ink ${textSizes[size]}`}>
          {brand.name}
        </span>
      )}
    </span>
  );
};

interface BrandLogosListProps {
  brands: BrandInfo[];
  size?: 'xs' | 'sm' | 'md';
  maxItems?: number;
  className?: string;
  showName?: boolean;
}

export const BrandLogosList: React.FC<BrandLogosListProps> = ({
  brands,
  size = 'sm',
  maxItems = 3,
  className = '',
  showName = true,
}) => {
  if (!brands || brands.length === 0) return null;

  const visibleBrands = brands.slice(0, maxItems);
  const remainingCount = brands.length - maxItems;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visibleBrands.map((brand) => (
        <BrandBadge 
          key={brand.slug} 
          brand={brand} 
          size={size} 
          showName={showName} 
        />
      ))}

      {remainingCount > 0 && (
        <span 
          title={`+${remainingCount} outras marcas detectadas`}
          className="text-[10px] font-bold text-ink-muted bg-surface-warm px-1.5 py-0.5 rounded-xs whitespace-nowrap shrink-0 select-none"
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
};
