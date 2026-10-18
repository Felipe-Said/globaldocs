import { AlertCircle, Bot, Boxes, CircleDollarSign, Globe2, RefreshCw, ShoppingBag, UserRound, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { useStore } from '@/context/StoreContext';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

const metricCardClass = 'h-full min-h-[196px] overflow-hidden rounded-2xl border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const metricIconClass = 'flex size-10 shrink-0 items-center justify-center rounded-xl';

type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconClassName: string;
};

export function DashboardStats() {
  const { orders, products, collections } = useStore();
  const paidOrders = orders.filter(order => order.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const activeProductsCount = products.filter(product => product.active).length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  const dynamicStats: Stat[] = [
    {
      label: 'Faturamento confirmado',
      value: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      hint: `${paidOrders.length} ${paidOrders.length === 1 ? 'venda aprovada' : 'vendas aprovadas'}`,
      icon: CircleDollarSign,
      iconClassName: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Pedidos registrados',
      value: orders.length.toLocaleString('pt-BR'),
      hint: `${pendingOrders} aguardando pagamento`,
      icon: ShoppingBag,
      iconClassName: 'bg-blue-50 text-primary',
    },
    {
      label: 'Catálogo publicado',
      value: activeProductsCount.toLocaleString('pt-BR'),
      hint: `${collections.length} coleções ativas`,
      icon: Boxes,
      iconClassName: 'bg-violet-50 text-violet-700',
    },
  ];

  return (
    <>
      <StatCard stat={dynamicStats[0]} />
      <StatCard stat={dynamicStats[1]} />
      <TrafficCard />
      <StatCard stat={dynamicStats[2]} />
      <IntegrationBalanceCard />
    </>
  );
}

type TrafficMetrics = {
  totalAccesses: number;
  humanAccesses: number;
  botAccesses: number;
  uniqueHumans: number;
  todayAccesses: number;
  onlineHumans: number;
  onlineBots: number;
  todayHumans: number;
  todayBots: number;
  liveWindowSeconds?: number;
  topSources: Array<{ source: string; accesses: number }>;
  updatedAt?: string;
};

function TrafficCard() {
  const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refreshTraffic = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sessão administrativa expirada.');
      const response = await fetch('/api/nppr?action=traffic-metrics', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Acessos indisponíveis.');
      setMetrics(result);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Acessos indisponíveis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTraffic();
    const interval = window.setInterval(() => void refreshTraffic(), 15_000);
    return () => window.clearInterval(interval);
  }, [refreshTraffic]);

  const topSource = metrics?.topSources?.[0];
  const sourceShare = topSource && metrics?.todayAccesses
    ? Math.round((topSource.accesses / metrics.todayAccesses) * 100)
    : 0;

  return (
    <Card className={`${metricCardClass} sm:col-span-2 ${error ? 'border-rose-200' : ''}`}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-5">Acessos da loja</CardTitle>
            <CardDescription className="mt-1 text-xs leading-4">Presença em tempo real e total de hoje</CardDescription>
          </div>
          <button type="button" onClick={() => void refreshTraffic()} disabled={loading} aria-label="Atualizar acessos da loja" className={`${metricIconClass} cursor-pointer bg-cyan-50 text-cyan-700 transition-colors hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60`}>
            <Globe2 className={`size-5 ${loading ? 'animate-pulse' : ''}`} aria-hidden={true} />
          </button>
        </div>
        <div className="mt-4 flex-1" aria-live="polite">
        {error ? (
          <div className="flex items-start gap-2 text-xs leading-relaxed text-rose-700"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden={true} /><span>{error}</span></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <TrafficValue icon={UserRound} label="Pessoas online" value={metrics?.onlineHumans} tone="text-emerald-600" loading={loading && !metrics} />
              <TrafficValue icon={Bot} label="Bots ativos" value={metrics?.onlineBots} tone="text-amber-600" loading={loading && !metrics} />
              <TrafficValue icon={UserRound} label="Pessoas hoje" value={metrics?.todayHumans} tone="text-cyan-700" loading={loading && !metrics} />
              <TrafficValue icon={Bot} label="Bots hoje" value={metrics?.todayBots} tone="text-orange-700" loading={loading && !metrics} />
            </div>
            <p className="mt-3 truncate border-t border-black/[0.06] pt-3 text-[11px] leading-4 text-muted-foreground" title={topSource ? `${topSource.source}: ${sourceShare}%` : 'Sem origem registrada'}>
              Origem hoje: <strong className="font-semibold text-foreground">{topSource ? `${topSource.source} · ${sourceShare}%` : 'Aguardando dados'}</strong>
            </p>
          </>
        )}
        </div>
      </div>
    </Card>
  );
}

