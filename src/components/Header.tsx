import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  FileText, 
  ShoppingBag, 
  DownloadCloud, 
  Search,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { 
    cartCount, 
    setIsCartOpen,
    searchQuery,
    setSearchQuery,
    settings,
    customerUser
  } = useStore();

  const location = useLocation();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-borderSoft transition-all">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-6">
          <Link 
            to="/"
            className="flex items-center group cursor-pointer focus:outline-none"
            title={settings.storeName}
          >
            <img 
              src="/logo.png" 
              alt={settings.storeName} 
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]" 
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`h-[30px] px-3 rounded-xs text-sm font-medium transition-colors cursor-pointer flex items-center ${
                location.pathname === '/'
                  ? 'bg-primary-tint text-primary-pressed font-semibold'
                  : 'text-ink/90 hover:bg-black/[0.05]'
              }`}
            >
              Catálogo de Arquivos
            </Link>
            <Link
              to="/downloads"
              className={`h-[30px] px-3 rounded-xs text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                location.pathname === '/downloads'
                  ? 'bg-primary-tint text-primary-pressed font-semibold'
                  : 'text-ink/90 hover:bg-black/[0.05]'
              }`}
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Meus Downloads</span>
              {customerUser && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title={`Conectado como ${customerUser.email}`} />
              )}
            </Link>
          </nav>
        </div>

        {/* Center Search Input (Desktop) */}
        {location.pathname === '/' && (
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-8">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Buscar LLC, contratos, planilhas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-warm border border-borderSoft rounded-sm text-ink placeholder:text-ink-faint focus:bg-white focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Top Actions (Search toggle + Cart) */}
        <div className="flex items-center space-x-2">
          {/* Mobile Search Toggle */}
          {location.pathname === '/' && (
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-sm text-ink-muted hover:text-ink bg-surface-warm border border-borderSoft transition-colors cursor-pointer"
              aria-label="Buscar"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="h-8 sm:h-9 px-3 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs relative group active:scale-95"
            aria-label="Sacola"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Carrinho</span>
            {cartCount > 0 && (
              <span className="bg-white text-primary font-bold text-[10px] rounded-full px-1.5 py-0.2 min-w-4 text-center leading-tight">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {showMobileSearch && location.pathname === '/' && (
        <div className="lg:hidden px-3.5 py-2.5 bg-surface-warm/80 border-t border-borderSoft animate-fadeIn">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar contratos, LLC, planilhas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-borderSoft rounded-sm text-ink placeholder:text-ink-faint focus:border-primary shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
