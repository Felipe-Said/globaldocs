import React from 'react';
import { useStore } from '../context/StoreContext';
import { FileText, Shield, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GATEWAY_LOGOS } from '../utils/gatewayLogos';

export const Footer: React.FC = () => {
  const { collections, setSelectedCategory, setSelectedCollectionId, settings } = useStore();
  const activeCollections = collections.filter((collection) => collection.active);

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
                  to="/downloads"
                  className="hover:text-primary transition-colors cursor-pointer text-left block"
                >
                  Meus Downloads & Pedidos
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

          {/* Gateways Aceitos - Logos Oficiais Sem Bordas */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 select-none">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-faint">Pagamentos:</span>
            <div className="flex items-center gap-3.5 opacity-85 hover:opacity-100 transition-opacity">
              <img src={GATEWAY_LOGOS.pix} alt="Pix" title="Pix" className="h-3.5 w-auto object-contain" style={{ border: 'none' }} />
              <img src={GATEWAY_LOGOS.mercadopago} alt="Mercado Pago" title="Mercado Pago" className="h-4 w-auto object-contain" style={{ border: 'none' }} />
              <img src={GATEWAY_LOGOS.stripe} alt="Stripe" title="Stripe" className="h-3 w-auto object-contain" style={{ border: 'none' }} />
              <img src={GATEWAY_LOGOS.visa} alt="Visa" title="Visa" className="h-2.5 w-auto object-contain" style={{ border: 'none' }} />
              <img src={GATEWAY_LOGOS.mastercard} alt="Mastercard" title="Mastercard" className="h-3.5 w-auto object-contain" style={{ border: 'none' }} />
              <img src={GATEWAY_LOGOS.elo} alt="Elo" title="Elo" className="h-2.5 w-auto object-contain" style={{ border: 'none' }} />
              <img src={GATEWAY_LOGOS.usdt} alt="Tether USDT" title="Tether USDT" className="h-3.5 w-auto object-contain" style={{ border: 'none' }} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
