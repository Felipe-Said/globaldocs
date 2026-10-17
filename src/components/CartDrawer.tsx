import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatTaxId, isValidTaxId, normalizeCustomerName } from '../lib/customer-profile';
import { detectBrands } from '../utils/brandDetection';
import { detectCountries } from '../utils/countryDetection';
import { CountryBadgesList } from './CountryBadge';
import { UsdtEstimate, UsdtQuote } from './UsdtEstimate';
import { GATEWAY_LOGOS } from '../utils/gatewayLogos';
import { Order, PaymentMethod } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Check,
  Zap,
  Clock,
  ChevronLeft,
  Lock,
  QrCode,
  CreditCard,
  Copy,
  Download,
  CheckCircle2,
  Package,
  Truck,
  ExternalLink,
  Coins,
  RefreshCw,
  WalletCards
  ,Minus,
  Plus
} from 'lucide-react';

export type CartPhase = 'cart' | 'customer' | 'payment' | 'success';

interface CryptoPayment {
  paymentId: string;
  status: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  actuallyPaid: number;
  expiresAt?: string;
  orderPaid?: boolean;
}

interface PaymentAvailability {
  pix: { enabled: boolean };
  card: { enabled: boolean };
  crypto: { enabled: boolean; payCurrency: string; sandbox: boolean };
}

