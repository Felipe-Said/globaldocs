import { json, requireAdmin, supabaseAdmin } from '../../server/nowpayments.mjs';

const PAGE_SIZE = 1000;

async function readAllRows(table, columns, configure = query => query) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const query = configure(
      supabaseAdmin.from(table).select(columns).range(from, from + PAGE_SIZE - 1),
    );
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function readAllAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < PAGE_SIZE) return users;
  }
}

const normalizeEmail = value => String(value || '').trim().toLowerCase();

const purchasedQuantity = items => Array.isArray(items)
  ? items.reduce((sum, item) => {
      const quantity = Number(item?.quantity ?? 1);
      return sum + (Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1);
    }, 0)
  : 0;

export default async function handler(request, response) {
  try {
    if (request.method !== 'GET') return json(response, 405, { error: 'Método não permitido.' });
    const admin = await requireAdmin(request);
    if (!admin) return json(response, 401, { error: 'Sessão administrativa inválida.' });

    const [authUsers, profiles, wallets, orders, adminRows] = await Promise.all([
      readAllAuthUsers(),
      readAllRows('customer_profiles', 'user_id,email,display_name,created_at'),
      readAllRows('customer_wallets', 'user_id,balance'),
      readAllRows(
        'orders',
        'customer_user_id,customer_email,total,items,created_at',
        query => query.eq('status', 'paid'),
      ),
      readAllRows('admin_users', 'user_id'),
    ]);

    const adminIds = new Set(adminRows.map(row => row.user_id));
    const profilesById = new Map(profiles.map(profile => [profile.user_id, profile]));
    const walletsById = new Map(wallets.map(wallet => [wallet.user_id, Number(wallet.balance || 0)]));
    const customerAuthUsers = authUsers.filter(user => !adminIds.has(user.id) && user.email);
    const userIdByEmail = new Map(customerAuthUsers.map(user => [normalizeEmail(user.email), user.id]));
    const purchasesById = new Map();

    for (const order of orders) {
      const userId = order.customer_user_id || userIdByEmail.get(normalizeEmail(order.customer_email));
      if (!userId || adminIds.has(userId)) continue;
      const current = purchasesById.get(userId) || {
        totalSpent: 0,
        itemsPurchased: 0,
        paidOrders: 0,
        lastPurchaseAt: null,
      };
      current.totalSpent += Math.max(0, Number(order.total || 0));
      current.itemsPurchased += purchasedQuantity(order.items);
      current.paidOrders += 1;
      if (!current.lastPurchaseAt || new Date(order.created_at) > new Date(current.lastPurchaseAt)) {
        current.lastPurchaseAt = order.created_at;
      }
      purchasesById.set(userId, current);
    }

    const users = customerAuthUsers.map(user => {
      const profile = profilesById.get(user.id);
      const purchases = purchasesById.get(user.id);
      return {
        id: user.id,
        email: normalizeEmail(profile?.email || user.email),
        name: String(profile?.display_name || '').trim(),
        createdAt: profile?.created_at || user.created_at,
        walletBalance: walletsById.get(user.id) || 0,
        totalSpent: purchases?.totalSpent || 0,
        itemsPurchased: purchases?.itemsPurchased || 0,
        paidOrders: purchases?.paidOrders || 0,
        lastPurchaseAt: purchases?.lastPurchaseAt || null,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const summary = users.reduce((totals, user) => ({
      users: totals.users + 1,
      walletBalance: totals.walletBalance + user.walletBalance,
      totalSpent: totals.totalSpent + user.totalSpent,
      itemsPurchased: totals.itemsPurchased + user.itemsPurchased,
    }), { users: 0, walletBalance: 0, totalSpent: 0, itemsPurchased: 0 });

    return json(response, 200, { users, summary, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[admin:users]', error);
    return json(response, 500, { error: 'Não foi possível carregar os usuários cadastrados.' });
  }
}
