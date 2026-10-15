import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Banner, CartItem, Collection, Coupon, DigitalProduct, FileCategory, FileFormat,
  Order, PaymentMethod, ProductType, StoreSettings,
} from '../types';

export interface CustomerUser { id: string; email: string; name?: string; document?: string }
type Result = { success: boolean; message: string };
type NewProduct = Omit<DigitalProduct, 'id' | 'createdAt' | 'updatedAt' | 'downloadsCount'>;

interface StoreContextType {
  selectedProduct: DigitalProduct | null; setSelectedProduct: (value: DigitalProduct | null) => void;
  isCartOpen: boolean; setIsCartOpen: (value: boolean) => void;
  isCheckoutOpen: boolean; setIsCheckoutOpen: (value: boolean) => void;
  customerUser: CustomerUser | null;
  requestCustomerCode: (email: string) => Promise<Result>;
  verifyCustomerCode: (email: string, token: string) => Promise<Result>;
  refreshCustomerOrders: () => Promise<void>;
  customerLogout: () => Promise<void>;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<Result>; adminLogout: () => Promise<void>;
  products: DigitalProduct[];
  addProduct: (value: NewProduct) => Promise<void>; updateProduct: (id: string, value: Partial<DigitalProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>; toggleProductStatus: (id: string) => Promise<void>;
  collections: Collection[];
  addCollection: (value: Omit<Collection, 'id'>) => Promise<void>; updateCollection: (id: string, value: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  searchQuery: string; setSearchQuery: (value: string) => void;
  selectedCategory: FileCategory | 'all'; setSelectedCategory: (value: FileCategory | 'all') => void;
  selectedProductType: ProductType | 'all'; setSelectedProductType: (value: ProductType | 'all') => void;
  selectedCollectionId: string | 'all'; setSelectedCollectionId: (value: string | 'all') => void;
  selectedFormat: FileFormat | 'all'; setSelectedFormat: (value: FileFormat | 'all') => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'popular' | 'newest';
  setSortBy: (value: 'featured' | 'price-asc' | 'price-desc' | 'popular' | 'newest') => void;
  cart: CartItem[]; addToCart: (value: DigitalProduct) => void; removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void; clearCart: () => void;
  cartCount: number; subtotal: number; discount: number; total: number;
  appliedCoupon: Coupon | null; applyCoupon: (code: string) => Promise<Result>; removeCoupon: () => void;
  orders: Order[];
  createOrder: (value: { customerName: string; customerEmail: string; customerDocument: string; shippingAddress?: string; paymentMethod: PaymentMethod }) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  coupons: Coupon[]; addCoupon: (value: Omit<Coupon, 'usageCount'>) => Promise<void>;
  toggleCoupon: (code: string) => Promise<void>; deleteCoupon: (code: string) => Promise<void>;
  banners: Banner[]; addBanner: (value: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (id: string, value: Partial<Banner>) => Promise<void>; deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string) => Promise<void>;
  settings: StoreSettings; updateSettings: (value: Partial<StoreSettings>) => Promise<void>;
  downloadFile: (title: string, name: string, format: string, sourceUrl?: string) => void;
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'GlobalDOCS', storeTagline: '', contactEmail: 'saidlabsglobal@gmail.com',
  supportWhatsapp: '', pixKey: '', currency: 'BRL (R$)', allowGuestCheckout: false, notifyOnSale: true,
};
const DELIVERABLE_FIELDS = ['downloadFileName', 'zipFileName', 'accessLogins', 'proxyDetails', 'accessInstructions'] as const;
const StoreContext = createContext<StoreContextType | undefined>(undefined);

const productFromRow = (row: any, deliverable?: Record<string, unknown>): DigitalProduct => ({
  ...row.data, ...(deliverable || {}), id: row.id, active: row.active, isFeatured: row.featured,
  downloadsCount: Number(row.data?.downloadsCount || 0), createdAt: row.created_at, updatedAt: row.updated_at,
  unlimitedStock: row.data?.unlimitedStock !== false,
  stockQuantity: Math.max(0, Number(row.data?.stockQuantity ?? 1)),
});
const collectionFromRow = (row: any): Collection => ({ ...row.data, id: row.id, active: row.active });
const bannerFromRow = (row: any): Banner => ({ ...row.data, id: row.id, active: row.active, order: row.sort_order });
const couponFromRow = (row: any): Coupon => ({
  code: row.code, discountPercent: Number(row.discount_percent), active: row.active,
  usageCount: row.usage_count, expiresAt: row.expires_at || undefined,
});
const orderFromRow = (row: any): Order => ({
  id: row.id, customerName: row.customer_name, customerEmail: row.customer_email,
  customerDocument: row.customer_document, shippingAddress: row.shipping_address || undefined,
  items: row.items || [], total: Number(row.total), discount: Number(row.discount),
  appliedCoupon: row.applied_coupon || undefined, paymentMethod: row.payment_method,
  status: row.status, downloadToken: row.download_token, trackingCode: row.tracking_code || undefined,
  createdAt: row.created_at,
});
const splitProduct = (product: Partial<DigitalProduct>) => {
  const publicData: Record<string, unknown> = { ...product };
  const deliverable: Record<string, unknown> = {};
  for (const field of DELIVERABLE_FIELDS) {
    if (field in publicData) { deliverable[field] = publicData[field]; delete publicData[field]; }
  }
  for (const field of ['id', 'active', 'isFeatured', 'createdAt', 'updatedAt']) delete publicData[field];
  return { publicData, deliverable };
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all');
  const [selectedProductType, setSelectedProductType] = useState<ProductType | 'all'>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<FileFormat | 'all'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular' | 'newest'>('featured');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type }); window.setTimeout(() => setToast(null), 3500);
  };

  const loadStoreData = async () => {
    const [productResult, collectionResult, bannerResult, settingsResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('collections').select('*').order('created_at'),
      supabase.from('banners').select('*').order('sort_order'),
      supabase.from('store_settings').select('data').eq('id', 1).maybeSingle(),
    ]);
    if (productResult.error || collectionResult.error || bannerResult.error || settingsResult.error) {
      showToast('Não foi possível carregar os dados da loja.', 'error'); return;
    }
    setProducts((productResult.data || []).map((row: any) => productFromRow(row)));
    setCollections((collectionResult.data || []).map(collectionFromRow));
    setBanners((bannerResult.data || []).map(bannerFromRow));
    if (settingsResult.data?.data) setSettings({ ...DEFAULT_SETTINGS, ...settingsResult.data.data });
  };

