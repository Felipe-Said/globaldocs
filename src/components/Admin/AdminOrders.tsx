import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Download, 
  Key, 
  ExternalLink, 
  Eye, 
  X,
  Copy,
  Check
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus, downloadFile, showToast } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
                          o.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}?token=${token}`);
    setCopiedToken(true);
    showToast('Link de acesso copiado para a área de transferência!');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-ink">Gestão de Vendas & Pedidos</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Visualize transações, status de pagamento e gerencie acessos de clientes
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-md border border-borderSoft">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Buscar por pedido, cliente ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-surface-warm border border-borderSoft rounded-xs px-2.5 py-1 text-xs font-medium text-ink focus:bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Pagamento Aprovado</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-md border border-borderSoft shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-warm border-b border-borderSoft text-ink-muted font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Pedido / Data</th>
                <th className="py-3 px-4">Cliente & Documento</th>
                <th className="py-3 px-4">Itens</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSoft">
              {filteredOrders.map((order) => {
                const isPaid = order.status === 'paid';
                const isPending = order.status === 'pending';

                return (
                  <tr key={order.id} className="hover:bg-surface-warm/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-ink">{order.id}</div>
                      <div className="text-[11px] text-ink-muted">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">{order.customerName}</div>
                      <div className="text-[11px] text-ink-muted">{order.customerEmail}</div>
                      <div className="text-[10px] text-ink-faint">{order.customerDocument}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-ink font-medium">
                        {order.items.length} arquivo(s)
                      </div>
                      <div className="text-[11px] text-ink-muted truncate max-w-[200px]">
                        {order.items.map(i => i.productTitle).join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-ink">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-medium text-ink-muted">
                      {order.paymentMethod === 'wallet' ? 'Carteira' : order.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                        isPaid 
                          ? 'bg-success-tint text-success border border-success/20' 
                          : isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isPaid && <CheckCircle className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        {!isPaid && !isPending && <XCircle className="w-3 h-3" />}
                        {isPaid ? 'Aprovado' : isPending ? 'Pendente' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2 py-1 bg-surface-warm hover:bg-black/[0.05] text-ink rounded text-[11px] font-medium transition-colors cursor-pointer border border-borderSoft flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detalhes</span>
                        </button>

                        {isPending && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'paid')}
                            className="px-2 py-1 bg-success-tint hover:bg-success hover:text-white text-success rounded text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Aprovar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-surface w-full max-w-lg rounded-md border border-borderSoft shadow-notion-modal overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-borderSoft flex items-center justify-between">
              <h3 className="font-bold text-base text-ink">
                Detalhes do Pedido #{selectedOrder.id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-surface-warm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-surface-warm rounded-sm border border-borderSoft">
                <div>
                  <div className="text-ink-muted text-[11px]">Cliente</div>
                  <div className="font-bold text-ink mt-0.5">{selectedOrder.customerName}</div>
                  <div className="text-ink-muted">{selectedOrder.customerEmail}</div>
                </div>
                <div>
                  <div className="text-ink-muted text-[11px]">Data & Pagamento</div>
                  <div className="font-bold text-ink mt-0.5">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-ink-muted uppercase">{selectedOrder.paymentMethod === 'wallet' ? 'Carteira' : selectedOrder.paymentMethod}</div>
                </div>
              </div>

              <div>
                <div className="text-ink-muted text-[11px] mb-1">Token de Acesso / Licença</div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={selectedOrder.downloadToken}
                    className="flex-1 bg-surface-warm border border-borderSoft px-3 py-1.5 rounded-sm font-mono text-xs text-ink"
                  />
                  <button
                    onClick={() => handleCopyLink(selectedOrder.downloadToken)}
                    className="h-8 px-3 rounded-sm bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-ink-muted text-[11px] font-bold uppercase mb-2">
                  Arquivos Comprados:
                </div>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-surface rounded-sm border border-borderSoft flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-ink">{item.productTitle}</div>
                        <div className="text-ink-muted font-mono text-[11px]">{item.downloadFileName}</div>
                      </div>
                      <button
                        onClick={() => downloadFile(item.productTitle, item.downloadFileName, item.format)}
                        className="h-7 px-2.5 rounded-xs bg-surface-warm hover:bg-black/[0.05] text-ink font-medium border border-borderSoft flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Baixar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-borderSoft flex items-center justify-between text-ink">
                <span className="font-bold">Total Pago:</span>
                <span className="font-bold text-sm">{formatPrice(selectedOrder.total)}</span>
              </div>

              {/* Status changer buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                {selectedOrder.status !== 'paid' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'paid');
                      setSelectedOrder({ ...selectedOrder, status: 'paid' });
                    }}
                    className="h-8 px-3 rounded-sm bg-success text-white font-medium text-xs hover:bg-success/90 cursor-pointer"
                  >
                    Marcar como Pago
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'cancelled');
                      setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
                    }}
                    className="h-8 px-3 rounded-sm bg-surface-warm text-accent-red font-medium text-xs hover:bg-rose-50 border border-borderSoft cursor-pointer"
                  >
                    Cancelar Pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
