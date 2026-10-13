import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SlidersHorizontal, Save, ShieldCheck, Mail, Phone, QrCode, FileCode, Search, Copy } from 'lucide-react';
import { generateSitemapXml, downloadSitemapXml } from '../../utils/seo';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings, products, collections } = useStore();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [storeTagline, setStoreTagline] = useState(settings.storeTagline);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [supportWhatsapp, setSupportWhatsapp] = useState(settings.supportWhatsapp);
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [currency, setCurrency] = useState(settings.currency);
  const [allowGuestCheckout, setAllowGuestCheckout] = useState(settings.allowGuestCheckout);
  const [notifyOnSale, setNotifyOnSale] = useState(settings.notifyOnSale);

  useEffect(() => {
    setStoreName(settings.storeName);
    setStoreTagline(settings.storeTagline);
    setContactEmail(settings.contactEmail);
    setSupportWhatsapp(settings.supportWhatsapp);
    setPixKey(settings.pixKey);
    setCurrency(settings.currency);
    setAllowGuestCheckout(settings.allowGuestCheckout);
    setNotifyOnSale(settings.notifyOnSale);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName,
      storeTagline,
      contactEmail,
      supportWhatsapp,
      pixKey,
      currency,
      allowGuestCheckout,
      notifyOnSale,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-ink">Configurações Gerais da Loja</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Defina as informações de contato, chaves de recebimento e regras de venda
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-surface p-6 rounded-md border border-borderSoft shadow-xs space-y-5 text-xs">
        <div>
          <label className="block font-medium text-ink mb-1">Nome da Loja</label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink font-semibold focus:bg-white focus:border-primary"
          />
        </div>

        <div>
          <label className="block font-medium text-ink mb-1">Slogan / Tagline Institucional</label>
          <input
            type="text"
            required
            value={storeTagline}
            onChange={(e) => setStoreTagline(e.target.value)}
            className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-ink mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-ink-muted" />
              <span>E-mail de Suporte e Vendas</span>
            </label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-ink mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-ink-muted" />
              <span>WhatsApp de Atendimento</span>
            </label>
            <input
              type="text"
              value={supportWhatsapp}
              onChange={(e) => setSupportWhatsapp(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-ink mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chave Pix para Recebimento</span>
            </label>
            <input
              type="text"
              required
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CNPJ, E-mail ou Chave Aleatória"
              className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink font-mono focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-ink mb-1">Moeda Padrão</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-borderSoft space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowGuestCheckout}
              onChange={(e) => setAllowGuestCheckout(e.target.checked)}
              className="rounded text-primary"
            />
            <span className="font-medium text-ink">Permitir checkout direto sem exigência prévia de senha</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnSale}
              onChange={(e) => setNotifyOnSale(e.target.checked)}
              className="rounded text-primary"
            />
            <span className="font-medium text-ink">Disparar notificação automática por e-mail a cada venda aprovada</span>
          </label>
        </div>

        <div className="pt-4 border-t border-borderSoft flex justify-end">
          <button
            type="submit"
            className="h-9 px-5 rounded-sm bg-primary hover:bg-primary-pressed text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>

      {/* Seção de Sitemap & Indexação no Google */}
      <div className="bg-surface p-6 rounded-md border border-borderSoft shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-ink">Mecanismos de Busca, SEO & Sitemap XML</h3>
              <p className="text-[11px] text-ink-muted">
                Seu sitemap oficial indexa todas as coleções e produtos para ranqueamento no Google e Bing
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
            SEO Ativo & Indexável
          </span>
        </div>

        <div className="p-3 bg-surface-warm rounded-sm border border-borderSoft space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-ink">
            <span><strong>Arquivo sitemap público:</strong> /sitemap.xml</span>
            <span className="text-emerald-700 font-bold">200 OK</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-ink">
            <span><strong>Arquivo robots público:</strong> /robots.txt</span>
            <span className="text-emerald-700 font-bold">Permitido para Googlebot</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => downloadSitemapXml(products, collections)}
            className="h-9 px-4 rounded-sm bg-primary hover:bg-primary-pressed text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Baixar sitemap.xml Atualizado</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const xml = generateSitemapXml(products, collections);
              navigator.clipboard.writeText(xml);
              alert('XML do Sitemap copiado para a área de transferência!');
            }}
            className="h-9 px-4 rounded-sm bg-surface-warm hover:bg-black/[0.05] text-ink font-semibold text-xs border border-borderSoft flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-ink-muted" />
            <span>Copiar XML Completo</span>
          </button>

          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline font-medium ml-auto"
          >
            Abrir /sitemap.xml ↗
          </a>
        </div>
      </div>
    </div>
  );
};