  const migrateInlineBannerImages = async (rows: any[]) => {
    const inlineImages = new Map<string, Promise<string>>();
    let migratedCount = 0;

    const uploadInlineImage = (dataUrl: string, bannerId: string, target: string) => {
      const existing = inlineImages.get(dataUrl);
      if (existing) return existing;

      const upload = (async () => {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const subtype = blob.type.split('/')[1]?.split('+')[0] || 'jpg';
        const extension = subtype === 'jpeg' ? 'jpg' : subtype;
        const objectPath = `banners/${bannerId}-${target}-${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from('store-assets').upload(objectPath, blob, {
          cacheControl: '31536000',
          contentType: blob.type,
          upsert: false,
        });
        if (error) throw error;
        return supabase.storage.from('store-assets').getPublicUrl(objectPath).data.publicUrl;
      })();

      inlineImages.set(dataUrl, upload);
      return upload;
    };

    for (const row of rows) {
      const originalData = row.data || {};
      const desktopIsInline = typeof originalData.desktopImageUrl === 'string' && originalData.desktopImageUrl.startsWith('data:image/');
      const mobileIsInline = typeof originalData.mobileImageUrl === 'string' && originalData.mobileImageUrl.startsWith('data:image/');
      if (!desktopIsInline && !mobileIsInline) continue;

      try {
        const nextData = { ...originalData };
        if (desktopIsInline) nextData.desktopImageUrl = await uploadInlineImage(originalData.desktopImageUrl, row.id, 'desktop');
        if (mobileIsInline) nextData.mobileImageUrl = await uploadInlineImage(originalData.mobileImageUrl, row.id, 'mobile');

        const { error } = await supabase.from('banners').update({ data: nextData }).eq('id', row.id);
        if (error) throw error;

        migratedCount += 1;
        setBanners(value => value.map(item => item.id === row.id ? { ...item, ...nextData } : item));
      } catch (error) {
        console.error('Falha ao migrar imagem do banner para o Storage:', error);
      }
    }

    if (migratedCount > 0) showToast(`${migratedCount} banner(s) otimizado(s) no armazenamento.`);
  };

  const loadAdminData = async () => {
    const [productResult, collectionResult, bannerResult, settingsResult, deliverableResult, orderResult, couponResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('collections').select('*').order('created_at'),
      supabase.from('banners').select('*').order('sort_order'),
      supabase.from('store_settings').select('data').eq('id', 1).maybeSingle(),
      supabase.from('product_deliverables').select('product_id,data'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('coupons').select('*').order('created_at'),
    ]);

    const hasStoreError = productResult.error || collectionResult.error || bannerResult.error || settingsResult.error;
    if (hasStoreError) showToast('Alguns dados do painel não puderam ser atualizados.', 'error');

    const deliverables = new Map((deliverableResult.data || []).map((row: any) => [row.product_id, row.data]));
    if (!productResult.error) setProducts((productResult.data || []).map((row: any) => productFromRow(row, deliverables.get(row.id))));
    if (!collectionResult.error) setCollections((collectionResult.data || []).map(collectionFromRow));
    if (!bannerResult.error) {
      const bannerRows = bannerResult.data || [];
      setBanners(bannerRows.map(bannerFromRow));
      if (bannerRows.some((row: any) =>
        String(row.data?.desktopImageUrl || '').startsWith('data:image/') ||
        String(row.data?.mobileImageUrl || '').startsWith('data:image/')
      )) {
        void migrateInlineBannerImages(bannerRows);
      }
    }
    if (!settingsResult.error && settingsResult.data?.data) setSettings({ ...DEFAULT_SETTINGS, ...settingsResult.data.data });
    if (!orderResult.error) setOrders((orderResult.data || []).map(orderFromRow));
    if (!couponResult.error) setCoupons((couponResult.data || []).map(couponFromRow));
  };

  const validateAdmin = async (userId?: string) => {
    if (!userId) { setIsAdminAuthenticated(false); return false; }
    const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
    const valid = !error && Boolean(data);
    setIsAdminAuthenticated(valid);
    return valid;
  };

  const loadCustomerData = async (): Promise<CustomerUser | null> => {
    const { data: profile, error: profileError } = await supabase.rpc('claim_customer_orders');
    if (profileError || !profile) {
      setCustomerUser(null);
      setOrders([]);
      return null;
    }

    const { data: customerOrders, error: ordersError } = await supabase.rpc('get_my_orders');
    if (ordersError) {
      setOrders([]);
      showToast('Sua conta foi acessada, mas os pedidos não puderam ser carregados.', 'error');
    } else {
      setOrders((customerOrders || []).map(orderFromRow));
    }

    const user: CustomerUser = {
      id: String(profile.id),
      email: String(profile.email),
      name: profile.name || undefined,
      document: profile.document || undefined,
    };
    setCustomerUser(user);
    return user;
  };

  const hydrateSession = async (userId: string) => {
    if (await validateAdmin(userId)) {
      setCustomerUser(null);
      await loadAdminData();
      return;
    }
    await Promise.all([loadStoreData(), loadCustomerData()]);
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        window.setTimeout(() => {
          if (session?.user.id) void hydrateSession(session.user.id);
          else void loadStoreData();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setIsAdminAuthenticated(false);
        setCustomerUser(null);
        setOrders([]);
        setCoupons([]);
        void loadStoreData();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const adminLogin = async (email: string, password: string): Promise<Result> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user || !(await validateAdmin(data.user.id))) {
      if (data.user) await supabase.auth.signOut();
      return { success: false, message: 'E-mail ou senha inválidos, ou usuário sem permissão administrativa.' };
    }
    await loadAdminData();
    showToast('Acesso administrativo autenticado.');
    return { success: true, message: 'Autenticado com sucesso.' };
  };
  const adminLogout = async () => {
    await supabase.auth.signOut(); setIsAdminAuthenticated(false); setOrders([]); setCoupons([]);
    await loadStoreData(); showToast('Sessão administrativa encerrada.', 'info');
  };

  const requestCustomerCode = async (email: string): Promise<Result> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return { success: false, message: 'Informe um e-mail válido.' };
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    if (error) {
      const limited = /rate|seconds|limit/i.test(error.message);
      return {
        success: false,
        message: limited
          ? 'Aguarde um minuto antes de solicitar um novo código.'
          : 'Não foi possível enviar o código. Confira o e-mail e tente novamente.',
      };
    }
    return { success: true, message: 'Código enviado. Verifique sua caixa de entrada.' };
  };

  const verifyCustomerCode = async (email: string, token: string): Promise<Result> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = token.replace(/\s/g, '');
    if (!normalizedEmail || !normalizedToken) return { success: false, message: 'Informe o e-mail e o código recebido.' };
    const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: normalizedToken, type: 'email' });
    if (error || !data.user) {
      return { success: false, message: 'Código inválido ou expirado. Solicite um novo código e tente novamente.' };
    }
    const user = await loadCustomerData();
    if (!user) return { success: false, message: 'A conta foi validada, mas não foi possível carregar seu perfil.' };
    showToast('Conta acessada com segurança.');
    return { success: true, message: 'Conta acessada com sucesso.' };
  };

  const refreshCustomerOrders = async () => { if (customerUser) await loadCustomerData(); };
  const customerLogout = async () => {
    await supabase.auth.signOut();
    setCustomerUser(null);
    setOrders([]);
    showToast('Sessão encerrada.', 'info');
  };

  const addProduct = async (product: NewProduct) => {
    const { publicData, deliverable } = splitProduct({ ...product, downloadsCount: 0 });
    const { data, error } = await supabase.from('products').insert({ data: publicData, active: product.active, featured: Boolean(product.isFeatured) }).select('*').single();
    if (error || !data) return showToast(error?.message || 'Erro ao cadastrar produto.', 'error');
    if (Object.keys(deliverable).length) await supabase.from('product_deliverables').upsert({ product_id: data.id, data: deliverable });
    setProducts(value => [productFromRow(data, deliverable), ...value]);
    showToast(`"${product.title}" cadastrado com sucesso!`);
  };
  const updateProduct = async (id: string, updates: Partial<DigitalProduct>) => {
    const current = products.find(product => product.id === id); if (!current) return;
    const merged = { ...current, ...updates }; const { publicData, deliverable } = splitProduct(merged);
    const [{ error }, { error: deliverableError }] = await Promise.all([
      supabase.from('products').update({ data: publicData, active: merged.active, featured: Boolean(merged.isFeatured) }).eq('id', id),
      supabase.from('product_deliverables').upsert({ product_id: id, data: deliverable }),
    ]);
    if (error || deliverableError) return showToast(error?.message || deliverableError?.message || 'Erro ao atualizar item.', 'error');
    setProducts(value => value.map(item => item.id === id ? merged : item));
    showToast('Item atualizado.');
  };
  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return showToast(error.message, 'error'); setProducts(value => value.filter(item => item.id !== id)); showToast('Item removido.', 'info');
  };
  const toggleProductStatus = async (id: string) => { const item = products.find(value => value.id === id); if (item) await updateProduct(id, { active: !item.active }); };

  const addCollection = async (collection: Omit<Collection, 'id'>) => {
    const { active, ...data } = collection; const { data: row, error } = await supabase.from('collections').insert({ data, active }).select('*').single();
    if (error || !row) return showToast(error?.message || 'Erro ao criar coleção.', 'error');
    setCollections(value => [...value, collectionFromRow(row)]);
    showToast(`Coleção "${collection.name}" criada.`);
  };
  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    const current = collections.find(value => value.id === id); if (!current) return;
    const merged = { ...current, ...updates }; const { id: _id, active, ...data } = merged;
    const { error } = await supabase.from('collections').update({ data, active }).eq('id', id);
    if (error) return showToast(error.message, 'error');
    setCollections(value => value.map(item => item.id === id ? merged : item));
    showToast('Coleção atualizada.');
  };
  const deleteCollection = async (id: string) => {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) return showToast(error.message, 'error'); setCollections(value => value.filter(item => item.id !== id)); showToast('Coleção removida.', 'info');
  };

  const addToCart = (product: DigitalProduct) => setCart(value => value.some(item => item.product.id === product.id) ? value : [...value, { product, quantity: 1 }]);
  const removeFromCart = (id: string) => setCart(value => value.filter(item => item.product.id !== id));
  const updateCartQuantity = (id: string, quantity: number) => quantity <= 0
    ? removeFromCart(id)
    : setCart(value => value.map(item => item.product.id === id
      ? {
          ...item,
          quantity: item.product.unlimitedStock
            ? quantity
            : Math.min(quantity, Math.max(1, item.product.stockQuantity)),
        }
      : item));
  const clearCart = () => { setCart([]); setAppliedCoupon(null); };
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
  const discount = appliedCoupon ? subtotal * appliedCoupon.discountPercent / 100 : 0;
  const total = Math.max(0, subtotal - discount);
  const applyCoupon = async (code: string): Promise<Result> => {
    const { data, error } = await supabase.rpc('validate_coupon', { p_code: code.trim() });
    if (error || !data) return { success: false, message: 'Cupom inválido, expirado ou inativo.' };
    const coupon = data as Coupon; setAppliedCoupon(coupon); showToast(`Cupom ${coupon.code} aplicado.`);
    return { success: true, message: `Desconto de ${coupon.discountPercent}% aplicado.` };
  };
  const removeCoupon = () => { setAppliedCoupon(null); showToast('Cupom removido.', 'info'); };

  const createOrder: StoreContextType['createOrder'] = async value => {
    const { data, error } = await supabase.rpc('create_order', {
      p_customer_name: value.customerName, p_customer_email: value.customerEmail,
      p_customer_document: value.customerDocument, p_shipping_address: value.shippingAddress || '',
      p_payment_method: value.paymentMethod, p_cart: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
      p_coupon_code: appliedCoupon?.code || null,
    });
    if (error || !data) { showToast(error?.message || 'Não foi possível criar o pedido.', 'error'); return null; }
    const order = orderFromRow(data); setOrders(previous => [order, ...previous]);
    setCustomerUser(previous => previous ? {
      ...previous,
      name: order.customerName,
      document: order.customerDocument,
    } : previous);
    if (value.paymentMethod !== 'crypto') {
      clearCart();
      setIsCheckoutOpen(false);
    }
    showToast('Pedido criado. Aguarde a confirmação do pagamento.'); return order;
  };
  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) return showToast(error.message, 'error');
    if (status === 'paid') await loadAdminData();
    else setOrders(value => value.map(item => item.id === id ? { ...item, status } : item));
    showToast(`Status do pedido ${id} atualizado.`);
  };

  const addCoupon = async (coupon: Omit<Coupon, 'usageCount'>) => {
    const { data, error } = await supabase.from('coupons').insert({ code: coupon.code.toUpperCase().trim(), discount_percent: coupon.discountPercent, active: coupon.active, expires_at: coupon.expiresAt || null }).select('*').single();
    if (error || !data) return showToast(error?.message || 'Erro ao criar cupom.', 'error');
    setCoupons(value => [...value, couponFromRow(data)]);
    showToast('Cupom criado.');
  };
  const toggleCoupon = async (code: string) => { const item = coupons.find(value => value.code === code); if (!item) return; const { error } = await supabase.from('coupons').update({ active: !item.active }).eq('code', code); if (error) return showToast(error.message, 'error'); setCoupons(value => value.map(coupon => coupon.code === code ? { ...coupon, active: !coupon.active } : coupon)); };
  const deleteCoupon = async (code: string) => { const { error } = await supabase.from('coupons').delete().eq('code', code); if (error) return showToast(error.message, 'error'); setCoupons(value => value.filter(item => item.code !== code)); showToast('Cupom excluído.', 'info'); };

  const addBanner = async (banner: Omit<Banner, 'id'>) => { const { active, order, ...data } = banner; const { data: row, error } = await supabase.from('banners').insert({ data, active, sort_order: order }).select('*').single(); if (error || !row) return showToast(error?.message || 'Erro ao adicionar banner.', 'error'); setBanners(value => [...value, bannerFromRow(row)].sort((a, b) => a.order - b.order)); showToast('Banner adicionado.'); };
  const updateBanner = async (id: string, updates: Partial<Banner>) => { const current = banners.find(value => value.id === id); if (!current) return; const merged = { ...current, ...updates }; const { id: _id, active, order, ...data } = merged; const { error } = await supabase.from('banners').update({ data, active, sort_order: order }).eq('id', id); if (error) return showToast(error.message, 'error'); setBanners(value => value.map(item => item.id === id ? merged : item).sort((a, b) => a.order - b.order)); showToast('Banner atualizado.'); };
  const deleteBanner = async (id: string) => { const { error } = await supabase.from('banners').delete().eq('id', id); if (error) return showToast(error.message, 'error'); setBanners(value => value.filter(item => item.id !== id)); showToast('Banner removido.', 'info'); };
  const toggleBannerStatus = async (id: string) => { const item = banners.find(value => value.id === id); if (item) await updateBanner(id, { active: !item.active }); };
  const updateSettings = async (updates: Partial<StoreSettings>) => { const next = { ...settings, ...updates }; const { error } = await supabase.from('store_settings').update({ data: next }).eq('id', 1); if (error) return showToast(error.message, 'error'); setSettings(next); showToast('Configurações salvas.'); };
  const downloadFile = (_title: string, _name: string, _format: string, sourceUrl?: string) => { if (sourceUrl && /^https:\/\//i.test(sourceUrl)) { window.open(sourceUrl, '_blank', 'noopener,noreferrer'); return; } showToast('Nenhum arquivo real foi vinculado a este produto.', 'error'); };

  return <StoreContext.Provider value={{
    selectedProduct, setSelectedProduct, isCartOpen, setIsCartOpen, isCheckoutOpen, setIsCheckoutOpen,
    customerUser, requestCustomerCode, verifyCustomerCode, refreshCustomerOrders, customerLogout,
    isAdminAuthenticated, adminLogin, adminLogout,
    products, addProduct, updateProduct, deleteProduct, toggleProductStatus,
    collections, addCollection, updateCollection, deleteCollection,
    searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, selectedProductType, setSelectedProductType,
    selectedCollectionId, setSelectedCollectionId, selectedFormat, setSelectedFormat, sortBy, setSortBy,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartCount: cart.length,
    subtotal, discount, total, appliedCoupon, applyCoupon, removeCoupon,
    orders, createOrder, updateOrderStatus, coupons, addCoupon, toggleCoupon, deleteCoupon,
    banners, addBanner, updateBanner, deleteBanner, toggleBannerStatus,
    settings, updateSettings, downloadFile, toast, showToast,
  }}>{children}</StoreContext.Provider>;
};

export const useStore = () => { const value = useContext(StoreContext); if (!value) throw new Error('useStore must be used within a StoreProvider'); return value; };
