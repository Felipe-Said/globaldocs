import React from 'react';
import {
  Download,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  ShoppingBag,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';

export type CustomerPanelView = 'overview' | 'orders' | 'downloads' | 'wallet' | 'profile';

type DashboardSidebarProps = {
  activeView: CustomerPanelView;
  customerName?: string;
  customerEmail: string;
  orderCount: number;
  downloadCount: number;
  collapsed?: boolean;
  mobile?: boolean;
  onSelect: (view: CustomerPanelView) => void;
  onCatalog: () => void;
  onLogout: () => void;
  onClose?: () => void;
};

type SidebarItem = {
  id: CustomerPanelView;
  title: string;
  icon: React.ElementType;
  badge?: number;
};

const groups: Array<{ heading: string; items: SidebarItem[] }> = [
  {
    heading: 'Painel',
    items: [{ id: 'overview', title: 'Visão geral', icon: LayoutDashboard }],
  },
  {
    heading: 'Minha biblioteca',
    items: [
      { id: 'orders', title: 'Meus pedidos', icon: ReceiptText },
      { id: 'downloads', title: 'Downloads', icon: Download },
    ],
  },
  {
    heading: 'Conta',
    items: [
      { id: 'wallet', title: 'Minha carteira', icon: WalletCards },
      { id: 'profile', title: 'Meu perfil', icon: UserRound },
    ],
  },
];

export function CustomerDashboardSidebar({
  activeView,
  customerName,
  customerEmail,
  orderCount,
  downloadCount,
  collapsed = false,
  mobile = false,
  onSelect,
  onCatalog,
  onLogout,
  onClose,
}: DashboardSidebarProps) {
  const displayName = customerName?.trim() || customerEmail.split('@')[0] || 'Cliente';
  const badgeById: Partial<Record<CustomerPanelView, number>> = {
    orders: orderCount,
    downloads: downloadCount,
  };
  const hideLabels = collapsed && !mobile;

  return (
    <aside
      aria-label="Navegação da conta"
      className={`flex h-full flex-col border-r border-borderSoft bg-surface transition-[width] duration-300 ease-out ${hideLabels ? 'w-[76px]' : 'w-[260px]'}`}
    >
      <div className={`flex min-h-[76px] items-center border-b border-borderSoft ${hideLabels ? 'justify-center px-3' : 'gap-3 px-4'}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold uppercase text-white shadow-sm">
          {displayName.charAt(0)}
        </div>
        {!hideLabels && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{displayName}</p>
            <p className="truncate text-[11px] text-ink-muted">{customerEmail}</p>
          </div>
        )}
        {mobile && onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar menu" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-warm hover:text-ink">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {groups.map(group => (
            <section key={group.heading} aria-label={group.heading}>
              {!hideLabels && <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">{group.heading}</p>}
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const badge = badgeById[item.id];
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      aria-label={hideLabels ? item.title : undefined}
                      title={hideLabels ? item.title : undefined}
                      onClick={() => onSelect(item.id)}
                      className={`group flex min-h-11 w-full cursor-pointer items-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${hideLabels ? 'justify-center px-2' : 'gap-3 px-3'} ${active ? 'bg-primary font-semibold text-white shadow-sm' : 'text-ink-muted hover:bg-surface-warm hover:text-ink'}`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
                      {!hideLabels && <span className="min-w-0 flex-1 truncate text-left text-[13px]">{item.title}</span>}
                      {!hideLabels && badge !== undefined && badge > 0 && (
                        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${active ? 'bg-white/20 text-white' : 'bg-primary-tint text-primary-pressed'}`}>{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="space-y-1 border-t border-borderSoft p-3">
        <button type="button" onClick={onCatalog} aria-label={hideLabels ? 'Voltar ao catálogo' : undefined} title={hideLabels ? 'Voltar ao catálogo' : undefined} className={`flex min-h-11 w-full cursor-pointer items-center rounded-xl text-ink-muted transition-colors hover:bg-surface-warm hover:text-ink ${hideLabels ? 'justify-center px-2' : 'gap-3 px-3'}`}>
          <ShoppingBag className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
          {!hideLabels && <span className="text-[13px] font-medium">Voltar ao catálogo</span>}
        </button>
        <button type="button" onClick={onLogout} aria-label={hideLabels ? 'Sair da conta' : undefined} title={hideLabels ? 'Sair da conta' : undefined} className={`flex min-h-11 w-full cursor-pointer items-center rounded-xl text-rose-700 transition-colors hover:bg-rose-50 ${hideLabels ? 'justify-center px-2' : 'gap-3 px-3'}`}>
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
          {!hideLabels && <span className="text-[13px] font-medium">Sair da conta</span>}
        </button>
      </div>
    </aside>
  );
}