export const CartDrawer: React.FC = () => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart, 
    removeFromCart, 
    updateCartQuantity,
    clearCart,
    subtotal, 
    discount, 
    total, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon,
    createOrder,
    downloadFile,
    settings,
    showToast,
    customerUser,
    walletBalance,
  } = useStore();

  const navigate = useNavigate();

  // Fase atual do fluxo no carrinho
  const [phase, setPhase] = useState<CartPhase>('cart');

  // Dados do Comprador (Fase 2)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Método de Pagamento (Fase 3)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentAvailability, setPaymentAvailability] = useState<PaymentAvailability>({
    pix: { enabled: false },
    card: { enabled: false },
    crypto: { enabled: false, payCurrency: 'usdttrc20', sandbox: false },
  });
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [cryptoGateway, setCryptoGateway] = useState({ enabled: false, payCurrency: 'usdttrc20', sandbox: false });
  const [cartQuote, setCartQuote] = useState<UsdtQuote | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [installments, setInstallments] = useState('1');

  // Pedido Concluído (Fase 4)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPayment | null>(null);
  const [cryptoError, setCryptoError] = useState('');
  const [copiedCryptoAddress, setCopiedCryptoAddress] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLogins, setCopiedLogins] = useState(false);
  const [copiedProxy, setCopiedProxy] = useState(false);

  // Estados de Cupom e Animações
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [checkoutBtnState, setCheckoutBtnState] = useState<'idle' | 'loading' | 'success'>('idle');

  // Oferta Relâmpago (20 minutos)
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60);
  const [flashDiscountActive, setFlashDiscountActive] = useState<boolean>(false);

  // Quando isCheckoutOpen for ativado externamente, avançar direto para a fase de checkout
  useEffect(() => {
    if (isCheckoutOpen) {
      if (!customerUser) {
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        navigate('/conta?return=checkout');
        return;
      }
      if (!customerUser.name?.trim() || !customerUser.document?.trim()) {
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        navigate('/conta?return=checkout');
        showToast('Complete seu nome e CPF/CNPJ para continuar a compra.', 'info');
        return;
      }
      if (cart.length > 0) {
        setPhase('customer');
      }
      setIsCartOpen(true);
    }
  }, [isCheckoutOpen, customerUser, cart.length, navigate, setIsCartOpen, setIsCheckoutOpen]);

  useEffect(() => {
    if (!customerUser) return;
    setEmail(customerUser.email);
    if (customerUser.name) setName(customerUser.name);
    if (customerUser.document) setDocument(formatTaxId(customerUser.document));
  }, [customerUser]);

  useEffect(() => {
    if (!isCartOpen) return;
    setPaymentMethodsLoading(true);
    void fetch('/api/payment-methods', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!data) return;
        setPaymentAvailability(data);
        setCryptoGateway(data.crypto);
        const available: PaymentMethod[] = [
          ...(walletBalance >= total && total > 0 ? ['wallet' as PaymentMethod] : []),
          ...(data.pix.enabled ? ['pix' as PaymentMethod] : []),
          ...(data.card.enabled ? ['credit_card' as PaymentMethod] : []),
          ...(data.crypto.enabled ? ['crypto' as PaymentMethod] : []),
        ];
        setPaymentMethod(method => method && available.includes(method) ? method : available[0] || null);
      })
      .catch(() => {
        setPaymentMethod(null);
        setCryptoGateway(value => ({ ...value, enabled: false }));
      })
      .finally(() => setPaymentMethodsLoading(false));
  }, [isCartOpen, walletBalance, total]);

  // Se o carrinho ficar vazio e ainda estiver nas fases de compra, voltar para 'cart'
  useEffect(() => {
    if (cart.length === 0 && phase !== 'success') {
      setPhase('cart');
    }
  }, [cart.length, phase]);

  // Timer da oferta relâmpago
  useEffect(() => {
    if (!flashDiscountActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setFlashDiscountActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [flashDiscountActive, timeLeft]);

  useEffect(() => {
    if (!cryptoPayment || !completedOrder || cryptoPayment.orderPaid || ['finished', 'failed', 'expired'].includes(cryptoPayment.status)) return;

    const checkStatus = async () => {
      try {
        const params = new URLSearchParams({
          orderId: completedOrder.id,
          downloadToken: completedOrder.downloadToken,
        });
        const response = await fetch(`/api/nowpayments/status?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) return;
        setCryptoPayment(result);
        if (result.orderPaid) {
          setCompletedOrder(result.order || (completedOrder ? { ...completedOrder, status: 'paid' } : completedOrder));
          setCheckoutBtnState('success');
          clearCart();
          setPhase('success');
          window.setTimeout(() => setCheckoutBtnState('idle'), 700);
        }
      } catch {
        // A próxima consulta automática tentará novamente.
      }
    };

    void checkStatus();
    const interval = window.setInterval(() => void checkStatus(), 10000);
    return () => window.clearInterval(interval);
  }, [cryptoPayment?.paymentId, cryptoPayment?.status, cryptoPayment?.orderPaid, completedOrder?.id]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Fechar gaveta com reset após transição
  const handleClose = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setTimeout(() => {
      if (phase === 'success') {
        setPhase('cart');
        setCompletedOrder(null);
        setCryptoPayment(null);
        setCryptoError('');
      }
    }, 500);
  };

  // Ativar 15% OFF da oferta relâmpago
  const handleClaimFlashDiscount = async () => {
    setCouponError('Nenhuma oferta automática está configurada.');
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  // Remoção animada do item
  const handleAnimatedRemove = (productId: string) => {
    setRemovingId(productId);
    setTimeout(() => {
      removeFromCart(productId);
      setRemovingId(null);
    }, 380);
  };

  // Avançar da Fase 1 (Carrinho) para Fase 2 (Identificação)
  const handleGoToCustomerPhase = () => {
    if (cart.length === 0) return;
    if (!customerUser) {
      setIsCartOpen(false);
      setIsCheckoutOpen(false);
      navigate('/conta?return=checkout');
      showToast('Crie ou acesse sua conta para continuar a compra.', 'info');
      return;
    }
    if (!customerUser.name?.trim() || !customerUser.document?.trim()) {
      setIsCartOpen(false);
      setIsCheckoutOpen(false);
      navigate('/conta?return=checkout');
      showToast('Complete seu nome e CPF/CNPJ para continuar a compra.', 'info');
      return;
    }
    setEmail(customerUser.email);
    setName(customerUser.name);
    setDocument(formatTaxId(customerUser.document));
    setPhase('customer');
  };

  // Avançar da Fase 2 (Identificação) para Fase 3 (Pagamento)
  const handleGoToPaymentPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (normalizeCustomerName(name).length < 3) {
      showToast('Informe seu nome completo ou razão social.', 'error');
      return;
    }
    if (!isValidTaxId(document)) {
      showToast('Informe um CPF ou CNPJ válido.', 'error');
      return;
    }
    setPhase('payment');
  };

  // Finalização do Pagamento na Fase 3
  const handleProcessFinalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutBtnState !== 'idle') return;
    if (!paymentMethod) {
      showToast('Nenhum método de pagamento está ativo no momento.', 'error');
      return;
    }
    if (paymentMethod === 'wallet' && walletBalance < total) {
      showToast('O saldo da carteira é insuficiente para este pedido.', 'error');
      setPaymentMethod(null);
      return;
    }

    setCheckoutBtnState('loading');
    const pendingItems = (completedOrder?.items || []) as Array<{ productId: string; quantity?: number }>;
    const pendingOrderMatchesCart = Boolean(
      completedOrder
      && Math.abs(completedOrder.total - total) < 0.01
      && pendingItems.length === cart.length
      && pendingItems.every(orderItem => cart.some(cartItem =>
        cartItem.product.id === orderItem.productId
        && cartItem.quantity === Number(orderItem.quantity || 1)
      ))
    );
    const reusableCryptoOrder = paymentMethod === 'crypto'
      && completedOrder?.paymentMethod === 'crypto'
      && completedOrder.status === 'pending'
      && pendingOrderMatchesCart
      ? completedOrder
      : null;
    const order = reusableCryptoOrder || await createOrder({ customerName: name, customerEmail: email, customerDocument: document, shippingAddress, paymentMethod });
    if (!order) { setCheckoutBtnState('idle'); return; }

    if (paymentMethod === 'crypto') {
      setCompletedOrder(order);
      setCryptoError('');
      try {
        const response = await fetch('/api/nowpayments/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, downloadToken: order.downloadToken }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Não foi possível gerar a cobrança em USDT.');
        setCryptoPayment(result);
        showToast('Cobrança em USDT criada. Envie o valor exato para o endereço exibido.', 'info');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível gerar a cobrança em USDT.';
        setCryptoError(message);
        showToast(message, 'error');
      } finally {
        setCheckoutBtnState('idle');
      }
      return;
    }

    setCheckoutBtnState('success');
    setCompletedOrder(order);
    clearCart();
    setPhase('success');
    setCheckoutBtnState('idle');
  };

  // Chave Pix Copia e Cola
  const pixKeyCopiaCola = `00020126580014br.gov.bcb.pix0136${settings.pixKey}520400005303986540${total.toFixed(2)}5802BR5913${settings.storeName}6009SAO PAULO62070503***6304E8A2`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKeyCopiaCola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const walletCanPay = Boolean(customerUser && total > 0 && walletBalance >= total);
  const visiblePaymentCount = Number(Boolean(customerUser))
    + Number(paymentAvailability.pix.enabled)
    + Number(paymentAvailability.card.enabled)
    + Number(paymentAvailability.crypto.enabled);
  const availablePaymentCount = Number(walletCanPay)
    + Number(paymentAvailability.pix.enabled)
    + Number(paymentAvailability.card.enabled)
    + Number(paymentAvailability.crypto.enabled);
  const paymentGridColumns = visiblePaymentCount <= 1
    ? 'grid-cols-1'
    : visiblePaymentCount === 2
      ? 'grid-cols-2'
      : visiblePaymentCount === 3
        ? 'grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4';
  const cryptoIsOnlyPayment = availablePaymentCount === 1 && paymentAvailability.crypto.enabled;
  const cryptoQuotePending = cryptoIsOnlyPayment && !cartQuote;
  const cryptoQuoteUnavailable = cryptoIsOnlyPayment && Boolean(cartQuote?.error);
  const cryptoMinimumInsufficient = cryptoIsOnlyPayment && cartQuote?.meetsMinimum === false;
  const cartAdvanceBlocked = paymentMethodsLoading
    || availablePaymentCount === 0
    || cryptoQuotePending
    || cryptoQuoteUnavailable
    || cryptoMinimumInsufficient;
  const minimumLabel = Number(cartQuote?.minAmount || 0).toLocaleString('pt-BR', { maximumFractionDigits: 6 });
  const cartAdvanceLabel = paymentMethodsLoading || cryptoQuotePending
    ? 'Verificando valor mínimo...'
    : availablePaymentCount === 0
      ? 'Nenhuma forma de pagamento disponível'
      : cryptoQuoteUnavailable
        ? 'Cotação em USDT indisponível'
        : cryptoMinimumInsufficient
          ? `Valor mínimo insuficiente — mínimo ${minimumLabel} USDT`
          : 'Avançar para Identificação';

  const completedHasProcessing = Boolean(completedOrder?.items.some((item) =>
    item.requiresFulfillment && item.deliveryStatus !== 'delivered' && !item.accessLogins
  ));

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden flex items-end sm:items-stretch justify-end transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isCartOpen 
          ? 'opacity-100 pointer-events-auto bg-black/40 backdrop-blur-md' 
          : 'opacity-0 pointer-events-none bg-black/0 backdrop-blur-none'
      }`}
      onClick={handleClose}
    >
      {/* Drawer Lateral com cantos arredondados estilo Apple */}
      <div 
        className={`bg-white w-full sm:max-w-md h-[92vh] sm:h-full rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl shadow-[-10px_0_40px_rgba(0,0,0,0.12)] flex flex-col relative transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isCartOpen 
            ? 'translate-y-0 sm:translate-x-0' 
            : 'translate-y-full sm:translate-x-full sm:translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Notch */}
        <div className="w-12 h-1.5 rounded-full bg-neutral-200 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* ========================================================
            DRAWER HEADER COM NAVEGAÇÃO DE ETAPAS
        ======================================================== */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            {phase === 'customer' && (
              <button
                onClick={() => setPhase('cart')}
                className="p-1.5 -ml-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Voltar ao carrinho"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {phase === 'payment' && (
              <button
                onClick={() => setPhase('customer')}
                className="p-1.5 -ml-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Voltar aos dados"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
                  {phase === 'cart' && 'Seu Carrinho'}
                  {phase === 'customer' && 'Identificação'}
                  {phase === 'payment' && 'Pagamento Seguro'}
                  {phase === 'success' && 'Pedido Confirmado! 🎉'}
                </h2>
                {phase === 'cart' && cart.length > 0 && (
                  <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </div>
              
              {/* Indicador de Etapas */}
              {(phase === 'customer' || phase === 'payment') && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-0.5">
                  <span className={phase === 'customer' ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>
                    1. Dados
                  </span>
                  <span>•</span>
                  <span className={phase === 'payment' ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>
                    2. Pagamento
                  </span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer focus:outline-none"
            aria-label="Fechar gaveta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================
            CORPO DO DRAWER (TRANSIÇÃO ENTRE FASES)
        ======================================================== */}
        <div className="relative flex-1 overflow-hidden flex flex-col bg-white">

          {/* ====================================================
              FASE 1: CARRINHO (ITENS, OFERTA, CUPOM & TOTAIS)
          ==================================================== */}
          {phase === 'cart' && (
            <>
              {cart.length === 0 ? (
                /* Empty State Elegante com animação */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 animate-fadeIn">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                    <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Seu carrinho está vazio
                  </h3>
                  <p className="text-gray-500 text-sm mb-8 max-w-xs">
                    Nenhum documento, kit LLC ou conta adicionada ainda.
                  </p>
                  <button 
                    onClick={handleClose}
                    className="px-8 py-3.5 bg-black text-white rounded-full font-medium hover:scale-105 active:scale-95 transition-all duration-300 shadow-md cursor-pointer text-sm"
                  >
                    Voltar para Loja
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col flex-1 animate-fadeIn">
                  
                  {/* Banner de Desconto Relâmpago */}
                  {flashDiscountActive && (
                    <div className="px-5 sm:px-6 pt-4 shrink-0">
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between shadow-xs transition-all duration-500">
                        <div className="pr-2">
                          <span className="text-indigo-800 font-semibold text-sm flex items-center gap-1.5">
                            <Zap className="w-4 h-4 fill-indigo-600 text-indigo-600" />
                            Oferta Relâmpago!
                          </span>
                          <p className="text-indigo-600 text-xs mt-0.5">
                            {appliedCoupon ? (
                              <span>Cupom <strong>{appliedCoupon.code}</strong> ativo ({appliedCoupon.discountPercent}% OFF)</span>
                            ) : (
                              <span>15% OFF liberado por tempo limitado.</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="bg-white text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg font-mono font-semibold text-xs shadow-xs timer-active flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            {formatTimer(timeLeft)}
                          </div>
                          {!appliedCoupon && (
                            <button
                              onClick={handleClaimFlashDiscount}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              Ativar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de Itens com Remoção Animada */}
                  <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
                    {cart.map((item) => {
                      const isRemoving = removingId === item.product.id;
                      const itemBrands = detectBrands(item.product);
                      const itemCountries = detectCountries(item.product);

                      return (
                        <div 
                          key={item.product.id}
                          className={`cart-item flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-xl shadow-xs transition-all duration-400 ease-[cubic-bezier(0.65,0,0.35,1)] ${
                            isRemoving 
                              ? 'opacity-0 -translate-x-5 scale-95 max-h-0 !p-0 !m-0 !border-0 overflow-hidden' 
                              : 'opacity-100 translate-x-0 scale-100 max-h-52'
                          }`}
                        >
                          {/* Miniatura / Formato */}
                          <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gray-50 border border-gray-100 rounded-lg flex-shrink-0 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-2xs">
                              {item.product.format}
                            </span>
                            {itemBrands.length > 0 && (
                              <img
                                src={itemBrands[0].url}
                                alt={itemBrands[0].name}
                                className="w-4 h-4 object-contain mt-1.5"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            )}
                          </div>

                          {/* Informações */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {item.product.deliverySpeed === 'immediate' ? (
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                  <Zap className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                                  Pronta Entrega
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {item.product.deliveryTime || 'Envio Digital'}
                                </span>
                              )}

                              {itemCountries.length > 0 && (
                                <CountryBadgesList countries={itemCountries} size="sm" />
                              )}
                            </div>

                            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                              {item.product.title}
                            </h3>

                            <div className="mt-1 font-semibold text-gray-900 text-sm">
                              {formatPrice(item.product.price * item.quantity)}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                  disabled={item.quantity <= Math.max(1, Number(item.product.minimumOrder || 1))}
                                  className="h-11 w-11 inline-flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed"
                                  aria-label={`Diminuir quantidade de ${item.product.title}`}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={Math.max(1, Number(item.product.minimumOrder || 1))}
                                  max={item.product.unlimitedStock ? 10000 : item.product.stockQuantity}
                                  value={item.quantity}
                                  onChange={event => updateCartQuantity(item.product.id, Number(event.target.value))}
                                  className="h-11 w-14 border-x border-gray-200 bg-white text-center text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  aria-label={`Quantidade de ${item.product.title}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                  disabled={!item.product.unlimitedStock && item.quantity >= item.product.stockQuantity}
                                  className="h-11 w-11 inline-flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed"
                                  aria-label={`Aumentar quantidade de ${item.product.title}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-[10px] text-gray-500">
                                {formatPrice(item.product.price)} cada
                              </span>
                            </div>
                          </div>

                          {/* Botão Remover */}
                          <button 
                            onClick={() => handleAnimatedRemove(item.product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Remover do carrinho"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Formulário de Cupom */}
                    <div className="pt-2">
                      <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Cupom de desconto"
                              value={couponInput}
                              onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 uppercase font-medium focus:bg-white focus:border-black focus:outline-none transition-colors"
                            />
                          </div>
                          <button
                            type="submit"
                            className="h-8.5 px-3.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
                          >
                            Aplicar
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[11px] text-red-500">{couponError}</p>
                        )}
                        {appliedCoupon && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Cupom <strong>{appliedCoupon.code}</strong> ({appliedCoupon.discountPercent}% OFF)
                            </span>
                            <button 
                              type="button" 
                              onClick={removeCoupon} 
                              className="text-xs underline text-emerald-700 hover:opacity-80 cursor-pointer"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>

                  {/* Rodapé do Carrinho com Resumo e Botão para Avançar */}
                  <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50 shrink-0 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-gray-500 text-sm">
                        <span>Subtotal Original</span>
                        <span className={discount > 0 ? 'line-through text-gray-400' : 'font-medium'}>
                          {formatPrice(subtotal)}
                        </span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between text-indigo-600 text-sm font-medium animate-fadeIn">
                          <span>Desconto ({appliedCoupon ? `${appliedCoupon.discountPercent}%` : '15%'})</span>
                          <span>- {formatPrice(discount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-200/60">
                        <span className="font-medium text-base sm:text-lg">Total a Pagar</span>
                        <span className="font-semibold text-lg sm:text-xl">{formatPrice(total)}</span>
                      </div>
                    </div>

                    {cryptoGateway.enabled && (
                      <UsdtEstimate amount={total} onQuote={setCartQuote} />
                    )}

                    {/* Botão de Avançar com Feedback Tátil */}
                    <button 
                      onClick={handleGoToCustomerPhase}
                      disabled={cartAdvanceBlocked}
                      aria-describedby={cryptoMinimumInsufficient ? 'crypto-minimum-help' : undefined}
                      className="w-full bg-black hover:bg-neutral-900 text-white rounded-xl min-h-[54px] px-4 py-3 flex items-center justify-center gap-2 text-center text-sm font-medium shadow-md transition-all duration-300 active:scale-[0.96] cursor-pointer disabled:bg-gray-200 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      <span>{cartAdvanceLabel}</span>
                      {!cartAdvanceBlocked && <ArrowRight className="w-4 h-4 shrink-0" />}
                    </button>

                    {cryptoMinimumInsufficient && (
                      <p id="crypto-minimum-help" role="alert" className="text-center text-[11px] leading-relaxed text-amber-800">
                        Adicione mais itens ao carrinho para atingir o valor mínimo exigido para pagamento em USDT.
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Liberação imediata • Pagamento 100% Seguro</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ====================================================
              FASE 2: IDENTIFICAÇÃO DO CLIENTE (FORMULÁRIO NO CARRINHO)
          ==================================================== */}
          {phase === 'customer' && (
            <form onSubmit={handleGoToPaymentPhase} className="h-full flex flex-col flex-1 animate-fadeIn">
              
              {/* Barra de Resumo Compacto do Pedido */}
              <div className="px-5 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Total da Compra ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                </span>
                <span className="font-bold text-gray-900 text-sm">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Campos do Formulário */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    E-mail para Entrega dos Arquivos *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    readOnly
                    aria-readonly="true"
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    E-mail verificado da sua conta. Os links e credenciais serão vinculados a ele.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    CPF ou CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={(e) => setDocument(formatTaxId(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Obrigatório para geração do Pix e emissão do recibo oficial.
                  </p>
                </div>
              </div>

              {/* Rodapé com Botão para Avançar para Pagamento */}
              <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50 shrink-0 space-y-3">
                <button
                  type="submit"
                  className="w-full bg-black hover:bg-neutral-900 text-white rounded-xl h-[54px] flex items-center justify-center gap-2 font-medium shadow-md transition-all duration-300 active:scale-[0.96] cursor-pointer"
                >
                  <span>Continuar para Pagamento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ambiente criptografado com SSL de 256 bits</span>
                </div>
              </div>

            </form>
          )}

          {/* ====================================================
              FASE 3: PAGAMENTO DIRETO NO CARRINHO
          ==================================================== */}
          {phase === 'payment' && (
            <form onSubmit={handleProcessFinalPayment} className="h-full flex flex-col flex-1 animate-fadeIn">
              
              {/* Barra de Resumo */}
              <div className="px-5 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Cliente: </span>
                  <span className="font-semibold text-gray-900">{name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900 text-sm">{formatPrice(total)}</span>
                  {cryptoGateway.enabled && <UsdtEstimate amount={total} compact />}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
                
                {/* Seletor de Métodos com Logos Oficiais Sem Bordas */}
                <div className={`grid ${paymentGridColumns} gap-2`}>
                  {customerUser && <button
                    type="button"
                    aria-pressed={paymentMethod === 'wallet'}
                    disabled={!walletCanPay}
                    onClick={() => walletCanPay && setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'wallet'
                        ? 'border-black bg-gray-50 font-semibold shadow-xs cursor-pointer'
                        : walletCanPay
                          ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 cursor-pointer'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-65'
                    }`}
                  >
                    <WalletCards className="h-5 w-5" aria-hidden="true" />
                    <span className="text-xs">Saldo</span>
                    <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${walletCanPay ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>{walletBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </button>}
                  {paymentAvailability.pix.enabled && <button
                    type="button"
                    aria-pressed={paymentMethod === 'pix'}
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'pix'
                        ? 'border-black bg-gray-50 font-semibold shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <img 
                      src={GATEWAY_LOGOS.pix} 
                      alt="Pix" 
                      className="w-5 h-5 object-contain" 
                      style={{ border: 'none' }} 
                    />
                    <span className="text-xs">Pix</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full font-bold">5 seg</span>
                  </button>}

                  {paymentAvailability.card.enabled && <button
                    type="button"
                    aria-pressed={paymentMethod === 'credit_card'}
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'credit_card'
                        ? 'border-black bg-gray-50 font-semibold shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-1 h-5">
                      <img 
                        src={GATEWAY_LOGOS.visa} 
                        alt="Visa" 
                        className="h-2.5 w-auto object-contain" 
                        style={{ border: 'none' }} 
                      />
                      <img 
                        src={GATEWAY_LOGOS.mastercard} 
                        alt="Mastercard" 
                        className="h-3.5 w-auto object-contain" 
                        style={{ border: 'none' }} 
                      />
                    </div>
                    <span className="text-xs">Cartão</span>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-full font-medium">12x</span>
                  </button>}

                  {paymentAvailability.crypto.enabled && <button
                    type="button"
                    aria-pressed={paymentMethod === 'crypto'}
                    disabled={!cryptoGateway.enabled}
                    onClick={() => cryptoGateway.enabled && setPaymentMethod('crypto')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'crypto'
                        ? 'border-black bg-gray-50 font-semibold shadow-xs'
                        : cryptoGateway.enabled
                          ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <img 
                      src={GATEWAY_LOGOS.usdt} 
                      alt="USDT" 
                      className="w-5 h-5 object-contain" 
                      style={{ border: 'none' }} 
                    />
                    <span className="text-xs">USDT</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${cryptoGateway.enabled ? 'text-amber-700 bg-amber-100' : 'text-gray-500 bg-gray-200'}`}>
                      {cryptoGateway.enabled ? cryptoGateway.payCurrency.toUpperCase() : 'Indisponível'}
                    </span>
                  </button>}
                </div>

                {paymentMethodsLoading && (
                  <div role="status" className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-600">
                    Verificando métodos de pagamento disponíveis...
                  </div>
                )}

                {!paymentMethodsLoading && availablePaymentCount === 0 && (
                  <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs leading-relaxed text-amber-900">
                    Nenhum método de pagamento está ativo no momento. Entre em contato com o suporte ou tente novamente mais tarde.
                  </div>
                )}

                {/* Conteúdo: PIX */}
                {paymentMethod === 'wallet' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-emerald-900"><WalletCards className="h-4 w-4" aria-hidden="true" /> Pagamento com saldo</div>
                    <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><span className="text-emerald-800">Saldo atual</span><strong>{formatPrice(walletBalance)}</strong></div><div className="flex items-center justify-between gap-3"><span className="text-emerald-800">Valor do pedido</span><strong>- {formatPrice(total)}</strong></div><div className="flex items-center justify-between gap-3 border-t border-emerald-100 pt-2"><span className="font-semibold text-emerald-900">Saldo restante</span><strong className="text-sm">{formatPrice(walletBalance - total)}</strong></div></div>
                    <p className="mt-3 text-[11px] leading-relaxed text-emerald-800">A confirmação é imediata e os itens digitais são liberados assim que o pedido é concluído.</p>
                  </div>
                )}

                {/* Conteúdo: PIX */}
                {paymentMethod === 'pix' && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3.5 text-center animate-fadeIn">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800">
                      <img 
                        src={GATEWAY_LOGOS.pix} 
                        alt="Pix" 
                        className="w-4 h-4 object-contain" 
                        style={{ border: 'none' }} 
                      />
                      <span>Aprovação Automática e Imediata</span>
                    </div>

                    {/* QR Code Simulado SVG */}
                    <div className="w-40 h-40 bg-white p-2.5 mx-auto rounded-xl border border-gray-200 shadow-xs flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-neutral-900 fill-current">
                        <path d="M0 0h35v35h-35zM5 5h25v25h-25zM10 10h15v15h-15zM65 0h35v35h-35zM70 5h25v25h-25zM75 10h15v15h-15zM0 65h35v35h-35zM5 70h25v25h-25zM10 75h15v15h-15zM45 10h10v10h-10zM45 35h10v10h-10zM45 55h10v10h-10zM45 75h10v10h-10zM65 45h10v10h-10zM65 65h10v10h-10zM85 45h10v10h-10zM85 75h10v10h-10zM25 45h10v10h-10zM5 45h10v10h-10zM65 85h25v10h-25z" />
                      </svg>
                    </div>

                    {/* Copia e Cola */}
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        Código Pix Copia e Cola:
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={pixKeyCopiaCola}
                          className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 font-mono truncate focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                            copiedPix ? 'bg-emerald-600 text-white' : 'bg-black text-white hover:bg-neutral-800'
                          }`}
                        >
                          {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conteúdo: Cartão de Crédito */}
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3 animate-fadeIn">
                    {/* Logos de Bandeiras sem Bordas */}
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-600">Bandeiras aceitas:</span>
                      <div className="flex items-center gap-2">
                        <img src={GATEWAY_LOGOS.visa} alt="Visa" className="h-2.5 w-auto object-contain" style={{ border: 'none' }} />
                        <img src={GATEWAY_LOGOS.mastercard} alt="Mastercard" className="h-3.5 w-auto object-contain" style={{ border: 'none' }} />
                        <img src={GATEWAY_LOGOS.elo} alt="Elo" className="h-2.5 w-auto object-contain" style={{ border: 'none' }} />
                        <img src={GATEWAY_LOGOS.amex} alt="Amex" className="h-3 w-auto object-contain" style={{ border: 'none' }} />
                        <img src={GATEWAY_LOGOS.stripe} alt="Stripe" className="h-3 w-auto object-contain" style={{ border: 'none' }} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-black focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-center focus:bg-white focus:border-black focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-center font-mono focus:bg-white focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Parcelamento
                      </label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-black focus:outline-none cursor-pointer"
                      >
                        <option value="1">1x de {formatPrice(total)} (à vista)</option>
                        <option value="2">2x de {formatPrice(total / 2)} sem juros</option>
                        <option value="3">3x de {formatPrice(total / 3)} sem juros</option>
                        <option value="6">6x de {formatPrice(total / 6)} sem juros</option>
                        <option value="12">12x de {formatPrice(total / 12)}</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Conteúdo: USDT */}
                {paymentMethod === 'crypto' && (
                  <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3 text-xs text-amber-950 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <img 
                        src={GATEWAY_LOGOS.usdt} 
                        alt="USDT" 
                        className="w-4 h-4 object-contain" 
                        style={{ border: 'none' }} 
                      />
                      <span className="font-bold text-amber-900">
                        Pagamento em USDT
                      </span>
                    </div>

                    {!cryptoPayment ? (
                      <div className="space-y-3">
                        <UsdtEstimate amount={total} />
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Ao confirmar, a cotação é fixada e um endereço exclusivo é gerado para este pedido. A liberação ocorre somente após a confirmação on-chain.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-amber-800">Valor exato:</span>
                          <strong className="text-sm text-amber-950 font-mono">
                            {cryptoPayment.payAmount} {cryptoPayment.payCurrency?.toUpperCase()}
                          </strong>
                        </div>
                        <div>
                          <div className="text-[11px] text-amber-800 mb-1">Endereço exclusivo:</div>
                          <div className="bg-white p-2 rounded border border-amber-200 flex items-start gap-2">
                            <span className="font-mono text-[10px] break-all select-all flex-1">{cryptoPayment.payAddress}</span>
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(cryptoPayment.payAddress);
                                setCopiedCryptoAddress(true);
                                window.setTimeout(() => setCopiedCryptoAddress(false), 2000);
                              }}
                              className="text-amber-800 hover:text-amber-950 font-semibold shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" /> {copiedCryptoAddress ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                        <div role="status" aria-live="polite" className="flex items-center gap-2 text-[11px] text-amber-800">
                          {!['failed', 'expired', 'refunded'].includes(cryptoPayment.status) && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>
                            Status: <strong className="uppercase">{cryptoPayment.status}</strong>.
                            {['failed', 'expired', 'refunded'].includes(cryptoPayment.status) ? ' Gere uma nova cobrança para tentar novamente.' : ' Verificando automaticamente...'}
                          </span>
                        </div>
                      </div>
                    )}

                    {cryptoError && <p role="alert" className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded p-2">{cryptoError}</p>}
                  </div>
                )}

              </div>

              {/* Rodapé com Botão Animado de Finalização (Tactile Press & Morphing) */}
              <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50 shrink-0 space-y-3">
                
                <button 
                  id="checkout-btn" 
                  type="submit"
                  disabled={checkoutBtnState !== 'idle' || paymentMethodsLoading || !paymentMethod}
                  className={`relative w-full rounded-xl h-[56px] overflow-hidden group shadow-md transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] font-medium active:scale-[0.96] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    checkoutBtnState === 'success' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-black text-white hover:bg-neutral-900'
                  }`}
                >
                  {/* 1. Texto Padrão */}
                  <div 
                    className={`absolute inset-0 flex items-center justify-center gap-2 font-medium transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      checkoutBtnState === 'idle' 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 -translate-y-5 pointer-events-none'
                    }`}
                  >
                    <span>{paymentMethod === 'wallet'
                      ? `Pagar com saldo (${formatPrice(total)})`
                      : paymentMethod === 'crypto'
                      ? `Gerar cobrança em USDT (${formatPrice(total)})`
                      : paymentMethod
                        ? `Confirmar e Finalizar Compra (${formatPrice(total)})`
                        : 'Nenhum método de pagamento ativo'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>

                  {/* 2. Spinner de Processamento */}
                  <div 
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      checkoutBtnState === 'loading' 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-5 pointer-events-none'
                    }`}
                  >
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>

                  {/* 3. Ícone de Confirmação Sucesso */}
                  <div 
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      checkoutBtnState === 'success' 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-50 pointer-events-none'
                    }`}
                  >
                    <Check className="w-7 h-7 text-white stroke-[2.5]" />
                  </div>
                </button>

                <div className="space-y-1.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{paymentMethod === 'wallet'
                      ? 'Pagamento instantâneo com o saldo da sua carteira'
                      : paymentMethod === 'crypto'
                      ? 'Liberação após confirmação do pagamento na blockchain'
                      : 'Pagamento protegido e liberação após confirmação'}</span>
                  </div>

                  {/* Gateways Trust Bar Sem Bordas */}
                  <div className="flex items-center justify-center gap-3 pt-0.5 opacity-80">
                    {customerUser && <WalletCards className="h-4 w-4 text-ink" aria-label="Saldo da carteira" />}
                    {paymentAvailability.pix.enabled && <img src={GATEWAY_LOGOS.pix} alt="Pix" className="h-3.5 w-auto object-contain" style={{ border: 'none' }} />}
                    {paymentAvailability.card.enabled && <>
                      <img src={GATEWAY_LOGOS.visa} alt="Visa" className="h-2.5 w-auto object-contain" style={{ border: 'none' }} />
                      <img src={GATEWAY_LOGOS.mastercard} alt="Mastercard" className="h-3 w-auto object-contain" style={{ border: 'none' }} />
                    </>}
                    {paymentAvailability.crypto.enabled && <img src={GATEWAY_LOGOS.usdt} alt="USDT" className="h-4 w-auto object-contain" style={{ border: 'none' }} />}
                  </div>
                </div>
              </div>

            </form>
          )}

          {/* ====================================================
              FASE 4: SUCESSO & LIBERAÇÃO IMEDIATA DOS ARQUIVOS
          ==================================================== */}
          {phase === 'success' && completedOrder && (
            <div className="h-full flex flex-col flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 animate-fadeIn">
              
              <div className="text-center pt-2">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 shadow-sm ${completedHasProcessing ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600 animate-bounce'}`}>
                  {completedHasProcessing ? (
                    <RefreshCw className="w-8 h-8 stroke-[2.5] animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-9 h-9 stroke-[2.5]" aria-hidden="true" />
                  )}
                </div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${completedHasProcessing ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'}`}>
                  {completedHasProcessing ? 'Pagamento aprovado • envio em processamento' : 'Pagamento aprovado instantaneamente'}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
                  Obrigado, {completedOrder.customerName}!
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  {completedHasProcessing ? (
                    <>Seu pedido <strong>#{completedOrder.id}</strong> foi confirmado. Estamos processando o envio e o acesso aparecerá na sua conta assim que estiver pronto.</>
                  ) : (
                    <>Seu pedido <strong>#{completedOrder.id}</strong> foi registrado e os acessos foram liberados abaixo.</>
                  )}
                </p>
              </div>

              {/* Chave da Licença */}
              <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Licença Oficial:</span>
                  <button
                    onClick={() => handleCopyToken(completedOrder.downloadToken)}
                    className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedToken ? 'Copiada!' : 'Copiar'}
                  </button>
                </div>
                <div className="font-mono bg-white p-2 rounded border border-gray-200 text-gray-900 select-all font-semibold">
                  {completedOrder.downloadToken}
                </div>
              </div>

              {/* Lista de Itens com Acesso Imediato */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  {completedHasProcessing ? 'Status dos seus itens:' : 'Seus arquivos & acessos liberados:'}
                </h4>

                {completedOrder.items.map((item, idx) => {
                  const waitingDelivery = item.requiresFulfillment && item.deliveryStatus !== 'delivered' && !item.accessLogins;
                  return (
                  <div 
                    key={idx}
                    className="bg-white border border-gray-200 p-3.5 rounded-xl space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                          {item.format}
                        </span>
                        <h5 className="font-semibold text-gray-900 text-xs sm:text-sm mt-1">
                          {item.productTitle}
                        </h5>
                      </div>
                      
                      {waitingDelivery ? (
                        <span className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0" role="status">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          Processando envio...
                        </span>
                      ) : (
                        <button
                          onClick={() => downloadFile(item.productTitle, item.downloadFileName || `${item.productTitle}.pdf`, item.format)}
                          className="min-h-11 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Baixar</span>
                        </button>
                      )}
                    </div>

                    {/* Pronta Entrega: ZIP adicional */}
                    {item.zipFileName && (
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-indigo-600" />
                          Pacote ZIP: {item.zipFileName}
                        </span>
                        <button
                          onClick={() => downloadFile(item.productTitle, item.zipFileName!, 'ZIP')}
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          Baixar ZIP
                        </button>
                      </div>
                    )}

                    {/* Pronta Entrega: Logins de Acesso */}
                    {item.accessLogins && (
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700">
                          <span>Credenciais de Acesso:</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.accessLogins!);
                              setCopiedLogins(true);
                              setTimeout(() => setCopiedLogins(false), 2000);
                            }}
                            className="text-indigo-600 hover:underline"
                          >
                            {copiedLogins ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <pre className="font-mono text-[11px] text-gray-800 whitespace-pre-wrap select-all">
                          {item.accessLogins}
                        </pre>
                      </div>
                    )}

                    {/* Pronta Entrega: Proxies */}
                    {item.proxyDetails && (
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700">
                          <span>Proxy Dedicado:</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.proxyDetails!);
                              setCopiedProxy(true);
                              setTimeout(() => setCopiedProxy(false), 2000);
                            }}
                            className="text-indigo-600 hover:underline"
                          >
                            {copiedProxy ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <code className="font-mono text-[11px] text-gray-800 break-all select-all">
                          {item.proxyDetails}
                        </code>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* Botões de Ação Final */}
              <div className="pt-2 space-y-2 pb-4">
                <button
                  onClick={() => {
                    handleClose();
                    navigate('/conta');
                  }}
                  className="w-full bg-black hover:bg-neutral-900 text-white rounded-xl h-[48px] flex items-center justify-center gap-2 font-medium text-sm transition-all cursor-pointer"
                >
                  <span>Ir para Minha Conta</span>
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={handleClose}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl h-[44px] flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer"
                >
                  Concluir e Voltar à Loja
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
