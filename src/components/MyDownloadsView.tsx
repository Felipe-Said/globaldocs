import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Building2, Calendar, CheckCircle, Clock, Copy,
  CreditCard, Download, Eye, EyeOff, FileCheck, FileText, Key, LoaderCircle,
  LockKeyhole, LogOut, Mail, PackageCheck, RefreshCw, Search, ShieldCheck,
  ShoppingBag, UserRound,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { MonkeyLoginAvatar } from './MonkeyLoginAvatar';

type AccessStep = 'email' | 'code';

export const MyDownloadsView: React.FC = () => {
  const {
    orders, downloadFile, customerUser, requestCustomerCode, verifyCustomerCode,
    refreshCustomerOrders, customerLogout, setIsCheckoutOpen,
  } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState<AccessStep>('email');
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const shouldReturnToCheckout = new URLSearchParams(location.search).get('return') === 'checkout';

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const sendCode = async () => {
    setFeedback(null);
    setIsLoading(true);
    const result = await requestCustomerCode(emailInput);
    setIsLoading(false);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.message });
      return;
    }
    setStep('code');
    setResendIn(60);
    setFeedback({ type: 'success', message: result.message });
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendCode();
  };

  const handleCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setIsLoading(true);
    const result = await verifyCustomerCode(emailInput, codeInput);
    setIsLoading(false);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.message });
      return;
    }
    if (shouldReturnToCheckout) {
      navigate('/', { replace: true });
      window.setTimeout(() => setIsCheckoutOpen(true), 0);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(id);
    window.setTimeout(() => setCopiedKey(null), 2000);
  };

  const getItemTypeBadge = (type: string) => {
    if (type === 'llc') return <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800"><Building2 className="h-3 w-3" aria-hidden="true" /> LLC</span>;
    if (type === 'contas') return <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800"><CreditCard className="h-3 w-3" aria-hidden="true" /> Contas</span>;
    return <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800"><FileCheck className="h-3 w-3" aria-hidden="true" /> Digital</span>;
  };

  const myOrders = useMemo(() => customerUser
    ? orders.filter(order => order.customerEmail.toLowerCase().trim() === customerUser.email.toLowerCase().trim())
    : [], [customerUser, orders]);
  const paidOrders = myOrders.filter(order => order.status === 'paid');
  const pendingOrders = myOrders.filter(order => order.status === 'pending');
  const filteredOrders = myOrders.filter(order => {
    const query = filterQuery.toLowerCase().trim();
    return !query || order.id.toLowerCase().includes(query) || order.items.some(item => item.productTitle.toLowerCase().includes(query));
  });

  if (!customerUser) {
    return (
      <section className="bg-surface-warm px-4 py-12 sm:py-20">
        <div className="mx-auto w-full max-w-[380px] animate-fadeIn rounded-2xl border border-borderSoft bg-surface p-6 shadow-notion-modal sm:p-8">
          <div className="mb-7 text-center">
            <MonkeyLoginAvatar covered={step === 'code' && !showCode} active={fieldFocused} />
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Área do cliente</p>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{step === 'email' ? 'Criar ou acessar conta' : 'Digite o código recebido'}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {step === 'email'
                ? 'Informe seu e-mail. Enviaremos um código único para entrar com segurança.'
                : <>Enviamos um código temporário para <strong className="font-semibold text-ink">{emailInput}</strong>.</>}
            </p>
          </div>

          {feedback && (
            <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed ${feedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              {feedback.type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label htmlFor="customer-email" className="mb-2 block text-xs font-semibold text-ink">Seu e-mail</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                  <input id="customer-email" type="email" autoComplete="email" inputMode="email" required value={emailInput} onFocus={() => setFieldFocused(true)} onBlur={() => setFieldFocused(false)} onChange={event => setEmailInput(event.target.value)} placeholder="voce@exemplo.com" className="min-h-12 w-full rounded-xl border border-borderSoft bg-surface-warm py-3 pl-10 pr-3 text-base text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" />
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">Esse e-mail será usado para seus pedidos, arquivos e acessos.</p>
              </div>
              <button type="submit" disabled={isLoading} className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-pressed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Enviando código...</> : <>Enviar código de acesso <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <div>
                <label htmlFor="customer-code" className="mb-2 block text-xs font-semibold text-ink">Código de acesso</label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                  <input id="customer-code" type={showCode ? 'text' : 'password'} autoComplete="one-time-code" inputMode="numeric" required autoFocus value={codeInput} onFocus={() => setFieldFocused(true)} onBlur={() => setFieldFocused(false)} onChange={event => setCodeInput(event.target.value.replace(/\s/g, ''))} placeholder="Cole o código do e-mail" className="min-h-12 w-full rounded-xl border border-borderSoft bg-surface-warm py-3 pl-10 pr-12 text-base tracking-[0.18em] text-ink outline-none transition-colors placeholder:tracking-normal placeholder:text-ink-faint focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" />
                  <button type="button" onClick={() => setShowCode(value => !value)} aria-label={showCode ? 'Ocultar código' : 'Mostrar código'} aria-pressed={showCode} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-black/[0.05] hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    {showCode ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-pressed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Validando...</> : <>Entrar na minha conta <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
              <div className="flex flex-col items-center gap-1 text-xs">
                <button type="button" disabled={isLoading || resendIn > 0} onClick={() => void sendCode()} className="min-h-11 cursor-pointer px-3 font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-ink-faint disabled:no-underline">{resendIn > 0 ? `Reenviar código em ${resendIn}s` : 'Reenviar código'}</button>
                <button type="button" onClick={() => { setStep('email'); setCodeInput(''); setFeedback(null); }} className="flex min-h-11 cursor-pointer items-center gap-1 px-3 text-ink-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Usar outro e-mail</button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-borderSoft pt-5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted"><ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Código temporário. Nenhuma senha para memorizar.</p>
            <Link to="/" className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline">Voltar ao catálogo</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-7xl animate-fadeIn px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-2xl border border-borderSoft bg-surface shadow-xs">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint font-bold text-primary">{customerUser.name ? customerUser.name.charAt(0).toUpperCase() : <UserRound className="h-5 w-5" aria-hidden="true" />}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h1 className="text-lg font-bold text-ink">{customerUser.name || 'Minha conta'}</h1><span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"><CheckCircle className="h-3 w-3" aria-hidden="true" /> Verificada</span></div>
              <p className="truncate text-xs text-ink-muted">{customerUser.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void refreshCustomerOrders()} className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-borderSoft px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-warm focus:outline-none focus:ring-2 focus:ring-primary"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Atualizar</button>
            <button type="button" onClick={() => void customerLogout()} className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500"><LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sair</button>
          </div>
        </div>
      </section>

      <header className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><PackageCheck className="h-4 w-4" aria-hidden="true" /> Painel do cliente</p>
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Pedidos e downloads</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">Acompanhe pagamentos e acesse arquivos e credenciais já liberados.</p>
      </header>

      <section aria-label="Resumo dos pedidos" className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-borderSoft bg-surface p-4"><p className="text-xs text-ink-muted">Pedidos</p><p className="mt-1 text-2xl font-bold tabular-nums text-ink">{myOrders.length}</p></div>
        <div className="rounded-xl border border-borderSoft bg-surface p-4"><p className="text-xs text-ink-muted">Liberados</p><p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{paidOrders.length}</p></div>
        <div className="col-span-2 rounded-xl border border-borderSoft bg-surface p-4 sm:col-span-1"><p className="text-xs text-ink-muted">Aguardando pagamento</p><p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">{pendingOrders.length}</p></div>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" /><label htmlFor="order-search" className="sr-only">Buscar pedido</label><input id="order-search" type="search" value={filterQuery} onChange={event => setFilterQuery(event.target.value)} placeholder="Buscar item ou número do pedido" className="min-h-11 w-full rounded-xl border border-borderSoft bg-surface-warm py-2 pl-10 pr-3 text-sm text-ink outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" /></div>
        <Link to="/" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-pressed"><ShoppingBag className="h-4 w-4" aria-hidden="true" /> Continuar comprando</Link>
      </div>

      {filteredOrders.length === 0 ? (
        <section className="rounded-2xl border border-borderSoft bg-surface p-10 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-warm text-ink-muted"><FileText className="h-6 w-6" aria-hidden="true" /></div><h3 className="font-semibold text-ink">Nenhum pedido encontrado</h3><p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-muted">{filterQuery ? 'Tente buscar por outro termo.' : 'Quando você concluir uma compra, o pedido aparecerá aqui automaticamente.'}</p></section>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map(order => {
            const isPaid = order.status === 'paid';
            return (
              <article key={order.id} className="overflow-hidden rounded-2xl border border-borderSoft bg-surface shadow-xs">
                <header className="flex flex-col gap-3 border-b border-borderSoft bg-surface-warm p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-mono font-bold text-ink">{order.id}</span><span className="text-ink-faint">•</span><span className="flex items-center gap-1 text-ink-muted"><Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</span></div>
                  <div className="flex flex-wrap items-center gap-3 text-xs"><span className="text-ink-muted">Total: <strong className="text-ink">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{isPaid ? <CheckCircle className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />}{isPaid ? 'Pago e liberado' : 'Aguardando pagamento'}</span></div>
                </header>
                <div className="divide-y divide-borderSoft">
                  {order.items.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="space-y-4 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-borderSoft bg-surface-warm text-primary"><FileText className="h-4 w-4" aria-hidden="true" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-ink">{item.productTitle}</h4>{getItemTypeBadge(item.productType)}</div>{isPaid && (item.zipFileName || item.downloadFileName) && <p className="mt-1 break-all font-mono text-[11px] text-ink-muted">{item.zipFileName || item.downloadFileName}</p>}</div></div>
                        {isPaid ? <button type="button" onClick={() => downloadFile(item.productTitle, item.zipFileName || item.downloadFileName, item.format)} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-pressed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"><Download className="h-4 w-4" aria-hidden="true" /> Baixar arquivo</button> : <span className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-800"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> Liberação após pagamento</span>}
                      </div>
                      {isPaid && (item.accessLogins || item.proxyDetails) && (
                        <div className="space-y-2 rounded-xl border border-borderSoft bg-surface-warm p-3.5">
                          <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink"><Key className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Credenciais liberadas</p>
                          {[['Acesso', item.accessLogins], ['Proxy', item.proxyDetails]].filter(([, value]) => value).map(([label, value]) => {
                            const copyId = `${label}-${order.id}-${index}`;
                            return <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-borderSoft bg-white p-2.5 font-mono text-xs"><p className="min-w-0 break-all text-ink"><span className="text-ink-muted">{label}: </span>{value}</p><button type="button" onClick={() => void handleCopy(value || '', copyId)} aria-label={`Copiar ${label.toLowerCase()}`} className="flex min-h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-borderSoft px-2 text-[10px] font-semibold text-ink hover:bg-surface-warm">{copiedKey === copyId ? <CheckCircle className="h-3 w-3 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}{copiedKey === copyId ? 'Copiado' : 'Copiar'}</button></div>;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};
