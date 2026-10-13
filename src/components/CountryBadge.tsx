import React, { useState } from 'react';
import { CountryInfo } from '../utils/countryDetection';

interface CountryBadgeProps {
  country: CountryInfo;
  size?: 'xs' | 'sm' | 'md';
}

export const CountryBadge: React.FC<CountryBadgeProps> = ({ country, size = 'sm' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: {
      container: 'px-1.5 py-0.5 text-[9px] gap-1',
      flag: 'w-3.5 h-2.5',
      text: 'text-[9px]'
    },
    sm: {
      container: 'px-1.5 py-0.5 text-[10px] gap-1.5',
      flag: 'w-4 h-2.5',
      text: 'text-[10px]'
    },
    md: {
      container: 'px-2 py-1 text-xs gap-1.5',
      flag: 'w-5 h-3.5',
      text: 'text-xs'
    }
  }[size];

  return (
    <span 
      className={`inline-flex items-center ${sizeClasses.container} rounded-xs bg-[#ECECEF] hover:bg-[#E2E2E6] text-ink font-semibold whitespace-nowrap shrink-0 transition-colors select-none`}
      style={{ border: 'none', outline: 'none' }}
      title={`País: ${country.name} (${country.sigla})`}
    >
      {!imageError ? (
        <img
          src={country.flagUrl}
          alt={`Bandeira ${country.name}`}
          className={`${sizeClasses.flag} object-cover rounded-[1px] block shrink-0`}
          style={{ border: 'none', outline: 'none' }}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      )}
      <span className={`${sizeClasses.text} font-bold tracking-wider uppercase text-ink`}>
        {country.sigla}
      </span>
    </span>
  );
};

interface CountryBadgesListProps {
  countries: CountryInfo[];
  size?: 'xs' | 'sm' | 'md';
  maxItems?: number;
}

export const CountryBadgesList: React.FC<CountryBadgesListProps> = ({ 
  countries, 
  size = 'sm', 
  maxItems = 3 
}) => {
  if (!countries || countries.length === 0) return null;

  const visible = countries.slice(0, maxItems);
  const remaining = countries.length - maxItems;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((country) => (
        <CountryBadge key={country.code} country={country} size={size} />
      ))}
      {remaining > 0 && (
        <span 
          className="text-[10px] text-ink-muted font-bold px-1.5 py-0.5 bg-[#ECECEF] rounded-xs"
          style={{ border: 'none' }}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
};
