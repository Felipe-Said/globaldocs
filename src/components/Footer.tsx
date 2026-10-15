import React from 'react';
import { useStore } from '../context/StoreContext';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GATEWAY_LOGOS } from '../utils/gatewayLogos';

interface PaymentAvailability {
  pix: { enabled: boolean };
  card: { enabled: boolean };
  crypto: { enabled: boolean };
}

export const Footer: React.FC = () => {
  const { collections, settings } = useStore();
  const [paymentAvailability, setPaymentAvailability] = React.useState<PaymentAvailability | null>(null);
  const activeCollections = collections.filter((collection) => collection.active);

  React.useEffect(() => {
    const controller = new AbortController();

    void fetch('/api/payment-methods', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<PaymentAvailability>;
      })
      .then((availability) => {
        if (availability) setPaymentAvailability(availability);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setPaymentAvailability(null);
        }
      });

    return () => controller.abort();
  }, []);

  const hasActivePayments = Boolean(
    paymentAvailability?.pix.enabled
    || paymentAvailability?.card.enabled
    || paymentAvailability?.crypto.enabled,
  );

  return (
    <footer className="bg-surface border-t border-borderSoft mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 ${activeCollections.length > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-8 pb-12 border-b border-borderSoft`}>
          
          {/* Brand & Editorial Column */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block focus:outline-none">
              <img 
                src="/logo.png" 
                alt={settings.storeName} 
                className="h-8 w-auto object-contain" 
              />
            </Link>

            <p className="text-sm text-ink-muted leading-relaxed max-w-sm">
              Plataforma especializada em formação de LLC americana, dossiês de contas globais, minutas corporativas, planilhas financeiras e downloads digitais oficiais.
            </p>

            <div className="text-xs text-ink-faint">
              © {new Date().getFullYear()} {settings.storeName}. Todos os direitos reservados.
            </div>
          </div>

          {activeCollections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Coleções
              </h4>
              <ul className="space-y-2 text-xs text-ink-muted">
                {activeCollections.map((collection) => (
                  <li key={collection.id}>
                    <Link
                      to={`/colecao/${collection.slug || collection.id}`}
                      className="hover:text-primary transition-colors cursor-pointer text-left block"
                    >
                      {collection.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links Column 2: Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Área do Cliente
            </h4>
            <ul className="space-y-2 text-xs text-ink-muted">
              <li>
                <Link 
                  to="/conta"
                  className="hover:text-primary transition-colors cursor-pointer text-left block"
                >
                  Minha Conta & Pedidos
                </Link>
              </li>
              <li>
                <span className="cursor-default">Download e Liberação Imediata</span>
              </li>
              <li>
                <span className="cursor-default">Validação de Token e Licença</span>
              </li>
              <li>
                <span className="cursor-default">Termos de Uso e Sigilo</span>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Suporte & Acesso Restrito */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Atendimento & Suporte
            </h4>
            <ul className="space-y-2 text-xs text-ink-muted">
              <li className="flex items-center gap-1 text-ink-muted">
                <Mail className="w-3.5 h-3.5" />
                <span>{settings.contactEmail}</span>
              </li>
              <li>
                <span>WhatsApp: {settings.supportWhatsapp}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-bar with Borderless Gateway Logos */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-ink-muted gap-4">
          <div className="flex items-center gap-4">
            <span>Privacidade & LGPD</span>
            <span>•</span>
            <span>Licença de Uso Comercial</span>
            <span>•</span>
            <span>Garantia de Download Imediato</span>
          </div>

          {hasActivePayments && (
            <div
              className="flex flex-wrap items-center justify-center gap-3.5 select-none"
              aria-label="Formas de pagamento ativas"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-faint">Pagamentos:</span>
              <div className="flex items-center gap-3.5 opacity-85 hover:opacity-100 transition-opacity">
                {paymentAvailability?.pix.enabled && (
                  <img src={GATEWAY_LOGOS.pix} alt="Pix" title="Pix" className="h-3.5 w-auto object-contain border-0" />
                )}
                {paymentAvailability?.card.enabled && (
                  <>
                    <img src={GATEWAY_LOGOS.visa} alt="Visa" title="Visa" className="h-2.5 w-auto object-contain border-0" />
                    <img src={GATEWAY_LOGOS.mastercard} alt="Mastercard" title="Mastercard" className="h-3.5 w-auto object-contain border-0" />
                    <img src={GATEWAY_LOGOS.elo} alt="Elo" title="Elo" className="h-2.5 w-auto object-contain border-0" />
                  </>
                )}
                {paymentAvailability?.crypto.enabled && (
                  <img src={GATEWAY_LOGOS.usdt} alt="USDT" title="USDT" className="h-3.5 w-auto object-contain border-0" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
