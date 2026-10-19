export type FileCategory = 
  | 'Templates' 
  | 'Documentos Legais' 
  | 'Planilhas' 
  | 'Design & UI' 
  | 'Desenvolvimento' 
  | 'E-books & Guias'
  | 'Áudio & Mídia';

export type ProductType = string;
export type DeliveryType = 'digital' | 'servico' | 'fisico' | 'manual';
export type DeliverySpeed = 'immediate' | 'fast' | 'standard';

export type FileFormat = 'PDF' | 'ZIP' | 'XLSX' | 'FIG' | 'DOCX' | 'PSD' | 'PY' | 'JSON' | 'MP4' | 'PACOTE';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  subcategories?: string[];
  badgeColor?: string;
  active: boolean;
  homeOrder?: number;
}

export interface DigitalProduct {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: FileCategory;
  productType: ProductType;
  deliveryType?: DeliveryType;
  collectionId?: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  format: FileFormat;
  fileSize: string;
  version: string;
  downloadsCount: number;
  rating: number;
  reviewsCount: number;
  unlimitedStock: boolean;
  stockQuantity: number;
  minimumOrder?: number;
  tags: string[];
  features: string[];
  previewUrl?: string;
  fileContentSample?: string;
  downloadFileName: string;
  // Specific properties
  shippingInfo?: string; // Físico
  llcJurisdiction?: string; // LLC (ex: Delaware, Wyoming, Flórida)
  accountDetails?: string; // Contas (tipo de conta, plataforma)
  deliveryTime?: string; // Prazo médio de entrega (ex: "Imediato", "24 horas", "2 a 4 dias úteis")
  deliverySpeed?: DeliverySpeed; // 'immediate' (Pronta entrega / Imediato), 'fast' (Entrega rápida), 'standard' (Prazo normal)
  zipFileName?: string; // Arquivo ZIP de pronta entrega
  accessLogins?: string; // Logins e credenciais de acesso
  proxyDetails?: string; // Proxies (IP:Porta:User:Pass)
  accessInstructions?: string; // Instruções de uso/conexão
  // Supplier metadata (internal only; never render the supplier name publicly)
  supplier?: string;
  supplierProductId?: string;
  supplierCategory?: string;
  supplierPriceUsd?: number;
  // SEO & Ranqueamento
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  slug?: string;
  isFeatured?: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: DigitalProduct;
  quantity: number;
}

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'crypto' | 'wallet';

export type OrderStatus = 'paid' | 'pending' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  shippingAddress?: string;
  items: {
    productId: string;
    productTitle: string;
    productType: ProductType;
    format: FileFormat;
    price: number;
    downloadFileName: string;
    zipFileName?: string;
    accessLogins?: string;
    proxyDetails?: string;
    accessInstructions?: string;
    quantity?: number;
    requiresFulfillment?: boolean;
    deliveryStatus?: 'processing' | 'delivered';
  }[];
  total: number;
  discount: number;
  appliedCoupon?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  downloadToken: string;
  trackingCode?: string;
  fulfillmentStatus?: 'processing' | 'completed' | 'failed';
  fulfillmentIssue?: 'insufficient_balance' | 'provider_error';
  fulfillmentMessage?: string;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  active: boolean;
  usageCount: number;
  expiresAt?: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  contactEmail: string;
  supportWhatsapp: string;
  pixKey: string;
  currency: string;
  allowGuestCheckout: boolean;
  notifyOnSale: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  linkUrl?: string;
  active: boolean;
  order: number;
}
