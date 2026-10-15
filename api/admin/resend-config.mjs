import { json, readBody, requireAdmin } from '../../server/nowpayments.mjs';

const RESEND_SMTP_HOST = 'smtp.resend.com';
const RESEND_SMTP_PORT = 465;

const getProjectRef = () => {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return '';
  }
};

const getManagementHeaders = () => {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    const error = new Error('A integração do servidor com o Supabase ainda não foi habilitada.');
    error.status = 503;
    throw error;
  }
  return { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
};

const authConfigUrl = () => {
  const projectRef = getProjectRef();
  if (!projectRef) {
    const error = new Error('O projeto Supabase não foi identificado no servidor.');
    error.status = 503;
    throw error;
  }
  return `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
};

const readAuthConfig = async () => {
  const response = await fetch(authConfigUrl(), { headers: getManagementHeaders() });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Não foi possível consultar o serviço de e-mail.');
    error.status = response.status;
    throw error;
  }
  return payload;
};

const publicConfig = config => ({
  configured: config.smtp_host === RESEND_SMTP_HOST && config.smtp_user === 'resend' && Boolean(config.smtp_pass),
  senderEmail: config.smtp_admin_email || '',
  senderName: config.smtp_sender_name || 'GlobalDOCS',
  otpLength: Number(config.mailer_otp_length || 6),
  otpExpiresIn: Number(config.mailer_otp_exp || 600),
});

const otpTemplate = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111827">
  <div style="font-size:20px;font-weight:700;margin-bottom:24px">GlobalDOCS</div>
  <h2 style="font-size:22px;margin:0 0 12px">Seu código de acesso</h2>
  <p style="font-size:14px;line-height:1.6;color:#4b5563">Use o código abaixo para criar ou acessar sua conta. Não compartilhe este código.</p>
  <div style="margin:24px 0;padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;text-align:center;font-size:30px;font-weight:700;letter-spacing:8px">{{ .Token }}</div>
  <p style="font-size:12px;line-height:1.6;color:#6b7280">O código expira em 10 minutos. Se você não solicitou este acesso, ignore esta mensagem.</p>
</div>`;

export default async function handler(request, response) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return json(response, 401, { error: 'Sessão administrativa inválida.' });

    if (request.method === 'GET') {
      return json(response, 200, publicConfig(await readAuthConfig()));
    }

    if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });
    const body = readBody(request);
    const apiKey = String(body.apiKey || '').trim();

    if (body.action === 'test') {
      if (!apiKey) return json(response, 400, { error: 'Informe novamente a API Key para realizar o teste.' });
      const resendResponse = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const result = await resendResponse.json().catch(() => ({}));
      if (!resendResponse.ok) {
        return json(response, 400, { error: result.message || 'A Resend recusou essa API Key.' });
      }
      const verifiedDomains = Array.isArray(result.data)
        ? result.data.filter(domain => domain.status === 'verified').length
        : 0;
      return json(response, 200, {
        success: true,
        message: verifiedDomains > 0
          ? `Credencial válida. ${verifiedDomains} domínio(s) verificado(s) disponível(is).`
          : 'Credencial válida, mas ainda não há domínio verificado na Resend.',
      });
    }

    const senderEmail = String(body.senderEmail || '').trim().toLowerCase();
    const senderName = String(body.senderName || 'GlobalDOCS').trim();
    if (!apiKey) return json(response, 400, { error: 'Informe a API Key da Resend para salvar a configuração.' });
    if (!/^\S+@\S+\.\S+$/.test(senderEmail)) return json(response, 400, { error: 'Informe um e-mail remetente válido.' });
    if (!senderName) return json(response, 400, { error: 'Informe o nome do remetente.' });

    const resendResponse = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const resendPayload = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      return json(response, 400, { error: resendPayload.message || 'A Resend recusou essa API Key.' });
    }

    const update = {
      external_email_enabled: true,
      smtp_admin_email: senderEmail,
      smtp_host: RESEND_SMTP_HOST,
      smtp_port: RESEND_SMTP_PORT,
      smtp_user: 'resend',
      smtp_pass: apiKey,
      smtp_sender_name: senderName,
      mailer_otp_exp: 600,
      mailer_otp_length: 6,
      mailer_subjects_confirmation: 'Seu código de acesso à GlobalDOCS',
      mailer_subjects_magic_link: 'Seu código de acesso à GlobalDOCS',
      mailer_templates_confirmation_content: otpTemplate,
      mailer_templates_magic_link_content: otpTemplate,
    };
    const updateResponse = await fetch(authConfigUrl(), {
      method: 'PATCH',
      headers: getManagementHeaders(),
      body: JSON.stringify(update),
    });
    const updatedConfig = await updateResponse.json().catch(() => ({}));
    if (!updateResponse.ok) {
      return json(response, updateResponse.status, { error: updatedConfig.message || 'Não foi possível ativar a Resend no Supabase.' });
    }

    return json(response, 200, {
      success: true,
      ...publicConfig(updatedConfig),
      message: 'Resend configurada como serviço de envio dos códigos de acesso.',
    });
  } catch (error) {
    return json(response, error.status || 500, { error: error.message || 'Falha ao configurar a Resend.' });
  }
}
