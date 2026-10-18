import { enforceRateLimit, json, readBody, requestIdentity, supabaseAdmin } from '../../server/nowpayments.mjs';

const findUserByEmail = async email => {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find(item => item.email?.toLowerCase() === email);
    if (user || data.users.length < 1000) return user || null;
  }
  return null;
};

export default async function handler(request, response) {
  try {
    if (request.method !== 'POST') return json(response, 405, { error: 'Método não permitido.' });

    const body = readBody(request);
    const email = String(body.email || '').trim().toLowerCase();
    const token = String(body.token || '').trim();
    const identity = `${requestIdentity(request)}:${email.slice(0, 160)}`;
    if (!await enforceRateLimit('legacy-account-activation', identity, 5, 900)) {
      response.setHeader('Retry-After', '900');
      return json(response, 429, { error: 'Muitas tentativas. Aguarde alguns minutos.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || !/^tk_[a-f0-9]{48}$/i.test(token)) {
      return json(response, 401, { error: 'E-mail ou senha/token inválidos.' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .ilike('customer_email', email)
      .eq('download_token', token)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return json(response, 401, { error: 'E-mail ou senha/token inválidos.' });

    let user = await findUserByEmail(email);
    if (user) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: token,
        email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: token,
        email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
    }

    const { error: linkError } = await supabaseAdmin
      .from('orders')
      .update({ customer_user_id: user.id })
      .ilike('customer_email', email)
      .is('customer_user_id', null);
    if (linkError) throw linkError;

    return json(response, 200, { success: true });
  } catch (error) {
    console.error('[customer:legacy-activation]', { status: error.status || 500, message: error.message || 'unknown error' });
    return json(response, error.status === 413 || error.status === 415 ? error.status : 500, { error: 'Não foi possível ativar a conta.' });
  }
}
