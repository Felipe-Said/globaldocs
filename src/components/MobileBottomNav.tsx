import React from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Home, 
  DownloadCloud, 
  ShoppingBag, 
  Search
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const MobileBottomNav: React.FC = () => {
  const { cartCount, setIsCartOpen, orders, customerUser } = useStore();
  const location = useLocation();

  const paidOrdersCount = customerUser 
    ? orders.filter(o => o.status === 'paid' && o.customerEmail.toLowerCase().trim() === customerUser.email.toLowerCase().trim()).length 
    : 0;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-borderSoft shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-15 px-4 max-w-md mx-auto">
        {/* Tab 1: Loja */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            location.pathname === '/' 
              ? 'text-primary font-semibold' 
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${location.pathname === '/' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Início</span>
        </Link>

        {/* Tab 2: Downloads */}
        <Link
          to="/downloads"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            location.pathname === '/downloads' 
              ? 'text-primary font-semibold' 
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <div className="relative">
            <DownloadCloud className={`w-5 h-5 transition-transform ${location.pathname === '/downloads' ? 'scale-110' : ''}`} />
            {paidOrdersCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] font-bold px-1 rounded-full min-w-3.5 text-center leading-tight">
                {paidOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">Meus Downloads</span>
        </Link>

        {/* Tab 3: Sacola de Compras */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-ink-muted hover:text-primary transition-all relative cursor-pointer"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary-tint text-primary flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center leading-tight">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5 font-medium text-ink">Sacola</span>
        </button>
      </div>
    </nav>
  );
};
