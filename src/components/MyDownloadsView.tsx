import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  DownloadCloud, 
  FileText, 
  Download, 
  Key, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Search, 
  ShieldCheck, 
  Package, 
  Building2, 
  CreditCard, 
  FileCheck, 
  Truck,
  User,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyDownloadsView: React.FC = () => {
  const { 
    orders, 
    downloadFile, 
    customerUser, 
    customerLogin, 
    customerLogout 
  } = useStore();

  // Estados de Login
  const [emailInput, setEmailInput] = useState('');
  const [orderCodeInput, setOrderCodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Pesquisa interna
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    setTimeout(() => {
      const result = customerLogin(emailInput, orderCodeInput);
      setIsLoading(false);
      if (!result.success) {
        setLoginError(result.message);
      }
    }, 400);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case 'llc':
        return <span className="whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Building2 className="w-3 h-3 shrink-0" /> LLC</span>;
      case 'contas':
        return <span className="whitespace-nowrap shrink-0 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><CreditCard className="w-3 h-3 shrink-0" /> Contas</span>;
      default:
        return <span className="whitespace-nowrap shrink-0 bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><FileCheck className="w-3 h-3 shrink-0" /> Digital</span>;
    }
  };

  // =========================================================================
  // CASO 1: CLIENTE NÃO AUTENTICADO -> TELA DE LOGIN / SOLICITAÇÃO DE ACESSO
  // =========================================================================
  if (!customerUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 animate-fadeIn">
        <div className="bg-surface rounded-xl border border-borderSoft shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Header do Card */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary-tint text-primary mx-auto flex items-center justify-center shadow-xs">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Acessar Meus Downloads
            </h1>
            <p className="text-xs text-ink-muted leading-relaxed">
              Para sua privacidade e segurança, informe o e-mail cadastrado na finalização da compra para visualizar seus arquivos e credenciais.
            </p>
          </div>

          {/* Mensagem de Erro se houver */}
          {loginError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Formulário de Identificação */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                E-mail da Compra <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-warm border border-borderSoft rounded-lg text-ink focus:bg-white focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink">
                  Número do Pedido ou Senha
                </label>
                <span className="text-[10px] text-ink-muted">Opcional</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={orderCodeInput}
                  onChange={(e) => setOrderCodeInput(e.target.value)}
                  placeholder="Ex: ORD-8921"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-warm border border-borderSoft rounded-lg text-ink focus:bg-white focus:border-primary transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-lg bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verificando pedidos...</span>
              ) : (
                <>
                  <span>Entrar e Ver Downloads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Dica de Segurança e Link para Loja */}
          <div className="pt-4 border-t border-borderSoft space-y-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Downloads liberados exclusivamente após pagamento confirmado</span>
            </div>
            
            <p className="text-xs text-ink-muted">
              Ainda não realizou uma compra?{' '}
              <Link to="/" className="text-primary font-semibold hover:underline">
                Explorar Catálogo
              </Link>
            </p>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // CASO 2: CLIENTE AUTENTICADO -> MOSTRA EXCLUSIVAMENTE OS DOWNLOADS DELE
  // =========================================================================
  const myOrders = orders.filter(
    o => o.customerEmail.toLowerCase().trim() === customerUser.email.toLowerCase().trim()
  );

  const myPaidOrders = myOrders.filter(o => o.status === 'paid');

  const filteredOrders = myOrders.filter(order => 
    order.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
    order.items.some(item => item.productTitle.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      
      {/* Barra de Perfil Autenticado */}
      <div className="mb-8 p-4 rounded-xl bg-surface border border-borderSoft flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-tint text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {customerUser.name ? customerUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-ink">
                {customerUser.name || 'Cliente Conectado'}
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.2 rounded-full flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" /> Acesso Verificado
              </span>
            </div>
            <p className="text-[11px] text-ink-muted font-mono">
              {customerUser.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={customerLogout}
            className="h-8 px-3 rounded-lg border border-borderSoft bg-surface-warm hover:bg-black/[0.05] text-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Sair da Conta</span>
          </button>
          
          <Link
            to="/"
            className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
          >
            <span>Catálogo</span>
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div className="pb-6 border-b border-borderSoft mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          <DownloadCloud className="w-4 h-4" />
          <span>Biblioteca Pessoal de Documentos</span>
        </div>
        <h1 className="text-3xl font-bold text-ink tracking-tight">
          Meus Downloads & Pedidos
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Acesse seus arquivos digitais, pacotes de LLC, credenciais e acompanhamento das suas compras.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Filtrar por item ou ID do pedido..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-warm border border-borderSoft rounded-lg text-ink focus:bg-white focus:border-primary transition-all"
          />
        </div>

        <div className="text-xs text-ink-muted">
          Total de <strong>{myPaidOrders.length}</strong> compras pagas e liberadas
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-surface rounded-xl border border-borderSoft p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-warm mx-auto flex items-center justify-center text-ink-muted">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-base text-ink">Nenhum pedido encontrado</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            {filterQuery 
              ? 'Nenhum resultado corresponde à sua pesquisa.' 
              : `Não identificamos compras aprovadas vinculadas a ${customerUser.email}. Conclua uma compra no carrinho para liberar seus arquivos instantaneamente.`}
          </p>
          <Link
            to="/"
            className="inline-block mt-2 h-9 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors leading-9 shadow-sm"
          >
            Explorar Loja
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isPaid = order.status === 'paid';

            return (
              <div 
                key={order.id} 
                className="bg-surface rounded-xl border border-borderSoft shadow-xs overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-surface-warm border-b border-borderSoft flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-ink">{order.id}</span>
                    <span className="text-ink-muted">•</span>
                    <span className="text-ink-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-ink-muted">Total: <strong>R$ {order.total.toFixed(2)}</strong></span>
                    {isPaid ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Pago & Liberado
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Aguardando Pagamento
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in this order */}
                <div className="divide-y divide-borderSoft">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-surface-warm border border-borderSoft flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-ink text-sm">
                                {item.productTitle}
                              </h4>
                              {getItemTypeBadge(item.productType)}
                            </div>
                            <p className="text-[11px] text-ink-muted font-mono mt-0.5">
                              {item.zipFileName || item.downloadFileName}
                            </p>
                          </div>
                        </div>

                        {/* Botão de Download ou Aviso de Pagamento Pendente */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isPaid ? (
                            <button
                              onClick={() => downloadFile(item.productTitle, item.zipFileName || item.downloadFileName, item.format)}
                              className="h-8 px-4 rounded-lg bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar {item.zipFileName ? '.ZIP' : 'Arquivo'}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Disponível após pagamento
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Logins e Credenciais de Acesso (Apenas se pago) */}
                      {isPaid && (item.accessLogins || item.proxyDetails) && (
                        <div className="bg-surface-warm p-3.5 rounded-lg border border-borderSoft space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-primary" />
                              Credenciais & Acessos Liberados:
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.2 rounded-full">
                              Pronta Entrega
                            </span>
                          </div>

                          {item.accessLogins && (
                            <div className="text-xs font-mono bg-white p-2.5 rounded border border-borderSoft flex items-center justify-between gap-2">
                              <div className="truncate text-ink">
                                <span className="text-ink-muted select-none">Logins: </span>
                                {item.accessLogins}
                              </div>
                              <button
                                onClick={() => handleCopy(item.accessLogins || '', `login-${idx}`)}
                                className="px-2 py-1 bg-surface-warm hover:bg-black/[0.05] border border-borderSoft rounded text-[10px] font-medium text-ink shrink-0 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `login-${idx}` ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {item.proxyDetails && (
                            <div className="text-xs font-mono bg-white p-2.5 rounded border border-borderSoft flex items-center justify-between gap-2">
                              <div className="truncate text-ink">
                                <span className="text-ink-muted select-none">Proxy: </span>
                                {item.proxyDetails}
                              </div>
                              <button
                                onClick={() => handleCopy(item.proxyDetails || '', `proxy-${idx}`)}
                                className="px-2 py-1 bg-surface-warm hover:bg-black/[0.05] border border-borderSoft rounded text-[10px] font-medium text-ink shrink-0 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `proxy-${idx}` ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}



                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
