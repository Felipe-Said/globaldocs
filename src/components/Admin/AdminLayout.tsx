import React, { Suspense, lazy, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { AdminLogin } from './AdminLogin';
import {
  Bell, ChevronRight, ExternalLink, FolderTree, Image as ImageIcon, Key,
  LayoutGrid, LogOut, Package, Settings, ShieldCheck, ShoppingBag, Store, Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail,
  SidebarSeparator, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';

const Dashboard = lazy(() => import('@/components/dashboard').then(module => ({ default: module.Dashboard })));
const AdminProducts = lazy(() => import('./AdminProducts').then(module => ({ default: module.AdminProducts })));
const AdminCollections = lazy(() => import('./AdminCollections').then(module => ({ default: module.AdminCollections })));
const AdminOrders = lazy(() => import('./AdminOrders').then(module => ({ default: module.AdminOrders })));
const AdminCoupons = lazy(() => import('./AdminCoupons').then(module => ({ default: module.AdminCoupons })));
const AdminBanners = lazy(() => import('./AdminBanners').then(module => ({ default: module.AdminBanners })));
const AdminSettings = lazy(() => import('./AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminAPIs = lazy(() => import('./AdminAPIs').then(module => ({ default: module.AdminAPIs })));

type AdminTab = 'overview' | 'products' | 'collections' | 'banners' | 'orders' | 'coupons' | 'apis' | 'settings';

type NavItem = {
  id: AdminTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  badge?: number;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Operação',
    items: [
      { id: 'overview', label: 'Visão Geral & Métricas', shortLabel: 'Visão geral', icon: LayoutGrid },
      { id: 'products', label: 'Arquivos, LLC & Contas', shortLabel: 'Produtos', icon: Package },
      { id: 'collections', label: 'Coleções', shortLabel: 'Coleções', icon: FolderTree },
      { id: 'banners', label: 'Banners da Loja', shortLabel: 'Banners', icon: ImageIcon },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { id: 'orders', label: 'Vendas & Pedidos', shortLabel: 'Pedidos', icon: ShoppingBag },
      { id: 'coupons', label: 'Cupons de Desconto', shortLabel: 'Cupons', icon: Tag },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { id: 'apis', label: 'APIs & Integrações', shortLabel: 'APIs', icon: Key },
      { id: 'settings', label: 'Configurações', shortLabel: 'Configurações', icon: Settings },
    ],
  },
];

function AdminShell() {
  const { adminLogout, orders, settings } = useStore();
  const { setOpenMobile } = useSidebar();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const pendingOrdersCount = orders.filter(order => order.status === 'pending').length;
  const pendingDeliveries = orders.filter(order => order.status === 'paid' && order.items.some(item => item.requiresFulfillment) && order.fulfillmentStatus !== 'completed').length;
  const totalAlerts = pendingOrdersCount + pendingDeliveries;

  const navGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item => item.id === 'orders' ? { ...item, badge: totalAlerts } : item),
  }));
  const activeItem = navGroups.flatMap(group => group.items).find(item => item.id === activeTab);

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setOpenMobile(false);
  };

  return (
    <>
      <Sidebar variant="inset" collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-2.5">
          <div className="flex h-11 items-center gap-3 rounded-lg px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/10">
              <img src="/logo-icon.png" alt="" className="size-7 object-contain" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-bold text-sidebar-foreground">{settings.storeName}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">Central administrativa</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="px-1 py-2">
          {navGroups.map(group => (
            <SidebarGroup key={group.label} className="p-1.5">
              <SidebarGroupLabel className="h-7 text-[10px] font-bold uppercase tracking-[0.14em]">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          type="button"
                          size="default"
                          isActive={isActive}
                          tooltip={item.label}
                          onClick={() => selectTab(item.id)}
                          className="min-h-10 cursor-pointer rounded-lg px-3 data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-sm hover:bg-sidebar-accent"
                        >
                          <Icon className="size-4" aria-hidden={true} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {Boolean(item.badge) && (
                          <SidebarMenuBadge className={isActive ? 'bg-white text-primary' : 'bg-amber-100 text-amber-800'}>
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="gap-1.5 p-2.5">
          <div className="rounded-lg border border-sidebar-border bg-white/70 p-2.5 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground">
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden={true} />
              Ambiente protegido
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-sidebar-foreground/60">Sessão administrativa protegida por autenticação e políticas de acesso.</p>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                size="default"
                tooltip="Sair da conta"
                onClick={adminLogout}
                className="min-h-10 cursor-pointer text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <LogOut className="size-4" aria-hidden={true} />
                <span>Sair da conta</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-hidden bg-[#f7f8fa] md:my-2 md:mr-2 md:rounded-2xl md:border md:border-black/5 md:shadow-sm">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-white/95 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger aria-label="Abrir ou recolher navegação" className="size-11 rounded-lg border text-muted-foreground hover:bg-muted" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Admin</span>
              <ChevronRight className="size-3" aria-hidden={true} />
              <span className="truncate">{activeItem?.shortLabel}</span>
            </div>
            <h1 className="truncate text-base font-semibold text-foreground">{activeItem?.label}</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${totalAlerts} pendências em pedidos`}
              onClick={() => selectTab('orders')}
              className="relative size-11 rounded-lg text-muted-foreground"
            >
              <Bell className="size-4" aria-hidden={true} />
              {totalAlerts > 0 && (
                <span className="absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
                  {totalAlerts}
                </span>
              )}
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-lg px-3 text-xs shadow-xs">
              <Link to="/">
                <Store className="size-4 text-muted-foreground" aria-hidden={true} />
                <span className="hidden sm:inline">Ver loja</span>
                <ExternalLink className="size-3 text-muted-foreground" aria-hidden={true} />
              </Link>
            </Button>
            <Avatar className="size-9 ring-1 ring-black/10">
              <AvatarFallback className="bg-primary text-xs font-bold text-white">A</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<AdminModuleSkeleton />}>
            {activeTab === 'overview' && <Dashboard onNavigateOrders={() => selectTab('orders')} />}
            {activeTab === 'products' && <AdminProducts />}
            {activeTab === 'collections' && <AdminCollections />}
            {activeTab === 'banners' && <AdminBanners />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'coupons' && <AdminCoupons />}
            {activeTab === 'apis' && <AdminAPIs />}
            {activeTab === 'settings' && <AdminSettings />}
          </Suspense>
        </main>
      </SidebarInset>
    </>
  );
}

function AdminModuleSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Carregando módulo">
      <div className="h-8 w-64 animate-pulse rounded-md bg-black/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(item => <div key={item} className="h-32 animate-pulse rounded-xl bg-black/5" />)}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-black/5" />
    </div>
  );
}

export const AdminLayout: React.FC = () => {
  const { isAdminAuthenticated } = useStore();
  if (!isAdminAuthenticated) return <AdminLogin />;

  return (
    <SidebarProvider defaultOpen>
      <AdminShell />
    </SidebarProvider>
  );
};
