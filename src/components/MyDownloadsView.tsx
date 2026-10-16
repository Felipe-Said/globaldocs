import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Building2, Calendar, CheckCircle, Clock, Copy,
  CreditCard, Download, Eye, EyeOff, FileCheck, FileText, Key, LoaderCircle,
  LockKeyhole, Mail, Menu, PackageCheck, PanelLeftClose, PanelLeftOpen, RefreshCw,
  Search, ShieldCheck, ShoppingBag, UserRound,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { MonkeyLoginAvatar } from './MonkeyLoginAvatar';
import { CustomerDashboardSidebar, type CustomerPanelView } from './ui/dashboard-sidebar';

type AccessStep = 'email' | 'code';
type AccessMode = 'login' | 'register';

export const MyDownloadsView: React.FC = () => {
  const {
    orders, downloadFile, customerUser, customerLogin, requestCustomerCode, verifyCustomerCode,
    refreshCustomerOrders, customerLogout, setIsCheckoutOpen,
  } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AccessMode>('login');
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
  const [activeView, setActiveView] = useState<CustomerPanelView>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const shouldReturnToCheckout = new URLSearchParams(location.search).get('return') === 'checkout';

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileSidebarOpen]);

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

  const finishAuthentication = () => {
    if (shouldReturnToCheckout) {
      navigate('/', { replace: true });
      window.setTimeout(() => setIsCheckoutOpen(true), 0);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setIsLoading(true);
    const result = await customerLogin(emailInput, codeInput);
    setIsLoading(false);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.message });
      return;
    }
    finishAuthentication();
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
    finishAuthentication();
  };

  const changeMode = (nextMode: AccessMode) => {
    setMode(nextMode);
    setStep('email');
    setCodeInput('');
    setShowCode(false);
    setFeedback(null);
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
  const downloadCount = paidOrders.reduce((total, order) => total + order.items.length, 0);
  const filteredOrders = myOrders.filter(order => {
    const query = filterQuery.toLowerCase().trim();
    return !query || order.id.toLowerCase().includes(query) || order.items.some(item => item.productTitle.toLowerCase().includes(query));
  });
  const filteredDownloads = paidOrders.flatMap(order => order.items.map((item, index) => ({ order, item, index }))).filter(({ order, item }) => {
    const query = filterQuery.toLowerCase().trim();
    return !query || order.id.toLowerCase().includes(query) || item.productTitle.toLowerCase().includes(query);
  });

  const selectView = (view: CustomerPanelView) => {
    setActiveView(view);
    setFilterQuery('');
    setMobileSidebarOpen(false);
  };

  if (!customerUser) {
    return (
      <section className="bg-surface-warm px-4 py-12 sm:py-20">
        <div className="mx-auto w-full max-w-[380px] animate-fadeIn rounded-2xl border border-borderSoft bg-surface p-6 shadow-notion-modal sm:p-8">
          <div className="mb-7 text-center">
            <MonkeyLoginAvatar covered={!showCode && (mode === 'login' || step === 'code')} active={fieldFocused} />
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Área do cliente</p>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {mode === 'login' ? 'Acessar minha conta' : step === 'email' ? 'Criar minha conta' : 'Digite a senha recebida'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {mode === 'login'
                ? 'Use o e-mail cadastrado e a senha/token que você recebeu.'
                : step === 'email'
                  ? 'Informe seu e-mail para receber sua senha de acesso.'
                  : <>Enviamos sua senha para <strong className="font-semibold text-ink">{emailInput}</strong>. Ela continuará válida nos próximos acessos.</>}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-xl bg-surface-warm p-1" role="tablist" aria-label="Tipo de acesso">
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => changeMode('login')} className={`min-h-10 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors ${mode === 'login' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}>Já tenho conta</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => changeMode('register')} className={`min-h-10 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors ${mode === 'register' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}>Criar conta</button>
          </div>

          {feedback && (
            <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed ${feedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              {feedback.type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="customer-login-email" className="mb-2 block text-xs font-semibold text-ink">Seu e-mail</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                  <input id="customer-login-email" type="email" autoComplete="email" inputMode="email" required value={emailInput} onFocus={() => setFieldFocused(true)} onBlur={() => setFieldFocused(false)} onChange={event => setEmailInput(event.target.value)} placeholder="voce@exemplo.com" className="min-h-12 w-full rounded-xl border border-borderSoft bg-surface-warm py-3 pl-10 pr-3 text-base text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" />
                </div>
              </div>
              <div>
                <label htmlFor="customer-password" className="mb-2 block text-xs font-semibold text-ink">Senha ou token de acesso</label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                  <input id="customer-password" type={showCode ? 'text' : 'password'} autoComplete="current-password" required value={codeInput} onFocus={() => setFieldFocused(true)} onBlur={() => setFieldFocused(false)} onChange={event => setCodeInput(event.target.value.replace(/\s/g, ''))} placeholder="Cole sua senha/token" className="min-h-12 w-full rounded-xl border border-borderSoft bg-surface-warm py-3 pl-10 pr-12 text-base tracking-[0.12em] text-ink outline-none transition-colors placeholder:tracking-normal placeholder:text-ink-faint focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" />
                  <button type="button" onClick={() => setShowCode(value => !value)} aria-label={showCode ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showCode} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-black/[0.05] hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    {showCode ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-pressed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Entrando...</> : <>Entrar na minha conta <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
              <button type="button" onClick={() => changeMode('register')} className="min-h-11 w-full cursor-pointer text-xs font-semibold text-primary hover:underline">Criar conta ou receber uma nova senha</button>
            </form>
          ) : step === 'email' ? (
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
                {isLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Enviando senha...</> : <>Enviar senha de acesso <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <div>
                <label htmlFor="customer-code" className="mb-2 block text-xs font-semibold text-ink">Senha recebida por e-mail</label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                  <input id="customer-code" type={showCode ? 'text' : 'password'} autoComplete="one-time-code" inputMode="numeric" required autoFocus value={codeInput} onFocus={() => setFieldFocused(true)} onBlur={() => setFieldFocused(false)} onChange={event => setCodeInput(event.target.value.replace(/\s/g, ''))} placeholder="Cole a senha do e-mail" className="min-h-12 w-full rounded-xl border border-borderSoft bg-surface-warm py-3 pl-10 pr-12 text-base tracking-[0.18em] text-ink outline-none transition-colors placeholder:tracking-normal placeholder:text-ink-faint focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" />
                  <button type="button" onClick={() => setShowCode(value => !value)} aria-label={showCode ? 'Ocultar código' : 'Mostrar código'} aria-pressed={showCode} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-black/[0.05] hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    {showCode ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-pressed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Criando conta...</> : <>Confirmar e criar conta <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
              <div className="flex flex-col items-center gap-1 text-xs">
                <button type="button" disabled={isLoading || resendIn > 0} onClick={() => void sendCode()} className="min-h-11 cursor-pointer px-3 font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-ink-faint disabled:no-underline">{resendIn > 0 ? `Reenviar senha em ${resendIn}s` : 'Reenviar senha'}</button>
                <button type="button" onClick={() => { setStep('email'); setCodeInput(''); setFeedback(null); }} className="flex min-h-11 cursor-pointer items-center gap-1 px-3 text-ink-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Usar outro e-mail</button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-borderSoft pt-5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted"><ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Sua senha/token permanece válida nos próximos acessos.</p>
            <Link to="/" className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline">Voltar ao catálogo</Link>
          </div>
        </div>
      </section>
    );
  }

  const viewCopy: Record<CustomerPanelView, { eyebrow: string; title: string; description: string }> = {
    overview: { eyebrow: 'Painel do cliente', title: `Olá, ${customerUser.name?.split(' ')[0] || 'cliente'}`, description: 'Acompanhe seus pedidos e acesse rapidamente tudo o que já foi liberado.' },
    orders: { eyebrow: 'Compras', title: 'Meus pedidos', description: 'Consulte pagamentos, valores e todos os itens vinculados à sua conta.' },
    downloads: { eyebrow: 'Minha biblioteca', title: 'Downloads e acessos', description: 'Baixe arquivos e consulte credenciais dos produtos que já foram liberados.' },
    profile: { eyebrow: 'Conta', title: 'Meu perfil', description: 'Confira os dados usados para identificar sua conta e vincular seus pedidos.' },
  };
  const currentView = viewCopy[activeView];

  return (
    <div className="bg-surface-warm px-0 py-0 sm:px-4 sm:py-6 lg:px-6">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu da conta">
          <button type="button" aria-label="Fechar menu" onClick={() => setMobileSidebarOpen(false)} className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-[2px]" />
          <div className="absolute inset-y-0 left-0 animate-fadeIn shadow-notion-modal">
            <CustomerDashboardSidebar activeView={activeView} customerName={customerUser.name} customerEmail={customerUser.email} orderCount={myOrders.length} downloadCount={downloadCount} mobile onSelect={selectView} onCatalog={() => navigate('/')} onLogout={() => void customerLogout()} onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-[720px] w-full max-w-[1440px] overflow-hidden border-borderSoft bg-surface shadow-notion-card sm:rounded-2xl sm:border">
        <div className="hidden shrink-0 lg:block">
          <CustomerDashboardSidebar activeView={activeView} customerName={customerUser.name} customerEmail={customerUser.email} orderCount={myOrders.length} downloadCount={downloadCount} collapsed={sidebarCollapsed} onSelect={selectView} onCatalog={() => navigate('/')} onLogout={() => void customerLogout()} />
        </div>

        <section className="min-w-0 flex-1 bg-surface-warm/60">
          <div className="sticky top-14 z-20 flex min-h-14 items-center justify-between border-b border-borderSoft bg-surface/95 px-3 backdrop-blur-md sm:top-16 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <button type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="Abrir menu da conta" aria-expanded={mobileSidebarOpen} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-warm hover:text-ink lg:hidden"><Menu className="h-5 w-5" aria-hidden="true" /></button>
              <button type="button" onClick={() => setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} aria-pressed={sidebarCollapsed} className="hidden h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-warm hover:text-ink lg:flex">{sidebarCollapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden="true" /> : <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />}</button>
              <div className="min-w-0 text-xs text-ink-muted"><span className="hidden sm:inline">Minha conta</span><span className="hidden px-2 sm:inline">/</span><strong className="truncate font-semibold text-ink">{currentView.title}</strong></div>
            </div>
            <button type="button" onClick={() => void refreshCustomerOrders()} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-borderSoft bg-white px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-warm"><RefreshCw className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Atualizar</span></button>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-7">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">{currentView.eyebrow}</p>
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{currentView.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{currentView.description}</p>
            </header>

            {activeView === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                <section aria-label="Resumo da conta" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Pedidos realizados', value: myOrders.length, icon: ShoppingBag, color: 'bg-primary-tint text-primary-pressed', target: 'orders' as CustomerPanelView },
                    { label: 'Itens liberados', value: downloadCount, icon: Download, color: 'bg-emerald-100 text-emerald-700', target: 'downloads' as CustomerPanelView },
                    { label: 'Aguardando pagamento', value: pendingOrders.length, icon: Clock, color: 'bg-amber-100 text-amber-800', target: 'orders' as CustomerPanelView },
                  ].map(card => (
                    <button key={card.label} type="button" onClick={() => selectView(card.target)} className="group min-h-[132px] cursor-pointer rounded-2xl border border-borderSoft bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-notion-hover">
                      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}><card.icon className="h-[18px] w-[18px]" aria-hidden="true" /></div>
                      <p className="text-2xl font-bold tabular-nums text-ink">{card.value}</p><p className="mt-0.5 text-xs text-ink-muted">{card.label}</p>
                    </button>
                  ))}
                </section>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
                  <section className="overflow-hidden rounded-2xl border border-borderSoft bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-borderSoft px-5 py-4"><div><h2 className="font-bold text-ink">Pedidos recentes</h2><p className="mt-0.5 text-xs text-ink-muted">Últimas movimentações da sua conta</p></div><button type="button" onClick={() => selectView('orders')} className="min-h-11 cursor-pointer px-2 text-xs font-semibold text-primary hover:underline">Ver todos</button></div>
                    {myOrders.length === 0 ? <div className="p-8 text-center text-sm text-ink-muted">Você ainda não realizou nenhum pedido.</div> : <div className="divide-y divide-borderSoft">{myOrders.slice(0, 4).map(order => <button key={order.id} type="button" onClick={() => selectView('orders')} className="flex min-h-[76px] w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-warm"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{order.status === 'paid' ? <CheckCircle className="h-[18px] w-[18px]" aria-hidden="true" /> : <Clock className="h-[18px] w-[18px]" aria-hidden="true" />}</div><div className="min-w-0 flex-1"><p className="truncate font-mono text-xs font-bold text-ink">{order.id}</p><p className="mt-1 truncate text-xs text-ink-muted">{order.items.map(item => item.productTitle).join(', ')}</p></div><div className="text-right"><p className="text-xs font-bold text-ink">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p><p className="mt-1 text-[10px] text-ink-muted">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p></div></button>)}</div>}
                  </section>

                  <aside className="rounded-2xl border border-borderSoft bg-ink p-5 text-white shadow-xs">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><PackageCheck className="h-5 w-5" aria-hidden="true" /></div>
                    <h2 className="text-lg font-bold">Tudo em um só lugar</h2><p className="mt-2 text-sm leading-relaxed text-white/65">Seus pedidos, arquivos e credenciais ficam vinculados automaticamente a este e-mail.</p>
                    <button type="button" onClick={() => navigate('/')} className="mt-6 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-ink transition-colors hover:bg-white/90"><ShoppingBag className="h-4 w-4" aria-hidden="true" /> Explorar catálogo</button>
                  </aside>
                </div>
              </div>
            )}

            {(activeView === 'orders' || activeView === 'downloads') && (
              <div className="animate-fadeIn">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full max-w-md"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" /><label htmlFor="account-search" className="sr-only">Buscar na conta</label><input id="account-search" type="search" value={filterQuery} onChange={event => setFilterQuery(event.target.value)} placeholder={activeView === 'orders' ? 'Buscar pedido ou produto' : 'Buscar arquivo ou produto'} className="min-h-11 w-full rounded-xl border border-borderSoft bg-white py-2 pl-10 pr-3 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></div>
                  <button type="button" onClick={() => navigate('/')} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-pressed"><ShoppingBag className="h-4 w-4" aria-hidden="true" /> Continuar comprando</button>
                </div>

                {activeView === 'orders' && (filteredOrders.length === 0 ? (
                  <section className="rounded-2xl border border-borderSoft bg-white p-10 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-warm text-ink-muted"><FileText className="h-6 w-6" aria-hidden="true" /></div><h2 className="font-semibold text-ink">Nenhum pedido encontrado</h2><p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-muted">{filterQuery ? 'Tente buscar por outro termo.' : 'Quando você concluir uma compra, o pedido aparecerá aqui automaticamente.'}</p></section>
                ) : <div className="space-y-4">{filteredOrders.map(order => { const isPaid = order.status === 'paid'; return <article key={order.id} className="overflow-hidden rounded-2xl border border-borderSoft bg-white shadow-xs"><header className="flex flex-col gap-3 border-b border-borderSoft bg-surface-warm p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-mono font-bold text-ink">{order.id}</span><span className="text-ink-faint">•</span><span className="flex items-center gap-1 text-ink-muted"><Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</span></div><div className="flex flex-wrap items-center gap-3 text-xs"><span className="text-ink-muted">Total: <strong className="text-ink">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{isPaid ? <CheckCircle className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />}{isPaid ? 'Pago e liberado' : 'Aguardando pagamento'}</span></div></header><div className="divide-y divide-borderSoft">{order.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-borderSoft bg-surface-warm text-primary"><FileText className="h-4 w-4" aria-hidden="true" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-ink">{item.productTitle}</h3>{getItemTypeBadge(item.productType)}</div><p className="mt-1 text-xs text-ink-muted">{item.format}</p></div></div>{isPaid ? <button type="button" onClick={() => selectView('downloads')} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-borderSoft px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-warm"><Download className="h-4 w-4" aria-hidden="true" /> Abrir biblioteca</button> : <span className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-800"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> Liberação após pagamento</span>}</div>)}</div></article>; })}</div>)}

                {activeView === 'downloads' && (filteredDownloads.length === 0 ? (
                  <section className="rounded-2xl border border-borderSoft bg-white p-10 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-warm text-ink-muted"><Download className="h-6 w-6" aria-hidden="true" /></div><h2 className="font-semibold text-ink">Nenhum item liberado</h2><p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-muted">{filterQuery ? 'Nenhum download corresponde à sua busca.' : 'Seus arquivos aparecerão aqui após a confirmação do pagamento.'}</p></section>
                ) : <div className="grid gap-4 xl:grid-cols-2">{filteredDownloads.map(({ order, item, index }) => <article key={`${order.id}-${item.productId}-${index}`} className="flex flex-col rounded-2xl border border-borderSoft bg-white p-5 shadow-xs"><div className="mb-4 flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary"><FileText className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-ink">{item.productTitle}</h2>{getItemTypeBadge(item.productType)}</div><p className="mt-1 truncate font-mono text-[10px] text-ink-muted">Pedido {order.id}</p></div></div>{(item.zipFileName || item.downloadFileName) && <p className="mb-4 break-all rounded-lg bg-surface-warm p-2.5 font-mono text-[11px] text-ink-muted">{item.zipFileName || item.downloadFileName}</p>}{(item.accessLogins || item.proxyDetails) && <div className="mb-4 space-y-2 border-t border-borderSoft pt-4"><p className="flex items-center gap-1.5 text-[11px] font-bold text-ink"><Key className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Credenciais liberadas</p>{[['Acesso', item.accessLogins], ['Proxy', item.proxyDetails]].filter(([, value]) => value).map(([label, value]) => { const copyId = `${label}-${order.id}-${index}`; return <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-borderSoft bg-surface-warm p-2.5 font-mono text-xs"><p className="min-w-0 break-all text-ink"><span className="text-ink-muted">{label}: </span>{value}</p><button type="button" onClick={() => void handleCopy(value || '', copyId)} aria-label={`Copiar ${label.toLowerCase()}`} className="flex min-h-10 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-borderSoft bg-white px-2.5 text-[10px] font-semibold text-ink hover:bg-surface-warm">{copiedKey === copyId ? <CheckCircle className="h-3 w-3 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}{copiedKey === copyId ? 'Copiado' : 'Copiar'}</button></div>; })}</div>}<button type="button" onClick={() => downloadFile(item.productTitle, item.zipFileName || item.downloadFileName, item.format)} className="mt-auto flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-pressed"><Download className="h-4 w-4" aria-hidden="true" /> Baixar arquivo</button></article>)}</div>)}
              </div>
            )}

            {activeView === 'profile' && (
              <div className="grid gap-5 animate-fadeIn xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="overflow-hidden rounded-2xl border border-borderSoft bg-white shadow-xs"><div className="border-b border-borderSoft px-5 py-4"><h2 className="font-bold text-ink">Dados da conta</h2><p className="mt-1 text-xs text-ink-muted">Informações vinculadas aos seus pedidos.</p></div><dl className="divide-y divide-borderSoft"><div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr]"><dt className="text-xs font-semibold text-ink-muted">Nome</dt><dd className="text-sm font-medium text-ink">{customerUser.name || 'Não informado'}</dd></div><div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr]"><dt className="text-xs font-semibold text-ink-muted">E-mail</dt><dd className="break-all text-sm font-medium text-ink">{customerUser.email}</dd></div><div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr]"><dt className="text-xs font-semibold text-ink-muted">Documento</dt><dd className="text-sm font-medium text-ink">{customerUser.document || 'Não informado'}</dd></div><div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr]"><dt className="text-xs font-semibold text-ink-muted">Status</dt><dd><span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800"><CheckCircle className="h-3 w-3" aria-hidden="true" /> Conta verificada</span></dd></div></dl></section>
                <aside className="rounded-2xl border border-borderSoft bg-white p-5 shadow-xs"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></div><h2 className="font-bold text-ink">Acesso protegido</h2><p className="mt-2 text-xs leading-relaxed text-ink-muted">Sua senha/token é pessoal. Não compartilhe com terceiros. Para receber uma nova, encerre a sessão e use a opção de recuperação na tela de entrada.</p><button type="button" onClick={() => void customerLogout()} className="mt-5 flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-rose-200 px-4 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50">Sair da conta</button></aside>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
