import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Dashboard } from '@/components/dashboard';
import { AdminProducts } from './AdminProducts';
import { AdminCollections } from './AdminCollections';
import { AdminOrders } from './AdminOrders';
import { AdminCoupons } from './AdminCoupons';
import { AdminBanners } from './AdminBanners';
import { AdminSettings } from './AdminSettings';
import { AdminAPIs } from './AdminAPIs';
import { AdminLogin } from './AdminLogin';
import { 
  LayoutGrid, 
  Package, 
  FolderTree, 
  ShoppingBag, 
  Tag, 
  Image as ImageIcon,
  Settings, 
  ShieldCheck,
  LogOut,
  ExternalLink,
  Store,
  ChevronRight,
  Key
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AdminTab = 'overview' | 'products' | 'collections' | 'banners' | 'orders' | 'coupons' | 'apis' | 'settings';

export const AdminLayout: React.FC = () => {
  const { isAdminAuthenticated, adminLogout, orders, settings } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // If not authenticated, render the login gate
  if (!isAdminAuthenticated) {
    return <AdminLogin />;
  }

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const navItems = [
    { id: 'overview' as AdminTab, label: 'Visão Geral & Métricas', icon: LayoutGrid },
    { id: 'products' as AdminTab, label: 'Arquivos, LLC & Contas', icon: Package },
    { id: 'collections' as AdminTab, label: 'Coleções', icon: FolderTree },
    { id: 'banners' as AdminTab, label: 'Banners da Loja', icon: ImageIcon },
    { id: 'orders' as AdminTab, label: 'Vendas & Pedidos', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
    { id: 'coupons' as AdminTab, label: 'Cupons de Desconto', icon: Tag },
    { id: 'apis' as AdminTab, label: 'APIs', icon: Key },
    { id: 'settings' as AdminTab, label: 'Configurações', icon: Settings },
  ];

  const activeLabel = navItems.find(i => i.id === activeTab)?.label || 'Visão Geral';

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col antialiased">
      
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-background border-b h-14 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <img 
              src="/logo-icon.png" 
              alt="Global DOCS" 
              className="w-7 h-7 object-contain" 
            />
            <span>{settings.storeName} Admin</span>
          </div>

          <span className="text-muted-foreground/40 hidden sm:inline">•</span>

          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">{activeLabel}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="h-8 px-2.5 rounded-md bg-background hover:bg-muted text-xs font-medium border transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Ver Loja Pública</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </Link>

          <button
            onClick={adminLogout}
            className="h-8 px-2.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Encerrar sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="w-64 border-r bg-background shrink-0 hidden md:flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Módulos de Gestão
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full h-9 px-3 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-primary text-white font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white text-primary' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ambiente Protegido</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Dados protegidos por autenticação Supabase e políticas de acesso no banco.
            </p>
          </div>
        </aside>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden w-full border-b bg-background px-4 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`h-8 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-white font-semibold'
                    : 'bg-muted/40 text-muted-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Dashboard />
            </div>
          )}

          {activeTab === 'products' && (
            <AdminProducts />
          )}

          {activeTab === 'collections' && (
            <AdminCollections />
          )}

          {activeTab === 'banners' && (
            <AdminBanners />
          )}

          {activeTab === 'orders' && (
            <AdminOrders />
          )}

          {activeTab === 'coupons' && (
            <AdminCoupons />
          )}

          {activeTab === 'apis' && (
            <AdminAPIs />
          )}

          {activeTab === 'settings' && (
            <AdminSettings />
          )}
        </main>

      </div>
    </div>
  );
};
