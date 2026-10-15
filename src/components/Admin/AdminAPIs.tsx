import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Key, 
  Cpu, 
  CreditCard, 
  Save, 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  Sparkles,
  MailCheck,
  LoaderCircle
} from 'lucide-react';

import { GATEWAY_LOGOS } from '../../utils/gatewayLogos';
import { supabase } from '../../lib/supabase';

// Logos oficiais vetorizadas sem bordas (otimizadas para modo claro)
const API_LOGOS = {
  gemini: `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M11.04 19.5c.37-2.83 1.6-5.18 3.73-7.05 2.13-1.87 4.73-2.9 7.73-3.09-3-.19-5.6-1.22-7.73-3.09-2.13-1.87-3.36-4.22-3.73-7.05-.37 2.83-1.6 5.18-3.73 7.05-2.13 1.87-4.73 2.9-7.73 3.09 3 .19 5.6 1.22 7.73 3.09 2.13 1.87 3.36 4.22 3.73 7.05z" fill="url(#gem_g)"/><defs><linearGradient id="gem_g" x1="1" y1="1" x2="23" y2="23" gradientUnits="userSpaceOnUse"><stop stop-color="#1BA1E3"/><stop offset="0.5" stop-color="#5B68DF"/><stop offset="1" stop-color="#DE51A8"/></linearGradient></defs></svg>'
  )}`,
  openai: 'https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/openai/light.svg',
  discord: 'https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/discord/default.svg',
  telegram: 'https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/telegram/default.svg',
  google: 'https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/google/default.svg',
  cloudflare: 'https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/cloudflare/default.svg',
  resend: 'https://resend.com/static/logo-black-square.png',
  mercadopago: GATEWAY_LOGOS.mercadopago,
  stripe: GATEWAY_LOGOS.stripe,
  pix: GATEWAY_LOGOS.pix,
  efi: GATEWAY_LOGOS.efi,
  asaas: GATEWAY_LOGOS.asaas,
  usdt: GATEWAY_LOGOS.usdt
};

interface APISettings {
  // Ferramentas
  geminiApiKey: string;
  openaiApiKey: string;
  aiDefaultModel: string;
  aiAutoSEO: boolean;
  
  googleIndexingApiKey: string;
  googleAutoPing: boolean;

  discordWebhookUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  notifySalesWebhook: boolean;

  cloudflareSiteKey: string;
  cloudflareSecretKey: string;

  // Gateways
  mercadopagoPublicKey: string;
  mercadopagoAccessToken: string;
  mercadopagoSandbox: boolean;
  mercadopagoEnabled: boolean;

  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeSandbox: boolean;
  stripeEnabled: boolean;

  efiClientId: string;
  efiClientSecret: string;
  efiPixKey: string;
  efiEnabled: boolean;

  asaasApiKey: string;
  asaasSandbox: boolean;
  asaasEnabled: boolean;

  cryptoUsdtWallet: string;
  cryptoNetwork: string;
  cryptoEnabled: boolean;
}

const DEFAULT_API_SETTINGS: APISettings = {
  geminiApiKey: '',
  openaiApiKey: '',
  aiDefaultModel: 'gemini-1.5-flash',
  aiAutoSEO: true,

  googleIndexingApiKey: '',
  googleAutoPing: true,

  discordWebhookUrl: '',
  telegramBotToken: '',
  telegramChatId: '',
  notifySalesWebhook: true,

  cloudflareSiteKey: '',
  cloudflareSecretKey: '',

  mercadopagoPublicKey: '',
  mercadopagoAccessToken: '',
  mercadopagoSandbox: false,
  mercadopagoEnabled: false,

  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  stripeSandbox: false,
  stripeEnabled: false,

  efiClientId: '',
  efiClientSecret: '',
  efiPixKey: '',
  efiEnabled: false,

  asaasApiKey: '',
  asaasSandbox: false,
  asaasEnabled: false,

  cryptoUsdtWallet: '',
  cryptoNetwork: 'TRC-20',
  cryptoEnabled: false,
};

