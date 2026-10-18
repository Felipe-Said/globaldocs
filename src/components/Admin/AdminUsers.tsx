import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, BadgeDollarSign, ChevronLeft, ChevronRight, PackageCheck,
  RefreshCw, Search, UserRound, Users, WalletCards,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AdminCustomer {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  walletBalance: number;
  totalSpent: number;
  itemsPurchased: number;
  paidOrders: number;
  lastPurchaseAt: string | null;
}

interface CustomerSummary {
  users: number;
  walletBalance: number;
  totalSpent: number;
  itemsPurchased: number;
}

const EMPTY_SUMMARY: CustomerSummary = { users: 0, walletBalance: 0, totalSpent: 0, itemsPurchased: 0 };
const ITEMS_PER_PAGE = 20;

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const initials = (user: AdminCustomer) => {
  const source = user.name || user.email;
  return source.split(/\s+|@/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
};

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminCustomer[]>([]);
  const [summary, setSummary] = useState<CustomerSummary>(EMPTY_SUMMARY);
  const [updatedAt, setUpdatedAt] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sessão administrativa expirada. Entre novamente.');
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar os usuários.');
      setUsers(payload.users || []);
      setSummary(payload.summary || EMPTY_SUMMARY);
      setUpdatedAt(payload.updatedAt || new Date().toISOString());
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os usuários.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return users;
    return users.filter(user => `${user.name} ${user.email}`.toLocaleLowerCase('pt-BR').includes(query));
  }, [search, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => setPage(1), [search]);

  const metricCards = [
    { label: 'Usuários cadastrados', value: summary.users.toLocaleString('pt-BR'), detail: 'Contas de clientes', icon: Users, tone: 'bg-blue-50 text-primary' },
    { label: 'Saldo em carteiras', value: formatCurrency(summary.walletBalance), detail: 'Disponível para compras', icon: WalletCards, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total gasto', value: formatCurrency(summary.totalSpent), detail: 'Somente pedidos pagos', icon: BadgeDollarSign, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Itens adquiridos', value: summary.itemsPurchased.toLocaleString('pt-BR'), detail: 'Produtos e serviços', icon: PackageCheck, tone: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 animate-fadeIn">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Usuários</h2>
          <p className="mt-1 text-sm text-muted-foreground">Clientes cadastrados, saldos e histórico consolidado de compras.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadUsers()} disabled={loading} className="min-h-11 cursor-pointer rounded-lg bg-white shadow-xs">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Atualizar dados
        </Button>
      </div>

      <section aria-label="Resumo dos usuários" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, detail, icon: Icon, tone }) => (
          <Card key={label} className="rounded-xl border-black/10 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">{loading ? '—' : value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
              </div>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="min-w-0 overflow-hidden rounded-xl border-black/10 bg-white shadow-xs">
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Clientes cadastrados</CardTitle>
            <CardDescription className="mt-1">Valores de compra consideram exclusivamente pedidos confirmados.</CardDescription>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Buscar usuário por nome ou e-mail</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar nome ou e-mail"
              className="h-11 rounded-lg pl-9"
            />
          </label>
        </CardHeader>

        <CardContent className="p-0" aria-live="polite">
          {error ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><AlertCircle className="size-5" aria-hidden="true" /></span>
              <p className="text-sm font-semibold text-foreground">Não foi possível carregar os usuários</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">{error}</p>
              <Button type="button" variant="outline" onClick={() => void loadUsers()} className="mt-4 min-h-11 cursor-pointer">Tentar novamente</Button>
            </div>
          ) : loading ? (
            <div className="space-y-3 p-6" role="status" aria-label="Carregando usuários">
              {[0, 1, 2, 3, 4].map(item => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground"><UserRound className="size-5" aria-hidden="true" /></span>
              <p className="text-sm font-semibold text-foreground">{search ? 'Nenhum usuário encontrado' : 'Nenhum cliente cadastrado'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{search ? 'Tente buscar por outro nome ou e-mail.' : 'As novas contas aparecerão aqui automaticamente.'}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Cliente</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Saldo em carteira</TableHead>
                      <TableHead className="text-right">Total gasto</TableHead>
                      <TableHead className="pr-6 text-right">Itens adquiridos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 ring-1 ring-black/10"><AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(user)}</AvatarFallback></Avatar>
                            <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{user.name || 'Nome não informado'}</p><p className="truncate text-[11px] text-muted-foreground">{user.email}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right text-xs font-medium tabular-nums">{formatCurrency(user.walletBalance)}</TableCell>
                        <TableCell className="text-right"><p className="text-xs font-semibold tabular-nums">{formatCurrency(user.totalSpent)}</p><p className="text-[10px] text-muted-foreground">{user.paidOrders} pedido{user.paidOrders === 1 ? '' : 's'} pago{user.paidOrders === 1 ? '' : 's'}</p></TableCell>
                        <TableCell className="pr-6 text-right text-xs font-semibold tabular-nums">{user.itemsPurchased.toLocaleString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y md:hidden">
                {visibleUsers.map(user => (
                  <article key={user.id} className="p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-10 ring-1 ring-black/10"><AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(user)}</AvatarFallback></Avatar>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{user.name || 'Nome não informado'}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3 text-xs">
                      <div><dt className="text-muted-foreground">Saldo</dt><dd className="mt-1 font-semibold tabular-nums">{formatCurrency(user.walletBalance)}</dd></div>
                      <div><dt className="text-muted-foreground">Total gasto</dt><dd className="mt-1 font-semibold tabular-nums">{formatCurrency(user.totalSpent)}</dd></div>
                      <div><dt className="text-muted-foreground">Itens adquiridos</dt><dd className="mt-1 font-semibold tabular-nums">{user.itemsPurchased.toLocaleString('pt-BR')}</dd></div>
                      <div><dt className="text-muted-foreground">Cadastro</dt><dd className="mt-1 font-semibold">{formatDate(user.createdAt)}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </CardContent>

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">
              {filteredUsers.length.toLocaleString('pt-BR')} usuário{filteredUsers.length === 1 ? '' : 's'}{updatedAt ? ` • atualizado às ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage(value => Math.max(1, value - 1))} className="size-11 cursor-pointer"><ChevronLeft className="size-4" aria-hidden="true" /></Button>
              <span className="min-w-20 text-center text-xs font-medium">{currentPage} de {totalPages}</span>
              <Button type="button" variant="outline" size="icon" aria-label="Próxima página" disabled={currentPage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))} className="size-11 cursor-pointer"><ChevronRight className="size-4" aria-hidden="true" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