function TrafficValue({ icon: Icon, label, value, tone, loading }: { icon: LucideIcon; label: string; value?: number; tone: string; loading: boolean }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] leading-4 text-muted-foreground"><Icon className={`size-3.5 shrink-0 ${tone}`} aria-hidden={true} /><span className="truncate" title={label}>{label}</span></p>
      <p className="mt-1 text-xl font-semibold leading-none tabular-nums text-foreground">{loading ? '—' : Number(value || 0).toLocaleString('pt-BR')}</p>
    </div>
  );
}

type IntegrationBalance = { currency: string; total: number; fetchedAt: string };

function IntegrationBalanceCard() {
  const [balance, setBalance] = useState<IntegrationBalance | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sessão administrativa expirada.');
      const response = await fetch('/api/nppr', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const payload = await response.text();
      let result: any;
      try {
        result = JSON.parse(payload);
      } catch {
        throw new Error('Saldo disponível somente no ambiente publicado.');
      }
      if (!response.ok) throw new Error(result.error || 'Saldo indisponível.');
      setBalance(result.balance || null);
      setError(result.balanceError || (!result.balance ? 'Saldo indisponível.' : ''));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Saldo indisponível.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBalance();
    const interval = window.setInterval(() => void refreshBalance(), 30_000);
    return () => window.clearInterval(interval);
  }, [refreshBalance]);

  return (
    <Card className={`${metricCardClass} ${error ? 'border-rose-200' : balance?.total === 0 ? 'border-amber-200' : ''}`}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-5">Saldo da integração</CardTitle>
            <CardDescription className="mt-1 text-xs leading-4">Consulta privada em tempo real</CardDescription>
          </div>
          <button type="button" onClick={() => void refreshBalance()} disabled={loading} aria-label="Atualizar saldo da integração" className={`${metricIconClass} cursor-pointer bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60`}>
            <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} aria-hidden={true} />
          </button>
        </div>
        <div className="mt-auto pt-5" aria-live="polite">
        {error ? (
          <div className="flex items-start gap-2 text-xs leading-relaxed text-rose-700"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden={true} /><span>{error}</span></div>
        ) : (
          <>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{loading && !balance ? '—' : `${Number(balance?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${balance?.currency || 'USD'}`}</p>
            <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${balance?.total === 0 ? 'text-amber-700' : 'text-muted-foreground'}`}><WalletCards className="size-3.5" aria-hidden={true} />{balance?.fetchedAt ? `Atualizado às ${new Date(balance.fetchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Atualizando...'}</p>
          </>
        )}
        </div>
      </div>
    </Card>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  return (
    <Card className={metricCardClass}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-5">{stat.label}</CardTitle>
            <CardDescription className="mt-1 text-xs leading-4">{stat.hint}</CardDescription>
          </div>
          <span className={`${metricIconClass} ${stat.iconClassName}`}><Icon className="size-5" aria-hidden={true} /></span>
        </div>
        <p className="mt-auto pt-5 text-2xl font-semibold tracking-tight tabular-nums text-foreground">{stat.value}</p>
      </div>
    </Card>
  );
}