// Componente para renderizar a logo de marca sem borda
const BrandLogoImg: React.FC<{ src: string; alt: string; size?: string }> = ({ 
  src, 
  alt, 
  size = 'w-7 h-7 sm:w-8 sm:h-8' 
}) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${size} object-contain shrink-0 select-none`}
      style={{ border: 'none', outline: 'none' }}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLElement).style.display = 'none';
      }}
    />
  );
};

export const AdminAPIs: React.FC = () => {
  const { showToast } = useStore();
  const [subTab, setSubTab] = useState<'tools' | 'gateways'>('tools');

  const [config, setConfig] = useState<APISettings>(DEFAULT_API_SETTINGS);

  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [nowPayments, setNowPayments] = useState({
    enabled: false,
    sandbox: true,
    payCurrency: 'usdttrc20',
    hasApiKey: false,
    apiKeyHint: '',
    hasIpnSecret: false,
  });
  const [nowPaymentsApiKey, setNowPaymentsApiKey] = useState('');
  const [nowPaymentsIpnSecret, setNowPaymentsIpnSecret] = useState('');
  const [resend, setResend] = useState({
    configured: false,
    senderEmail: '',
    senderName: 'GlobalDOCS',
    otpLength: 6,
    otpExpiresIn: 600,
  });
  const [resendApiKey, setResendApiKey] = useState('');
  const [savingResend, setSavingResend] = useState(false);

  useEffect(() => {
    void supabase.from('integration_settings').select('data').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (!error && data?.data) setConfig({ ...DEFAULT_API_SETTINGS, ...(data.data as Partial<APISettings>) });
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      const response = await fetch('/api/admin/nowpayments-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setNowPayments(await response.json());

      const resendResponse = await fetch('/api/admin/resend-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resendResponse.ok) setResend(await resendResponse.json());
    });
  }, []);

  const handleSaveResend = async () => {
    setSavingResend(true);
    setTestResult(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sua sessão administrativa expirou.');
      const response = await fetch('/api/admin/resend-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          apiKey: resendApiKey,
          senderEmail: resend.senderEmail,
          senderName: resend.senderName,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao configurar a Resend.');
      setResend(result);
      setResendApiKey('');
      setTestResult({ id: 'resend', success: true, message: result.message });
      showToast('Resend ativada para os códigos de acesso!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao configurar a Resend.';
      setTestResult({ id: 'resend', success: false, message });
      showToast(message, 'error');
    } finally {
      setSavingResend(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      cryptoUsdtWallet: _legacyWallet,
      cryptoNetwork: _legacyNetwork,
      cryptoEnabled: _legacyEnabled,
      ...genericConfig
    } = config;
    const { error } = await supabase.from('integration_settings').update({ data: genericConfig }).eq('id', 1);
    if (error) return showToast(`Erro ao salvar integrações: ${error.message}`, 'error');

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return showToast('Sua sessão administrativa expirou. Entre novamente.', 'error');

    const response = await fetch('/api/admin/nowpayments-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        apiKey: nowPaymentsApiKey,
        ipnSecret: nowPaymentsIpnSecret,
        enabled: nowPayments.enabled,
        sandbox: nowPayments.sandbox,
        payCurrency: nowPayments.payCurrency,
      }),
    });
    const result = await response.json();
    if (!response.ok) return showToast(result.error || 'Erro ao salvar NOWPayments.', 'error');

    setNowPayments(result);
    setNowPaymentsApiKey('');
    setNowPaymentsIpnSecret('');
    showToast('Configurações e credenciais da NOWPayments salvas com segurança!');
  };

  const handleTestConnection = async (apiId: string) => {
    if (apiId === 'resend') {
      setTestingConnection(apiId);
      setTestResult(null);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('Sua sessão administrativa expirou.');
        const response = await fetch('/api/admin/resend-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'test', apiKey: resendApiKey }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Falha ao testar a Resend.');
        setTestResult({ id: apiId, success: true, message: result.message });
        showToast('Credencial da Resend validada!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao testar a Resend.';
        setTestResult({ id: apiId, success: false, message });
        showToast(message, 'error');
      } finally {
        setTestingConnection(null);
      }
      return;
    }

    if (apiId === 'nowpayments') {
      setTestingConnection(apiId);
      setTestResult(null);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('Sua sessão administrativa expirou.');
        const response = await fetch('/api/admin/nowpayments-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            action: 'test',
            apiKey: nowPaymentsApiKey,
            sandbox: nowPayments.sandbox,
            payCurrency: nowPayments.payCurrency,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Falha ao testar a NOWPayments.');
        setTestResult({ id: apiId, success: true, message: result.message });
        showToast('Conexão com a NOWPayments validada!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao testar a NOWPayments.';
        setTestResult({ id: apiId, success: false, message });
        showToast(message, 'error');
      } finally {
        setTestingConnection(null);
      }
      return;
    }

    setTestingConnection(null);
    setTestResult({ id: apiId, success: false, message: 'Teste real requer uma função segura no servidor e ainda não está configurado.' });
    showToast('A credencial pode ser salva, mas não será simulada como validada.', 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      
      {/* Header da Seção de APIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-borderSoft">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <span>Gerenciador de APIs & Integrações</span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Conecte suas chaves de inteligência artificial, webhooks, ferramentas de busca e gateways de pagamento
          </p>
        </div>

        {/* Submenu Seletor (Ferramentas vs Gateways) */}
        <div className="flex items-center p-1 bg-surface-warm rounded-lg border border-borderSoft shrink-0">
          <button
            type="button"
            onClick={() => { setSubTab('tools'); setTestResult(null); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'tools'
                ? 'bg-surface text-ink shadow-xs border border-borderSoft'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ferramentas</span>
          </button>

          <button
            type="button"
            onClick={() => { setSubTab('gateways'); setTestResult(null); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'gateways'
                ? 'bg-surface text-ink shadow-xs border border-borderSoft'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gateways</span>
          </button>
        </div>
      </div>

      {/* Formulário Geral de Configuração de APIs */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* ========================================================
            SUBMENU 1: FERRAMENTAS & SERVIÇOS
        ======================================================== */}
        {subTab === 'tools' && (
          <div className="space-y-5 animate-fadeIn">

            {/* Resend: envio dos códigos de acesso da área do cliente */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3 min-w-0">
                  <BrandLogoImg src={API_LOGOS.resend} alt="Resend" size="w-9 h-9 sm:w-10 sm:h-10 rounded-lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-ink">Resend — E-mails de Acesso</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                        resend.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {resend.configured && <Check className="w-3 h-3" aria-hidden="true" />}
                        {resend.configured ? 'Configurada' : 'Não configurada'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-ink-muted">Envia o código temporário usado para criar e acessar a conta do cliente.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestConnection('resend')}
                  disabled={testingConnection === 'resend' || !resendApiKey.trim()}
                  className="min-h-9 px-3 rounded-md bg-surface-warm hover:bg-black/[0.05] border border-borderSoft font-semibold text-ink text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection === 'resend' ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>{testingConnection === 'resend' ? 'Testando...' : 'Testar credencial'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="resendApiKey" className="block font-medium text-ink mb-1">API Key da Resend</label>
                  <input
                    id="resendApiKey"
                    type="password"
                    autoComplete="new-password"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder={resend.configured ? 'Configurada — informe uma nova chave somente para atualizar' : 're_...'}
                    className="w-full min-h-10 px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                    aria-describedby="resend-key-help"
                  />
                  <p id="resend-key-help" className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">A chave é enviada diretamente ao servidor e nunca é retornada ao navegador.</p>
                </div>

                <div>
                  <label htmlFor="resendSenderEmail" className="block font-medium text-ink mb-1">E-mail remetente verificado</label>
                  <input
                    id="resendSenderEmail"
                    type="email"
                    autoComplete="email"
                    value={resend.senderEmail}
                    onChange={(e) => setResend(value => ({ ...value, senderEmail: e.target.value }))}
                    placeholder="acesso@seudominio.com"
                    className="w-full min-h-10 px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink text-xs focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <div>
                  <label htmlFor="resendSenderName" className="block font-medium text-ink mb-1">Nome do remetente</label>
                  <input
                    id="resendSenderName"
                    type="text"
                    value={resend.senderName}
                    onChange={(e) => setResend(value => ({ ...value, senderName: e.target.value }))}
                    placeholder="GlobalDOCS"
                    className="w-full min-h-10 px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink text-xs focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-900 leading-relaxed">
                <div className="flex items-start gap-2">
                  <MailCheck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <p>Use um remetente pertencente a um domínio já verificado na Resend. O código terá {resend.otpLength} dígitos e validade de {Math.round(resend.otpExpiresIn / 60)} minutos.</p>
                </div>
                <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="min-h-9 inline-flex items-center justify-center px-3 rounded-md border border-blue-200 bg-white font-semibold text-blue-900 hover:bg-blue-100 shrink-0">Ver domínios</a>
              </div>

              {testResult?.id === 'resend' && (
                <div role={testResult.success ? 'status' : 'alert'} aria-live="polite" className={`p-3 rounded-md border text-xs flex items-start gap-2 ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`} aria-hidden="true" />
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => void handleSaveResend()}
                  disabled={savingResend || !resendApiKey.trim() || !resend.senderEmail.trim() || !resend.senderName.trim()}
                  className="min-h-10 px-4 rounded-md bg-primary hover:bg-primary-pressed text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingResend ? <LoaderCircle className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>{savingResend ? 'Ativando...' : resend.configured ? 'Atualizar Resend' : 'Salvar e Ativar'}</span>
                </button>
              </div>
            </div>
            
            {/* Bloco 1: Google Gemini & OpenAI (Logos sem bordas) */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <BrandLogoImg src={API_LOGOS.gemini} alt="Google Gemini" />
                    <BrandLogoImg src={API_LOGOS.openai} alt="OpenAI" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-ink">Inteligência Artificial (Gemini & OpenAI)</h3>
                    <p className="text-[11px] text-ink-muted">Geração automática de textos, tags e meta descrições para produtos e serviços</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestConnection('ai')}
                  disabled={testingConnection === 'ai'}
                  className="px-3 py-1.5 rounded-md bg-surface-warm hover:bg-black/[0.05] border border-borderSoft font-semibold text-ink text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection === 'ai' ? 'animate-spin' : ''}`} />
                  <span>{testingConnection === 'ai' ? 'Testando...' : 'Testar Conexão'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <BrandLogoImg src={API_LOGOS.gemini} alt="Gemini" size="w-3.5 h-3.5" />
                    <label className="font-medium text-ink">Google Gemini API Key</label>
                  </div>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={config.geminiApiKey}
                    onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <BrandLogoImg src={API_LOGOS.openai} alt="OpenAI" size="w-3.5 h-3.5" />
                    <label className="font-medium text-ink">OpenAI API Key (Opcional)</label>
                  </div>
                  <input
                    type="password"
                    placeholder="sk-proj-..."
                    value={config.openaiApiKey}
                    onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Modelo de IA Padrão</label>
                  <select
                    value={config.aiDefaultModel}
                    onChange={(e) => setConfig({ ...config, aiDefaultModel: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink text-xs focus:bg-white focus:border-primary cursor-pointer"
                  >
                    <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra Rápido)</option>
                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Avançado)</option>
                    <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="aiAutoSEO"
                    checked={config.aiAutoSEO}
                    onChange={(e) => setConfig({ ...config, aiAutoSEO: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                  <label htmlFor="aiAutoSEO" className="text-xs text-ink cursor-pointer font-medium">
                    Sugerir SEO e meta tags automaticamente ao cadastrar produtos
                  </label>
                </div>
              </div>
            </div>

            {/* Bloco 2: Discord & Telegram Webhooks (Logos sem bordas) */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <BrandLogoImg src={API_LOGOS.discord} alt="Discord" />
                    <BrandLogoImg src={API_LOGOS.telegram} alt="Telegram" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-ink">Webhooks & Notificações (Discord / Telegram)</h3>
                    <p className="text-[11px] text-ink-muted">Receba avisos instantâneos a cada venda confirmada ou download realizado</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestConnection('webhook')}
                  disabled={testingConnection === 'webhook'}
                  className="px-3 py-1.5 rounded-md bg-surface-warm hover:bg-black/[0.05] border border-borderSoft font-semibold text-ink text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection === 'webhook' ? 'animate-spin' : ''}`} />
                  <span>{testingConnection === 'webhook' ? 'Testando...' : 'Enviar Teste'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BrandLogoImg src={API_LOGOS.discord} alt="Discord" size="w-3.5 h-3.5" />
                    <label className="font-medium text-ink">Discord Webhook URL</label>
                  </div>
                  <input
                    type="text"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={config.discordWebhookUrl}
                    onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <BrandLogoImg src={API_LOGOS.telegram} alt="Telegram" size="w-3.5 h-3.5" />
                    <label className="font-medium text-ink">Telegram Bot Token</label>
                  </div>
                  <input
                    type="text"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWxYz"
                    value={config.telegramBotToken}
                    onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Telegram Chat ID</label>
                  <input
                    type="text"
                    placeholder="-100123456789"
                    value={config.telegramChatId}
                    onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifySalesWebhook"
                    checked={config.notifySalesWebhook}
                    onChange={(e) => setConfig({ ...config, notifySalesWebhook: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                  <label htmlFor="notifySalesWebhook" className="text-xs text-ink cursor-pointer font-medium">
                    Notificar no canal do Discord / Telegram sempre que um pagamento for aprovado
                  </label>
                </div>
              </div>
            </div>

            {/* Bloco 3: Google Search Console & Indexação (Logo Google sem borda) */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <BrandLogoImg src={API_LOGOS.google} alt="Google" />
                  <div>
                    <h3 className="font-bold text-sm text-ink">Google Indexing API & Search Console</h3>
                    <p className="text-[11px] text-ink-muted">Acelere a indexação de novas páginas de serviços e produtos no motor de busca do Google</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-ink mb-1">Google Indexing Service Account (JSON Key)</label>
                  <textarea
                    rows={2}
                    placeholder='{"type": "service_account", "project_id": "globaldocs-seo", ...}'
                    value={config.googleIndexingApiKey}
                    onChange={(e) => setConfig({ ...config, googleIndexingApiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-[11px] focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="googleAutoPing"
                    checked={config.googleAutoPing}
                    onChange={(e) => setConfig({ ...config, googleAutoPing: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                  <label htmlFor="googleAutoPing" className="text-xs text-ink cursor-pointer font-medium">
                    Disparar ping automático para Google & Bing sempre que o Sitemap for atualizado
                  </label>
                </div>
              </div>
            </div>

            {/* Bloco 4: Cloudflare Turnstile / Proteção Anti-Bot (Logo Cloudflare sem borda) */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <BrandLogoImg src={API_LOGOS.cloudflare} alt="Cloudflare" />
                  <div>
                    <h3 className="font-bold text-sm text-ink">Cloudflare Turnstile & Proteção Anti-Bot</h3>
                    <p className="text-[11px] text-ink-muted">Proteja o checkout e endpoints de consulta contra requisições automatizadas</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-ink mb-1">Site Key</label>
                  <input
                    type="text"
                    placeholder="0x4AAAAAA..."
                    value={config.cloudflareSiteKey}
                    onChange={(e) => setConfig({ ...config, cloudflareSiteKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Secret Key</label>
                  <input
                    type="password"
                    placeholder="0x4AAAAAA..."
                    value={config.cloudflareSecretKey}
                    onChange={(e) => setConfig({ ...config, cloudflareSecretKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            SUBMENU 2: GATEWAYS DE PAGAMENTO (LOGOS SEM BORDAS)
        ======================================================== */}
        {subTab === 'gateways' && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Gateway 1: Mercado Pago (Logo sem borda) */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <BrandLogoImg src={API_LOGOS.mercadopago} alt="Mercado Pago" size="w-8 h-8 sm:w-9 sm:h-9" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink">Mercado Pago</h3>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                        config.mercadopagoEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {config.mercadopagoEnabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted">Suporte nativo a Pix Instantâneo, Cartão de Crédito e Boleto Parcelado</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestConnection('mercadopago')}
                    disabled={testingConnection === 'mercadopago'}
                    className="px-3 py-1.5 rounded-md bg-surface-warm hover:bg-black/[0.05] border border-borderSoft font-semibold text-ink text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection === 'mercadopago' ? 'animate-spin' : ''}`} />
                    <span>{testingConnection === 'mercadopago' ? 'Testando...' : 'Testar Credenciais'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, mercadopagoEnabled: !config.mercadopagoEnabled })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      config.mercadopagoEnabled
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {config.mercadopagoEnabled ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-ink mb-1">Public Key</label>
                  <input
                    type="text"
                    value={config.mercadopagoPublicKey}
                    onChange={(e) => setConfig({ ...config, mercadopagoPublicKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Access Token</label>
                  <input
                    type="password"
                    value={config.mercadopagoAccessToken}
                    onChange={(e) => setConfig({ ...config, mercadopagoAccessToken: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="mpSandbox"
                    checked={config.mercadopagoSandbox}
                    onChange={(e) => setConfig({ ...config, mercadopagoSandbox: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                  <label htmlFor="mpSandbox" className="text-xs text-ink cursor-pointer font-medium">
                    Modo Sandbox (Testes de Pagamento sem cobrança real)
                  </label>
                </div>
              </div>
            </div>

            {/* Gateway 2: Stripe (Logo Stripe sem borda) */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <BrandLogoImg src={API_LOGOS.stripe} alt="Stripe" size="w-8 h-8 sm:w-9 sm:h-9" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink">Stripe</h3>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                        config.stripeEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {config.stripeEnabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted">Processamento em USD, EUR e BRL para contas LLC e clientes internacionais</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestConnection('stripe')}
                    disabled={testingConnection === 'stripe'}
                    className="px-3 py-1.5 rounded-md bg-surface-warm hover:bg-black/[0.05] border border-borderSoft font-semibold text-ink text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection === 'stripe' ? 'animate-spin' : ''}`} />
                    <span>{testingConnection === 'stripe' ? 'Testando...' : 'Testar Conexão'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, stripeEnabled: !config.stripeEnabled })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      config.stripeEnabled
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {config.stripeEnabled ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-ink mb-1">Publishable Key</label>
                  <input
                    type="text"
                    value={config.stripePublishableKey}
                    onChange={(e) => setConfig({ ...config, stripePublishableKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Secret Key</label>
                  <input
                    type="password"
                    value={config.stripeSecretKey}
                    onChange={(e) => setConfig({ ...config, stripeSecretKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-ink mb-1">Webhook Signing Secret</label>
                  <input
                    type="text"
                    placeholder="whsec_..."
                    value={config.stripeWebhookSecret}
                    onChange={(e) => setConfig({ ...config, stripeWebhookSecret: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="stripeSandbox"
                    checked={config.stripeSandbox}
                    onChange={(e) => setConfig({ ...config, stripeSandbox: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                  <label htmlFor="stripeSandbox" className="text-xs text-ink cursor-pointer font-medium">
                    Modo Teste / Sandbox
                  </label>
                </div>
              </div>
            </div>

            {/* Gateway 3: Efí Bank & Pix (Logos Efí e Pix sem bordas) */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <BrandLogoImg src={API_LOGOS.efi} alt="Efí Bank" size="w-8 h-8 sm:w-9 sm:h-9" />
                    <BrandLogoImg src={API_LOGOS.pix} alt="Pix" size="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink">Efí Bank (Gerencianet Pix)</h3>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                        config.efiEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {config.efiEnabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted">Liquidação de Pix em 5 segundos com emissão de QR Code oficial e webhook instantâneo</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestConnection('efi')}
                    disabled={testingConnection === 'efi'}
                    className="px-3 py-1.5 rounded-md bg-surface-warm hover:bg-black/[0.05] border border-borderSoft font-semibold text-ink text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection === 'efi' ? 'animate-spin' : ''}`} />
                    <span>{testingConnection === 'efi' ? 'Testando...' : 'Testar Conexão'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, efiEnabled: !config.efiEnabled })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      config.efiEnabled
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {config.efiEnabled ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-ink mb-1">Client ID</label>
                  <input
                    type="text"
                    value={config.efiClientId}
                    onChange={(e) => setConfig({ ...config, efiClientId: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={config.efiClientSecret}
                    onChange={(e) => setConfig({ ...config, efiClientSecret: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-ink mb-1">Chave Pix Cadastrada</label>
                  <input
                    type="text"
                    value={config.efiPixKey}
                    onChange={(e) => setConfig({ ...config, efiPixKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink text-xs focus:bg-white focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Gateway 4: Asaas (Logo Asaas sem borda) */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <BrandLogoImg src={API_LOGOS.asaas} alt="Asaas" size="w-8 h-8 sm:w-9 sm:h-9" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink">Asaas</h3>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                        config.asaasEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {config.asaasEnabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted">Gestão de cobranças recorrentes, assinaturas e split de pagamentos</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, asaasEnabled: !config.asaasEnabled })}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    config.asaasEnabled
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {config.asaasEnabled ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-ink mb-1">API Key do Asaas</label>
                  <input
                    type="password"
                    placeholder="$aact_..."
                    value={config.asaasApiKey}
                    onChange={(e) => setConfig({ ...config, asaasApiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="asaasSandbox"
                    checked={config.asaasSandbox}
                    onChange={(e) => setConfig({ ...config, asaasSandbox: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                  <label htmlFor="asaasSandbox" className="text-xs text-ink cursor-pointer font-medium">
                    Ambiente Sandbox (Homologação)
                  </label>
                </div>
              </div>
            </div>

            {/* Gateway 5: NOWPayments / USDT */}
            <div className="bg-surface p-5 rounded-lg border border-borderSoft shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-borderSoft">
                <div className="flex items-center gap-3">
                  <BrandLogoImg src={API_LOGOS.usdt} alt="Tether USDT" size="w-8 h-8 sm:w-9 sm:h-9" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink">NOWPayments — USDT (Tether) & Criptoativos</h3>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                        nowPayments.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {nowPayments.enabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted">Pagamentos descentralizados sem intermediários com confirmação on-chain</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleTestConnection('nowpayments')}
                    disabled={testingConnection === 'nowpayments'}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold border border-borderSoft bg-surface-warm hover:bg-black/[0.04] transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection === 'nowpayments' ? 'animate-spin' : ''}`} />
                    <span>{testingConnection === 'nowpayments' ? 'Testando...' : 'Testar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNowPayments(value => ({ ...value, enabled: !value.enabled }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      nowPayments.enabled
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {nowPayments.enabled ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-ink mb-1">API Key da NOWPayments</label>
                  <input
                    type="password"
                    autoComplete="off"
                    value={nowPaymentsApiKey}
                    onChange={(e) => setNowPaymentsApiKey(e.target.value)}
                    placeholder={nowPayments.hasApiKey ? `Configurada (${nowPayments.apiKeyHint}) — deixe vazio para manter` : 'Cole a API Key'}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">IPN Secret Key</label>
                  <input
                    type="password"
                    autoComplete="off"
                    value={nowPaymentsIpnSecret}
                    onChange={(e) => setNowPaymentsIpnSecret(e.target.value)}
                    placeholder={nowPayments.hasIpnSecret ? 'Configurado — deixe vazio para manter' : 'Cole o IPN Secret'}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink font-mono text-xs focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Rede para recebimento em USDT</label>
                  <select
                    value={nowPayments.payCurrency}
                    onChange={(e) => setNowPayments(value => ({ ...value, payCurrency: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-md text-ink text-xs focus:bg-white focus:border-primary cursor-pointer"
                  >
                    <option value="usdttrc20">TRON (USDTTRC20 — taxas baixas)</option>
                    <option value="usdtbsc">BNB Smart Chain (USDTBSC)</option>
                    <option value="usdterc20">Ethereum (USDTERC20)</option>
                    <option value="usdtmatic">Polygon (USDTMATIC)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="nowPaymentsSandbox"
                    checked={nowPayments.sandbox}
                    onChange={(e) => setNowPayments(value => ({ ...value, sandbox: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                  <label htmlFor="nowPaymentsSandbox" className="text-xs text-ink cursor-pointer font-medium">
                    Ambiente Sandbox (testes)
                  </label>
                </div>
              </div>

              <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-900 leading-relaxed">
                Configure sua carteira de recebimento na conta NOWPayments. URL de IPN: <span className="font-mono break-all">https://globaldocs.vercel.app/api/nowpayments/ipn</span>
              </div>
            </div>

          </div>
        )}

        {/* Feedback de Teste */}
        {testResult && testResult.id !== 'resend' && (
          <div
            role={testResult.success ? 'status' : 'alert'}
            aria-live="polite"
            className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 animate-fadeIn ${
            testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Botão de Salvar Alterações */}
        <div className="pt-3 flex items-center justify-between border-t border-borderSoft">
          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secrets protegidos no servidor e nunca retornados ao navegador</span>
          </div>

          <button
            type="submit"
            className="h-9 px-5 rounded-md bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Alterações de APIs</span>
          </button>
        </div>

      </form>

    </div>
  );
};
