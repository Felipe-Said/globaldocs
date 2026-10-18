import React from 'react';
import { ArrowUpRight, Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBrandLogoUrl } from '../utils/brandDetection';
import { updateDocumentSEO } from '../utils/seo';

type BioLink = {
  label: string;
  accessibleLabel: string;
  brand: 'meta' | 'google' | 'tiktok' | 'shopify';
  to: string;
};

const collectionLinks: BioLink[] = [
  {
    label: 'Contas',
    accessibleLabel: 'Acessar coleção de Contas Meta',
    brand: 'meta',
    to: '/colecao/catalogo-facebook',
  },
  {
    label: 'Contas',
    accessibleLabel: 'Acessar coleção de Contas Google',
    brand: 'google',
    to: '/colecao/catalogo-google',
  },
  {
    label: 'Contas',
    accessibleLabel: 'Acessar coleção de Contas TikTok',
    brand: 'tiktok',
    to: '/colecao/catalogo-tiktok',
  },
  {
    label: 'Temas',
    accessibleLabel: 'Acessar coleção de Temas Shopify',
    brand: 'shopify',
    to: '/colecao/temas-shopify',
  },
];

export const BioLinksView: React.FC = () => {
  React.useEffect(() => {
    updateDocumentSEO({
      title: 'Links oficiais | Global DOCs',
      description: 'Acesse o site e as principais coleções da Global DOCs.',
      canonicalUrl: 'https://globaldocs.sbs/cliqueaqui',
      ogImage: 'https://globaldocs.sbs/globaldocs-social-preview-v3.jpg',
    });
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface-warm px-4 py-10 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary-tint to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-28 bottom-10 h-72 w-72 rounded-full bg-accent-amber/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto flex w-full max-w-[520px] flex-col items-center">
        <Link to="/" aria-label="Ir para a página inicial da Global DOCs" className="rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4">
          <img src="/logo.png" alt="Global DOCs" className="h-12 w-auto object-contain sm:h-14" />
        </Link>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Encontre o que você precisa</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
            Acesse nossa loja ou vá direto para uma das coleções mais procuradas.
          </p>
        </div>

        <nav aria-label="Links oficiais da Global DOCs" className="mt-8 w-full space-y-3">
          <Link
            to="/"
            className="group flex min-h-16 w-full items-center gap-3 rounded-2xl bg-primary px-5 text-white shadow-notion-card transition-colors hover:bg-primary-pressed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Globe2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-left text-sm font-bold sm:text-base">Acessar nosso site</span>
            <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>

          {collectionLinks.map(link => (
            <Link
              key={link.brand}
              to={link.to}
              aria-label={link.accessibleLabel}
              className="group flex min-h-16 w-full items-center gap-4 rounded-2xl border border-borderSoft bg-white px-5 text-ink shadow-notion-card transition-[border-color,background-color,box-shadow] hover:border-primary/30 hover:bg-primary-tint hover:shadow-notion-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="text-sm font-semibold sm:text-base">{link.label}</span>
              <span className="flex min-w-0 flex-1 items-center" aria-hidden="true">
                <img
                  src={getBrandLogoUrl(link.brand)}
                  alt=""
                  className="h-7 max-w-[112px] object-contain object-left sm:h-8 sm:max-w-[132px]"
                />
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <p className="mt-8 text-center text-[11px] text-ink-faint">© {new Date().getFullYear()} Global DOCs · Link oficial</p>
      </div>
    </main>
  );
};
