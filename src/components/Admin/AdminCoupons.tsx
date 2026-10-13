import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Percent, Check } from 'lucide-react';

export const AdminCoupons: React.FC = () => {
  const { coupons, addCoupon, toggleCoupon, deleteCoupon } = useStore();
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('15');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    addCoupon({
      code: code.trim(),
      discountPercent: parseInt(discountPercent, 10) || 10,
      active: true,
    });

    setCode('');
    setDiscountPercent('15');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-ink">Cupons de Desconto & Promoções</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Crie códigos promocionais para aumentar as conversões de vendas da loja
        </p>
      </div>

      {/* Create Coupon Box */}
      <div className="bg-surface p-5 rounded-md border border-borderSoft shadow-xs">
        <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span>Criar Novo Cupom</span>
        </h3>

        <form onSubmit={handleCreateCoupon} className="flex flex-wrap items-end gap-3 text-xs">
          <div className="flex-1 min-w-[200px]">
            <label className="block font-medium text-ink mb-1">Código do Cupom</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: PROMO2026, BLACKFRIDAY"
              className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink uppercase font-semibold focus:bg-white focus:border-primary"
            />
          </div>

          <div className="w-32">
            <label className="block font-medium text-ink mb-1">Desconto (%)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                required
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink font-semibold focus:bg-white focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted font-bold">%</span>
            </div>
          </div>

          <button
            type="submit"
            className="h-8.5 px-4 rounded-sm bg-primary hover:bg-primary-pressed text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Cupom</span>
          </button>
        </form>
      </div>

      {/* Coupons Table */}
      <div className="bg-surface rounded-md border border-borderSoft shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-warm border-b border-borderSoft text-ink-muted font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Código do Cupom</th>
                <th className="py-3 px-4">Desconto</th>
                <th className="py-3 px-4">Usos Registrados</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSoft">
              {coupons.map((coupon) => (
                <tr key={coupon.code} className="hover:bg-surface-warm/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-ink bg-surface-warm px-2 py-0.5 rounded border border-borderSoft">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-success">
                    {coupon.discountPercent}% OFF
                  </td>
                  <td className="py-3 px-4 text-ink">
                    {coupon.usageCount} utilizações
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleCoupon(coupon.code)}
                      className="cursor-pointer"
                    >
                      {coupon.active ? (
                        <span className="inline-flex items-center gap-1 text-success font-medium">
                          <ToggleRight className="w-5 h-5 text-success" />
                          <span>Ativo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ink-muted font-medium">
                          <ToggleLeft className="w-5 h-5 text-ink-muted" />
                          <span>Inativo</span>
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteCoupon(coupon.code)}
                      className="p-1.5 text-ink-muted hover:text-accent-red rounded hover:bg-surface-warm transition-colors cursor-pointer"
                      title="Excluir Cupom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
