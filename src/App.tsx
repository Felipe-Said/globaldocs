import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { MyDownloadsView } from './components/MyDownloadsView';
import { AdminLayout } from './components/Admin/AdminLayout';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastNotification: React.FC = () => {
  const { toast } = useStore();

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 right-4 md:right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-sm bg-ink text-white text-xs font-medium shadow-notion-modal border border-white/10 animate-fadeIn max-w-[90vw]">
      {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
      {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-accent-red shrink-0" />}
      {toast.type === 'info' && <Info className="w-4 h-4 text-primary-tint shrink-0" />}
      <span className="truncate">{toast.message}</span>
    </div>
  );
};

// Public Layout containing Header, Footer, and Mobile App Navigation
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-surface pb-16 md:pb-0">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

// Component to handle deep-linking from Sitemap and search engines (?item=id or ?colecao=slug)
const URLParamHandler: React.FC = () => {
  const { products, setSelectedProduct, collections, setSelectedCollectionId } = useStore();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('item');
    const colParam = params.get('colecao');

    if (itemId) {
      const found = products.find(p => p.id === itemId);
      if (found) {
        setSelectedProduct(found);
      }
    }

    if (colParam) {
      const foundCol = collections.find(c => c.slug === colParam || c.id === colParam);
      if (foundCol) {
        setSelectedCollectionId(foundCol.id);
      }
    }
  }, [products, collections]);

  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <URLParamHandler />
        <Routes>
          {/* Public Storefront Route */}
          <Route path="/" element={
            <PublicLayout>
              <Hero />
              <ProductGrid />
            </PublicLayout>
          } />

          {/* Customer Downloads Route */}
          <Route path="/downloads" element={
            <PublicLayout>
              <MyDownloadsView />
            </PublicLayout>
          } />

          {/* Dedicated and Protected Admin Route */}
          <Route path="/admin" element={
            <AdminLayout />
          } />
        </Routes>

        {/* Global Modals & Drawers */}
        <ProductDetailModal />
        <CartDrawer />
        <ToastNotification />
      </StoreProvider>
    </BrowserRouter>
  );
}
