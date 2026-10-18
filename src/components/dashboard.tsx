import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, ShoppingBag } from 'lucide-react';
import { DashboardInvoices } from '@/components/dashboard-invoices';
import { DashboardStats } from '@/components/stats';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useStore } from '@/context/StoreContext';

const chartConfig = {
  revenue: { label: 'Faturamento', color: '#0075DE' },
  orders: { label: 'Pedidos', color: '#16A36A' },
} satisfies ChartConfig;

const dayKey = (value: Date) => `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;

export function Dashboard({ onNavigateOrders }: { onNavigateOrders?: () => void }) {
  const { orders, settings } = useStore();
  const paidOrders = orders.filter(order => order.status === 'paid');
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const pendingDeliveries = paidOrders.filter(order => order.items.some(item => item.requiresFulfillment) && order.fulfillmentStatus !== 'completed').length;
  const completedDeliveries = paidOrders.filter(order => !order.items.some(item => item.requiresFulfillment) || order.fulfillmentStatus === 'completed').length;
  const today = new Date();

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));
    const dailyOrders = orders.filter(order => dayKey(new Date(order.createdAt)) === dayKey(date));
    return {
      day: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      revenue: dailyOrders.filter(order => order.status === 'paid').reduce((sum, order) => sum + order.total, 0),
      orders: dailyOrders.length,
    };
  });
  const hasRevenueInPeriod = chartData.some(entry => entry.revenue > 0);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/20 bg-primary/5 text-primary">Resumo operacional</Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Olá, administrador</h2>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe o desempenho e as pendências da {settings.storeName} em um só lugar.</p>
        </div>
        <Button type="button" variant="outline" onClick={onNavigateOrders} className="min-h-11 cursor-pointer rounded-lg bg-white shadow-xs">
          <ShoppingBag className="size-4" aria-hidden={true} />
          Gerenciar pedidos
          <ArrowRight className="size-4" aria-hidden={true} />
        </Button>
      </div>

      <section aria-label="Indicadores principais" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStats />
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
        <Card className="min-w-0 rounded-xl border-black/10 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Desempenho dos últimos 7 dias</CardTitle>
            <CardDescription>Pedidos registrados e faturamento confirmado no período.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 10, bottom: 0 }} accessibilityLayer>
                <defs>
                  <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="adminOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-orders)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--color-orders)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
                {hasRevenueInPeriod ? (
                  <>
                    <YAxis yAxisId="revenue" tickLine={false} axisLine={false} width={45} tickFormatter={value => `R$${Number(value).toLocaleString('pt-BR', { notation: 'compact' })}`} />
                    <YAxis yAxisId="orders" orientation="right" hide domain={[0, 'auto']} />
                  </>
                ) : (
                  <YAxis yAxisId="activity" tickLine={false} axisLine={false} width={24} allowDecimals={false} domain={[0, 'auto']} />
                )}
                <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => (
                  <div className="flex min-w-36 items-center justify-between gap-4">
                    <span className="text-muted-foreground">{name === 'revenue' ? 'Faturamento' : 'Pedidos'}</span>
                    <span className="font-mono font-medium tabular-nums">{name === 'revenue' ? Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : Number(value)}</span>
                  </div>
                )} />} />
                {hasRevenueInPeriod ? (
                  <>
                    <Area yAxisId="revenue" dataKey="revenue" type="monotone" stroke="var(--color-revenue)" fill="url(#adminRevenue)" strokeWidth={2.5} />
                    <Area yAxisId="orders" dataKey="orders" type="monotone" stroke="var(--color-orders)" fill="none" strokeDasharray="5 5" strokeWidth={2} />
                  </>
                ) : (
                  <Area yAxisId="activity" dataKey="orders" type="monotone" stroke="var(--color-orders)" fill="url(#adminOrders)" strokeWidth={2.5} />
                )}
              </AreaChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t pt-4 text-xs text-muted-foreground">
              {hasRevenueInPeriod && <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary" /> Faturamento</span>}
              <span className="flex items-center gap-2"><span className={`h-0.5 w-4 border-t-2 border-emerald-600 ${hasRevenueInPeriod ? 'border-dashed' : ''}`} /> Pedidos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-black/10 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Status da operação</CardTitle>
            <CardDescription>Pontos que merecem atenção agora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button type="button" onClick={onNavigateOrders} className="flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-xl border bg-amber-50/60 p-3 text-left transition-colors hover:bg-amber-50">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800"><Clock3 className="size-5" aria-hidden={true} /></span>
              <span className="min-w-0 flex-1"><span className="block text-xl font-semibold tabular-nums text-foreground">{pendingOrders}</span><span className="block text-xs text-muted-foreground">Aguardando pagamento</span></span>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden={true} />
            </button>
            <button type="button" onClick={onNavigateOrders} className={`flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors ${pendingDeliveries ? 'border-rose-200 bg-rose-50/60 hover:bg-rose-50' : 'bg-emerald-50/60 hover:bg-emerald-50'}`}>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${pendingDeliveries ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {pendingDeliveries ? <AlertTriangle className="size-5" aria-hidden={true} /> : <CheckCircle2 className="size-5" aria-hidden={true} />}
              </span>
              <span className="min-w-0 flex-1"><span className="block text-xl font-semibold tabular-nums text-foreground">{pendingDeliveries}</span><span className="block text-xs text-muted-foreground">Entregas pendentes</span></span>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden={true} />
            </button>
            <div className="flex min-h-[72px] items-center gap-3 rounded-xl border bg-white p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary"><CheckCircle2 className="size-5" aria-hidden={true} /></span>
              <span><span className="block text-xl font-semibold tabular-nums text-foreground">{completedDeliveries}</span><span className="block text-xs text-muted-foreground">Pedidos pagos concluídos</span></span>
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardInvoices onNavigateOrders={onNavigateOrders} />
    </div>
  );
}
