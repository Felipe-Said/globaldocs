import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  DigitalProduct, 
  CartItem, 
  Order, 
  Coupon, 
  StoreSettings, 
  FileCategory, 
  FileFormat,
  ProductType,
  Collection,
  PaymentMethod,
  Banner 
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_COUPONS, 
  INITIAL_SETTINGS,
  INITIAL_COLLECTIONS,
  INITIAL_BANNERS
} from '../data/mockData';

export interface CustomerUser {
  email: string;
  name?: string;
  document?: string;
}

interface StoreContextType {
  // Navigation & Modals
  selectedProduct: DigitalProduct | null;
  setSelectedProduct: (product: DigitalProduct | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;

  // Customer Auth (Área do Cliente • Meus Downloads)
  customerUser: CustomerUser | null;
  customerLogin: (email: string, passwordOrOrderCode?: string) => { success: boolean; message: string };
  customerLogout: () => void;

  // Admin Security & Auth
  isAdminAuthenticated: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;

  // Products
  products: DigitalProduct[];
  addProduct: (product: Omit<DigitalProduct, 'id' | 'createdAt' | 'updatedAt' | 'downloadsCount'>) => void;
  updateProduct: (id: string, updates: Partial<DigitalProduct>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStatus: (id: string) => void;

  // Collections
  collections: Collection[];
  addCollection: (col: Omit<Collection, 'id'>) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: FileCategory | 'all';
  setSelectedCategory: (cat: FileCategory | 'all') => void;
  selectedProductType: ProductType | 'all';
  setSelectedProductType: (type: ProductType | 'all') => void;
  selectedCollectionId: string | 'all';
  setSelectedCollectionId: (colId: string | 'all') => void;
  selectedFormat: FileFormat | 'all';
  setSelectedFormat: (fmt: FileFormat | 'all') => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'popular' | 'newest';
  setSortBy: (sort: 'featured' | 'price-asc' | 'price-desc' | 'popular' | 'newest') => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: DigitalProduct) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Orders & Checkout
  orders: Order[];
  createOrder: (orderData: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    shippingAddress?: string;
    paymentMethod: PaymentMethod;
  }) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  // Coupons
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'usageCount'>) => void;
  toggleCoupon: (code: string) => void;
  deleteCoupon: (code: string) => void;

  // Banners
  banners: Banner[];
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerStatus: (id: string) => void;

  // Store Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // File Download Action
  downloadFile: (productTitle: string, fileName: string, fileFormat: string, sampleContent?: string) => void;

  // Feedback Notification Toast
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from LocalStorage
  const [products, setProducts] = useState<DigitalProduct[]>(() => {
    const saved = localStorage.getItem('globaldocs_products_v2');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('globaldocs_collections_v2');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('globaldocs_orders_v2');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('globaldocs_coupons_v2');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('globaldocs_settings_v2');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('globaldocs_banners_v2');
    return saved ? JSON.parse(saved) : INITIAL_BANNERS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('globaldocs_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Admin Auth State (sessionStorage so it persists on reload but stays isolated)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('globaldocs_admin_auth') === 'true';
  });

  // Customer Auth State (Área do Cliente • Meus Downloads)
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => {
    const saved = localStorage.getItem('globaldocs_customer_auth');
    return saved ? JSON.parse(saved) : null;
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Modals & UI state
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all');
  const [selectedProductType, setSelectedProductType] = useState<ProductType | 'all'>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<FileFormat | 'all'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular' | 'newest'>('featured');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('globaldocs_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('globaldocs_collections_v2', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('globaldocs_orders_v2', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('globaldocs_coupons_v2', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('globaldocs_settings_v2', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('globaldocs_banners_v2', JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem('globaldocs_cart', JSON.stringify(cart));
  }, [cart]);

  // Admin Auth Functions
  const adminLogin = (password: string) => {
    if (password === settings.adminPassword || password === 'admin') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('globaldocs_admin_auth', 'true');
      showToast('Acesso de Administrador autenticado com sucesso!');
      return true;
    } else {
      showToast('Senha de administrador incorreta.', 'error');
      return false;
    }
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('globaldocs_admin_auth');
    showToast('Sessão administrativa encerrada.', 'info');
  };

  // Customer Auth Functions (Área do Cliente • Meus Downloads)
  const customerLogin = (email: string, passwordOrOrderCode?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Por favor, informe o e-mail cadastrado na compra.' };
    }

    // Busca pedidos vinculados ao e-mail
    const matchedOrders = orders.filter(o => o.customerEmail.toLowerCase().trim() === cleanEmail);

    if (matchedOrders.length === 0) {
      // Se não encontrou por e-mail, verificar se informou um ID de pedido válido (Ex: ORD-8921)
      if (passwordOrOrderCode && passwordOrOrderCode.trim()) {
        const cleanCode = passwordOrOrderCode.trim().toUpperCase();
        const orderByCode = orders.find(o => o.id.toUpperCase() === cleanCode);
        if (orderByCode) {
          const user: CustomerUser = {
            email: orderByCode.customerEmail.toLowerCase().trim(),
            name: orderByCode.customerName,
            document: orderByCode.customerDocument,
          };
          setCustomerUser(user);
          localStorage.setItem('globaldocs_customer_auth', JSON.stringify(user));
          showToast(`Bem-vindo(a), ${user.name || user.email}! Seus downloads foram liberados.`);
          return { success: true, message: 'Autenticado com sucesso pelo número do pedido!' };
        }
      }

      return { 
        success: false, 
        message: 'Nenhum pedido encontrado para este e-mail. Utilize o mesmo e-mail cadastrado na compra.' 
      };
    }

    // Usuário autenticado
    const latestOrder = matchedOrders[0];
    const user: CustomerUser = {
      email: cleanEmail,
      name: latestOrder.customerName,
      document: latestOrder.customerDocument,
    };
    setCustomerUser(user);
    localStorage.setItem('globaldocs_customer_auth', JSON.stringify(user));
    showToast(`Bem-vindo(a), ${user.name || user.email}! Seus downloads foram liberados.`);
    return { success: true, message: 'Login realizado com sucesso!' };
  };

  const customerLogout = () => {
    setCustomerUser(null);
    localStorage.removeItem('globaldocs_customer_auth');
    showToast('Você encerrou a sessão da área de downloads.', 'info');
  };

  // Product Operations
  const addProduct = (productData: Omit<DigitalProduct, 'id' | 'createdAt' | 'updatedAt' | 'downloadsCount'>) => {
    const newProduct: DigitalProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      downloadsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
    showToast(`"${newProduct.title}" cadastrado com sucesso!`);
  };

  const updateProduct = (id: string, updates: Partial<DigitalProduct>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
    showToast('Item atualizado com sucesso!');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Item removido com sucesso.', 'info');
  };

  const toggleProductStatus = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  // Collections Operations
  const addCollection = (colData: Omit<Collection, 'id'>) => {
    const newCol: Collection = {
      ...colData,
      id: `col-${Date.now()}`,
    };
    setCollections(prev => [...prev, newCol]);
    showToast(`Coleção "${newCol.name}" criada com sucesso!`);
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    showToast('Coleção atualizada!');
  };

  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    // Detach products from deleted collection
    setProducts(prev => prev.map(p => p.collectionId === id ? { ...p, collectionId: undefined } : p));
    showToast('Coleção removida.', 'info');
  };

  // Cart Operations
  const addToCart = (product: DigitalProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        showToast(`"${product.title}" já está no seu carrinho.`);
        return prev;
      }
      showToast(`Adicionado ao carrinho: ${product.title}`);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartCount = cart.length;
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedCoupon ? (subtotal * (appliedCoupon.discountPercent / 100)) : 0;
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const found = coupons.find(c => c.code.toUpperCase() === trimmed);
    if (!found) {
      return { success: false, message: 'Cupom inválido ou não encontrado.' };
    }
    if (!found.active) {
      return { success: false, message: 'Este cupom não está mais ativo.' };
    }
    setAppliedCoupon(found);
    showToast(`Cupom ${found.code} aplicado: ${found.discountPercent}% OFF!`);
    return { success: true, message: `Desconto de ${found.discountPercent}% aplicado!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupom removido.', 'info');
  };

  // Orders & Checkout
  const createOrder = (orderData: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    shippingAddress?: string;
    paymentMethod: PaymentMethod;
  }): Order => {
    const orderItems = cart.map(item => ({
      productId: item.product.id,
      productTitle: item.product.title,
      productType: item.product.productType,
      format: item.product.format,
      price: item.product.price,
      downloadFileName: item.product.downloadFileName,
      zipFileName: item.product.zipFileName,
      accessLogins: item.product.accessLogins,
      proxyDetails: item.product.proxyDetails,
      accessInstructions: item.product.accessInstructions,
    }));

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerDocument: orderData.customerDocument,
      shippingAddress: orderData.shippingAddress,
      items: orderItems,
      total: total,
      discount: discount,
      appliedCoupon: appliedCoupon?.code,
      paymentMethod: orderData.paymentMethod,
      status: orderData.paymentMethod === 'boleto' ? 'pending' : 'paid',
      downloadToken: `tk_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // Autenticar automaticamente o comprador na área do cliente
    const buyer: CustomerUser = {
      email: orderData.customerEmail.toLowerCase().trim(),
      name: orderData.customerName.trim(),
      document: orderData.customerDocument,
    };
    setCustomerUser(buyer);
    localStorage.setItem('globaldocs_customer_auth', JSON.stringify(buyer));

    // Update download count
    setProducts(prev => prev.map(p => {
      const purchased = orderItems.find(item => item.productId === p.id);
      return purchased ? { ...p, downloadsCount: p.downloadsCount + 1 } : p;
    }));

    if (appliedCoupon) {
      setCoupons(prev => prev.map(c => 
        c.code === appliedCoupon.code ? { ...c, usageCount: c.usageCount + 1 } : c
      ));
    }

    clearCart();
    setIsCheckoutOpen(false);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    showToast(`Status do pedido ${orderId} atualizado.`);
  };

  const addCoupon = (couponData: Omit<Coupon, 'usageCount'>) => {
    const newCoupon: Coupon = {
      ...couponData,
      code: couponData.code.toUpperCase().trim(),
      usageCount: 0,
    };
    setCoupons(prev => [...prev, newCoupon]);
    showToast(`Cupom ${newCoupon.code} criado!`);
  };

  const toggleCoupon = (code: string) => {
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, active: !c.active } : c));
  };

  const deleteCoupon = (code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
    showToast('Cupom excluído.', 'info');
  };

  const addBanner = (bannerData: Omit<Banner, 'id'>) => {
    const newBanner: Banner = {
      ...bannerData,
      id: `banner-${Date.now()}`,
    };
    setBanners(prev => [newBanner, ...prev]);
    showToast('Banner adicionado com sucesso!');
  };

  const updateBanner = (id: string, updates: Partial<Banner>) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    showToast('Banner atualizado!');
  };

  const deleteBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    showToast('Banner removido.', 'info');
  };

  const toggleBannerStatus = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Configurações salvas!');
  };

  const downloadFile = (productTitle: string, fileName: string, fileFormat: string, sampleContent?: string) => {
    const content = sampleContent || `========================================\nGLOBAL DOCS - ENTREGA OFICIAL\n========================================\nPRODUTO: ${productTitle}\nARQUIVO: ${fileName}\nFORMATO: ${fileFormat}\nLICENÇA: Comercial & Operacional\nDATA: ${new Date().toLocaleDateString('pt-BR')}\n========================================`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Download de "${fileName}" iniciado!`);
  };

  return (
    <StoreContext.Provider value={{
      selectedProduct,
      setSelectedProduct,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      customerUser,
      customerLogin,
      customerLogout,
      isAdminAuthenticated,
      adminLogin,
      adminLogout,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductStatus,
      collections,
      addCollection,
      updateCollection,
      deleteCollection,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      selectedProductType,
      setSelectedProductType,
      selectedCollectionId,
      setSelectedCollectionId,
      selectedFormat,
      setSelectedFormat,
      sortBy,
      setSortBy,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartCount,
      subtotal,
      discount,
      total,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      orders,
      createOrder,
      updateOrderStatus,
      coupons,
      addCoupon,
      toggleCoupon,
      deleteCoupon,
      banners,
      addBanner,
      updateBanner,
      deleteBanner,
      toggleBannerStatus,
      settings,
      updateSettings,
      downloadFile,
      toast,
      showToast,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
