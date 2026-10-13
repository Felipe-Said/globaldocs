import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BannerSlider: React.FC = () => {
  const { banners } = useStore();
  const activeBanners = banners.filter(b => b.active);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play slideshow if there are multiple active banners
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleClickBanner = () => {
    if (currentBanner.linkUrl) {
      if (currentBanner.linkUrl.startsWith('http')) {
        window.open(currentBanner.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = currentBanner.linkUrl;
      }
    }
  };

  return (
    <div className="w-full my-4 sm:my-6">
      {/* 
        Container de Banner:
        - SEM BORDAS (border-0 border-none)
        - Proporção específica para mobile (aspect-[16/9]) e desktop (aspect-[21/7])
      */}
      <div 
        onClick={handleClickBanner}
        className={`group relative w-full overflow-hidden rounded-md sm:rounded-lg select-none bg-surface-warm ${
          currentBanner.linkUrl ? 'cursor-pointer' : ''
        }`}
        style={{ border: 'none' }}
      >
        {/* Responsive Aspect Ratio Wrapper: Mobile 16:9, Desktop 21:7 */}
        <div className="w-full aspect-[16/9] sm:aspect-[21/7] relative overflow-hidden">
          <picture className="w-full h-full block">
            {/* Mobile Viewport Source (<= 639px) */}
            <source 
              media="(max-width: 639px)" 
              srcSet={currentBanner.mobileImageUrl || currentBanner.desktopImageUrl} 
            />
            {/* Desktop Viewport Source (>= 640px) */}
            <source 
              media="(min-width: 640px)" 
              srcSet={currentBanner.desktopImageUrl} 
            />
            {/* Fallback Image: sem bordas, object-cover */}
            <img 
              src={currentBanner.desktopImageUrl} 
              alt={currentBanner.title}
              className="w-full h-full object-cover block border-0 border-none outline-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              style={{ border: 'none', outline: 'none' }}
              loading="eager"
            />
          </picture>

          {/* Optional Text Overlay (Discreet editorial gradient for readability) */}
          {(currentBanner.title || currentBanner.subtitle) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8 text-white pointer-events-none">
              {currentBanner.title && (
                <h3 className="text-base sm:text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm leading-snug">
                  {currentBanner.title}
                </h3>
              )}
              {currentBanner.subtitle && (
                <p className="text-xs sm:text-sm md:text-base text-white/90 line-clamp-2 mt-1 max-w-2xl font-normal drop-shadow-sm">
                  {currentBanner.subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Carousel Controls (if more than 1 banner) */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              aria-label="Banner Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer border-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              aria-label="Próximo Banner"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer border-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-auto">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Ir para banner ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer border-none ${
                    idx === currentIndex 
                      ? 'w-6 bg-white shadow-xs' 
                      : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
