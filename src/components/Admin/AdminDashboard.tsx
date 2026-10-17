import React from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  DollarSign, 
  ShoppingBag, 
  FileText, 
  DownloadCloud, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Tag, 
  FolderTree,
  SlidersHorizontal 
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab?: (tab: 'overview' | 'products' | 'collections' | 'orders' | 'coupons' | 'settings') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { 
    orders, 
    products, 
    collections,
    updateOrderStatus 
  } = useStore();

  const totalRevenue = orders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const totalPaidOrders = orders.filter(o => o.status === 'paid').length;
  const totalDownloads = products.reduce((sum, p) => sum + p.downloadsCount, 0);
  const activeProducts = products.filter(p => p.active).length;

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-surface p-5 rounded-md border border-borderSoft shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Faturamento Total</span>
            <div className="w-8 h-8 rounded-sm bg-success-tint text-success flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-ink tracking-tight">
              {formatPrice(totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-success mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Recebimento via Pix & Cartão</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface p-5 rounded-md border border-borderSoft shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Vendas Confirmadas</span>
            <div className="w-8 h-8 rounded-sm bg-primary-tint text-primary-pressed flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-ink tracking-tight">
              {totalPaidOrders}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              {orders.length} pedidos registrados
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface p-5 rounded-md border border-borderSoft shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Catálogo Ativo</span>
            <div className="w-8 h-8 rounded-sm bg-amber-50 text-accent-amber-deep flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-ink tracking-tight">
              {activeProducts}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              {collections.length} coleções ativas
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface p-5 rounded-md border border-borderSoft shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Downloads & Entregas</span>
            <div className="w-8 h-8 rounded-sm bg-purple-50 text-purple-700 flex items-center justify-center">
              <DownloadCloud className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-ink tracking-tight">
              {totalDownloads.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              Arquivos, LLC & Remessas
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="bg-surface-warm p-4 rounded-md border border-borderSoft flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-ink font-semibold">
          Ações Rápidas de Gerenciamento:
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => onNavigateTab?.('products')}
            className="h-8 px-3 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Arquivo/LLC</span>
          </button>
          <button
            onClick={() => onNavigateTab?.('collections')}
            className="h-8 px-3 rounded-sm bg-white hover:bg-black/[0.04] text-ink text-xs font-medium border border-borderSoft transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FolderTree className="w-3.5 h-3.5 text-primary" />
            <span>Gerenciar Coleções</span>
          </button>
          <button
            onClick={() => onNavigateTab?.('coupons')}
            className="h-8 px-3 rounded-sm bg-white hover:bg-black/[0.04] text-ink text-xs font-medium border border-borderSoft transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Criar Cupom</span>
          </button>
          <button
            onClick={() => onNavigateTab?.('settings')}
            className="h-8 px-3 rounded-sm bg-white hover:bg-black/[0.04] text-ink text-xs font-medium border border-borderSoft transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-surface rounded-md border border-borderSoft shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-borderSoft flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-ink">Últimas Vendas & Solicitações</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Transações recentes efetuadas na plataforma
            </p>
          </div>
          <button
            onClick={() => onNavigateTab?.('orders')}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Ver todos os pedidos →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-warm border-b border-borderSoft text-ink-muted font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Pedido</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSoft">
              {orders.slice(0, 6).map((order) => {
                const isPaid = order.status === 'paid';
                return (
                  <tr key={order.id} className="hover:bg-surface-warm/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink">{order.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">{order.customerName}</div>
                      <div className="text-[11px] text-ink-muted">{order.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-ink line-clamp-1 max-w-[200px]">
                        {order.items.map(i => i.productTitle).join(', ')}
                      </div>
                      <div className="text-[10px] text-ink-muted">{order.items.length} item(ns)</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-ink">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-medium text-ink-muted">
                      {order.paymentMethod === 'wallet' ? 'Carteira' : order.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isPaid 
                          ? 'bg-success-tint text-success' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isPaid && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className="px-2 py-1 bg-success-tint hover:bg-success hover:text-white text-success rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Aprovar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
