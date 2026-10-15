import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { PaymentMethod, Order } from '../types';
import { 
  X, 
  QrCode, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Lock, 
  ArrowRight,
  ExternalLink,
  Package,
  Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CheckoutModal: React.FC = () => {
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    cart, 
    total, 
    discount, 
    createOrder,
    downloadFile,
    settings
  } = useStore();

  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  if (!isCheckoutOpen) return null;

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const order = await createOrder({ customerName: name, customerEmail: email, customerDocument: document, shippingAddress, paymentMethod });
    setIsProcessing(false);
    if (order) setCompletedOrder(order);
  };

  const pixKeyCopiaCola = `00020126580014br.gov.bcb.pix0136${settings.pixKey}520400005303986540${total.toFixed(2)}5802BR5913${settings.storeName}6009SAO PAULO62070503***6304E8A2`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKeyCopiaCola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fadeIn"
      onClick={() => { setIsCheckoutOpen(false); setCompletedOrder(null); }}
    >
      <div 
        className="bg-surface w-full max-w-2xl rounded-t-2xl sm:rounded-md border border-borderSoft shadow-notion-modal overflow-hidden relative flex flex-col max-h-[92vh] animate-slideUpMobile sm:animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Notch Handle */}
        <div className="w-12 h-1.5 rounded-full bg-borderSoft/80 mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-borderSoft flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-success" />
            <h3 className="font-bold text-sm sm:text-base text-ink">
              {completedOrder ? 'Pedido Confirmado!' : 'Checkout Seguro GlobalDOCS'}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsCheckoutOpen(false);
              setCompletedOrder(null);
            }}
            className="w-8 h-8 rounded-sm flex items-center justify-center text-ink-muted hover:text-ink hover:bg-black/[0.05] transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Screen */}
        {completedOrder ? (
          <div className="p-5 sm:p-8 space-y-5 text-center overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-success-tint text-success mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-success bg-success-tint px-2.5 py-0.5 rounded-full">
                Pagamento Aprovado
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-ink mt-2">
                Obrigado, {completedOrder.customerName}!
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1">
                Seu pedido foi registrado e os dados enviados para <strong>{completedOrder.customerEmail}</strong>.
              </p>
            </div>

            {/* License Token & Details */}
            <div className="bg-surface-warm p-3.5 rounded-sm border border-borderSoft text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Pedido: <strong>#{completedOrder.id}</strong></span>
                <span>{new Date(completedOrder.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="text-ink-muted">
                Licença: <code className="bg-white px-2 py-0.5 rounded font-mono text-ink font-semibold border border-borderSoft">{completedOrder.downloadToken}</code>
              </div>
              {completedOrder.shippingAddress && (
                <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 mt-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 shrink-0" />
                  <span><strong>Entrega Sedex:</strong> {completedOrder.shippingAddress}</span>
                </div>
              )}
            </div>

            {/* List of items */}
            <div className="space-y-2 text-left">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Itens Disponíveis:
              </h4>
              {completedOrder.items.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-surface rounded-sm border border-borderSoft flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-7 h-7 rounded-xs bg-primary-tint text-primary-pressed flex items-center justify-center font-bold text-[10px] shrink-0">
                      {item.format}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-ink truncate">{item.productTitle}</div>
                      <div className="text-[10px] text-ink-muted">{item.downloadFileName}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadFile(item.productTitle, item.downloadFileName, item.format)}
                    className="h-8 px-2.5 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setCompletedOrder(null);
                  navigate('/conta');
                }}
                className="w-full sm:w-auto h-10 px-4 rounded-sm bg-ink text-white text-xs font-semibold hover:bg-black/80 transition-colors flex items-center justify-center gap-2"
              >
                <span>Acessar Minha Conta</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setCompletedOrder(null);
                  navigate('/');
                }}
                className="w-full sm:w-auto h-10 px-4 rounded-sm bg-surface-warm text-ink text-xs font-medium border border-borderSoft"
              >
                Voltar à Loja
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleCompletePayment} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Customer Information */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                1. Dados do Comprador
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-ink mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                2. Pagamento
              </h4>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    paymentMethod === 'pix'
                      ? 'border-primary bg-primary-tint/40 text-primary-pressed font-semibold ring-1 ring-primary'
                      : 'border-borderSoft bg-surface hover:bg-surface-warm text-ink-muted'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-bold">Pix</span>
                  <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-100 px-1 rounded whitespace-nowrap shrink-0">5s</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    paymentMethod === 'credit_card'
                      ? 'border-primary bg-primary-tint/40 text-primary-pressed font-semibold ring-1 ring-primary'
                      : 'border-borderSoft bg-surface hover:bg-surface-warm text-ink-muted'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold">Cartão</span>
                  <span className="text-[9px] text-ink-muted whitespace-nowrap shrink-0">12x</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('boleto')}
                  className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    paymentMethod === 'boleto'
                      ? 'border-primary bg-primary-tint/40 text-primary-pressed font-semibold ring-1 ring-primary'
                      : 'border-borderSoft bg-surface hover:bg-surface-warm text-ink-muted'
                  }`}
                >
                  <FileText className="w-4 h-4 text-ink-muted" />
                  <span className="text-[11px] font-bold">Boleto</span>
                  <span className="text-[9px] text-ink-muted whitespace-nowrap shrink-0">1 dia</span>
                </button>
              </div>

              {paymentMethod === 'pix' && (
                <div className="p-3 bg-emerald-50/60 rounded-sm border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pix Copia e Cola Oficial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      readOnly
                      value={pixKeyCopiaCola}
                      className="flex-1 bg-white border border-emerald-200 rounded-sm px-2 py-1.5 text-[10px] font-mono text-ink-muted truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="h-8 px-2.5 rounded-sm bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="p-3 bg-surface-warm rounded-sm border border-borderSoft space-y-2">
                  <div>
                    <label className="block text-[10px] font-medium text-ink-muted mb-0.5">Cartão</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-borderSoft rounded-sm text-ink font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-ink-muted mb-0.5">Validade</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-borderSoft rounded-sm text-ink text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-ink-muted mb-0.5">CVV</label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-borderSoft rounded-sm text-ink text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-borderSoft flex flex-col sm:flex-row items-center justify-between gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="w-full sm:w-auto">
                <div className="text-[10px] text-ink-muted">Total:</div>
                <div className="text-lg sm:text-xl font-bold text-ink">
                  {formatPrice(total)}
                  {discount > 0 && (
                    <span className="text-xs text-success font-medium ml-2">
                      (-{formatPrice(discount)})
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full sm:w-auto h-12 sm:h-11 px-7 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md transition-all duration-300 disabled:opacity-60 active:scale-[0.96] cursor-pointer"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando Pedido...
                  </span>
                ) : (
                  <>
                    <span>Confirmar e Finalizar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
