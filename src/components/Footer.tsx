import React from 'react';
import { useStore } from '../context/StoreContext';
import { Instagram, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GATEWAY_LOGOS } from '../utils/gatewayLogos';
import { getBrandLogoUrl } from '../utils/brandDetection';

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
        <div className="grid grid-cols-1 gap-8 border-b border-borderSoft pb-12 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          
          {/* Brand & Editorial Column */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-2 xl:col-span-2">
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

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
              Políticas
            </h4>
            <ul className="space-y-2 text-xs text-ink-muted">
              <li><Link to="/politicas#termos" className="block transition-colors hover:text-primary">Termos de Uso</Link></li>
              <li><Link to="/politicas#privacidade" className="block transition-colors hover:text-primary">Privacidade e LGPD</Link></li>
              <li><Link to="/politicas#reembolso" className="block transition-colors hover:text-primary">Trocas e Reembolsos</Link></li>
              <li><Link to="/politicas#entrega" className="block transition-colors hover:text-primary">Entrega Digital</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Área do Cliente
            </h4>
            <ul className="space-y-2 text-xs text-ink-muted">
              <li>
                <Link 
                  to="/conta?view=overview"
                  className="hover:text-primary transition-colors cursor-pointer text-left block"
                >
                  Visão geral
                </Link>
              </li>
              <li>
                <Link to="/conta?view=orders" className="block transition-colors hover:text-primary">
                  Meus pedidos
                </Link>
              </li>
              <li>
                <Link to="/conta?view=downloads" className="block transition-colors hover:text-primary">
                  Downloads e acessos
                </Link>
              </li>
              <li>
                <Link to="/conta?view=wallet" className="block transition-colors hover:text-primary">
                  Minha carteira
                </Link>
              </li>
              <li>
                <Link to="/conta?view=profile" className="block transition-colors hover:text-primary">
                  Meu perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Suporte & Acesso Restrito */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Atendimento & Suporte
            </h4>
            <ul className="space-y-2 text-xs text-ink-muted">
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="inline-flex min-h-6 items-center gap-1.5 break-all transition-colors hover:text-primary">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{settings.contactEmail}</span>
                </a>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <a
                  href="https://www.instagram.com/globaldocs.sbs"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir o Instagram da Global DOCs"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-borderSoft bg-white px-3 font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-tint hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://chat.whatsapp.com/Bqi4p3279UZ1IVXVkcVVMB?s=cl&p=i&ilr=4&iam=2"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Entrar no grupo de avisos da Global DOCs no WhatsApp"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-borderSoft bg-white px-3 font-semibold text-ink transition-colors hover:border-[#25D366]/50 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
                >
                  <img src={getBrandLogoUrl('whatsapp')} alt="" className="h-[18px] w-[18px] object-contain" aria-hidden="true" />
                  <span>Grupo de avisos</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-bar with Borderless Gateway Logos */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-ink-muted gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link to="/politicas#privacidade" className="transition-colors hover:text-primary">Privacidade & LGPD</Link>
            <span>•</span>
            <Link to="/politicas#termos" className="transition-colors hover:text-primary">Termos de Uso</Link>
            <span>•</span>
            <Link to="/politicas#entrega" className="transition-colors hover:text-primary">Entrega Digital</Link>
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
