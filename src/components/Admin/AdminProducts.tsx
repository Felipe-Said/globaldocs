import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DigitalProduct, FileCategory, FileFormat, ProductType, DeliverySpeed } from '../../types';
import { detectBrands } from '../../utils/brandDetection';
import { BrandLogosList } from '../BrandLogos';
import { detectCountries } from '../../utils/countryDetection';
import { CountryBadgesList } from '../CountryBadge';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Download, 
  ToggleLeft,
  ToggleRight,
  Package,
  FileCheck,
  Building2,
  CreditCard,
  Briefcase,
  Sparkles,
  Layers,
  Zap,
  Clock,
  Rocket,
  Key,
  Globe,
  FileArchive,
  Upload,
  FileCode
} from 'lucide-react';
import { slugify, downloadSitemapXml } from '../../utils/seo';

const CATEGORIES: FileCategory[] = [
  'Templates',
  'Documentos Legais',
  'Planilhas',
  'Design & UI',
  'Desenvolvimento',
  'E-books & Guias',
  'Áudio & Mídia'
];

const FORMATS: FileFormat[] = ['PDF', 'ZIP', 'XLSX', 'FIG', 'DOCX', 'PSD', 'PY', 'JSON', 'MP4', 'PACOTE'];

export const AdminProducts: React.FC = () => {
  const { 
    products, 
    collections,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductStatus,
    downloadFile 
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [selectedCol, setSelectedCol] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<FileCategory>('Documentos Legais');
  const [productType, setProductType] = useState<ProductType>('digital');
  const [collectionId, setCollectionId] = useState<string>('');
  const [price, setPrice] = useState('49.90');
  const [originalPrice, setOriginalPrice] = useState('99.00');
  const [format, setFormat] = useState<FileFormat>('DOCX');
  const [fileSize, setFileSize] = useState('4.5 MB');
  const [version, setVersion] = useState('v1.0 (2026)');
  const [description, setDescription] = useState('');
  const [tagsStr, setTagsStr] = useState('Contratos, Legal, Modelo');
  const [featuresStr, setFeaturesStr] = useState('100% editável\nSuporte incluso\nAtualizações gratuitas');
  const [sampleContent, setSampleContent] = useState('');
  const [downloadFileName, setDownloadFileName] = useState('Documento_Oficial_2026.docx');
  const [shippingInfo, setShippingInfo] = useState('');
  const [llcJurisdiction, setLlcJurisdiction] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('Imediato');
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed>('immediate');
  const [zipFileName, setZipFileName] = useState('Pacote_Entrega_Imediata.zip');
  const [accessLogins, setAccessLogins] = useState('');
  const [proxyDetails, setProxyDetails] = useState('');
  const [accessInstructions, setAccessInstructions] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [slug, setSlug] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [active, setActive] = useState(true);

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle('');
    setTagline('');
    setCategory('Documentos Legais');
    setProductType('digital');
    setCollectionId(collections[0]?.id || '');
    setPrice('49.90');
    setOriginalPrice('99.00');
    setFormat('ZIP');
    setFileSize('12.5 MB');
    setVersion('v1.0 (2026)');
    setDescription('Arquivo completo com modelos e diretrizes prontas para utilização.');
    setTagsStr('Contratos, Legal, Negócios');
    setFeaturesStr('100% editável e desbloqueado\nCompatível com todas as versões\nLicença comercial inclusa');
    setSampleContent('CONTEÚDO DO ARQUIVO DIGITAL:\n\nEste é um modelo de documento oficial.');
    setDownloadFileName('Pacote_Entrega_Imediata.zip');
    setZipFileName('Pacote_Entrega_Imediata.zip');
    setAccessLogins('');
    setProxyDetails('');
    setAccessInstructions('');
    setShippingInfo('');
    setLlcJurisdiction('');
    setAccountDetails('');
    setDeliveryTime('Imediato (Pronta Entrega)');
    setDeliverySpeed('immediate');
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
    setSlug('');
    setIsFeatured(false);
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product: DigitalProduct) => {
    setEditingProduct(product);
    setTitle(product.title);
    setTagline(product.tagline);
    setCategory(product.category);
    setProductType(product.productType || 'digital');
    setCollectionId(product.collectionId || '');
    setPrice(product.price.toString());
    setOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setFormat(product.format);
    setFileSize(product.fileSize);
    setVersion(product.version);
    setDescription(product.description);
    setTagsStr(product.tags.join(', '));
    setFeaturesStr(product.features.join('\n'));
    setSampleContent(product.fileContentSample || '');
    setDownloadFileName(product.downloadFileName);
    setZipFileName(product.zipFileName || product.downloadFileName || 'Pacote_Entrega_Imediata.zip');
    setAccessLogins(product.accessLogins || '');
    setProxyDetails(product.proxyDetails || '');
    setAccessInstructions(product.accessInstructions || '');
    setShippingInfo(product.shippingInfo || '');
    setLlcJurisdiction(product.llcJurisdiction || '');
    setAccountDetails(product.accountDetails || '');
    setDeliveryTime(product.deliveryTime || 'Imediato');
    setDeliverySpeed(product.deliverySpeed || 'immediate');
    setSeoTitle(product.seoTitle || '');
    setSeoDescription(product.seoDescription || '');
    setSeoKeywords(product.seoKeywords || '');
    setSlug(product.slug || slugify(product.title));
    setIsFeatured(!!product.isFeatured);
    setActive(product.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const features = featuresStr.split('\n').map(f => f.trim()).filter(Boolean);

    const productPayload = {
      title,
      tagline,
      category,
      productType,
      collectionId: collectionId || undefined,
      price: parseFloat(price) || 0,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      format: deliverySpeed === 'immediate' && format !== 'ZIP' ? 'ZIP' : format,
      fileSize,
      version,
      description,
      tags,
      features,
      fileContentSample: sampleContent,
      downloadFileName: deliverySpeed === 'immediate' ? (zipFileName.trim() || downloadFileName) : downloadFileName,
      zipFileName: deliverySpeed === 'immediate' ? (zipFileName.trim() || downloadFileName || 'Pacote_Entrega_Imediata.zip') : undefined,
      accessLogins: accessLogins.trim() || undefined,
      proxyDetails: proxyDetails.trim() || undefined,
      accessInstructions: accessInstructions.trim() || undefined,
      shippingInfo: shippingInfo.trim() || undefined,
      llcJurisdiction: llcJurisdiction.trim() || undefined,
      accountDetails: accountDetails.trim() || undefined,
      deliveryTime: deliveryTime.trim() || undefined,
      deliverySpeed,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      seoKeywords: seoKeywords.trim() || undefined,
      slug: slug.trim() || slugify(title),
      isFeatured,
      active,
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 1,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsModalOpen(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesType = selectedType === 'all' || p.productType === selectedType;
    const matchesCol = selectedCol === 'all' || p.collectionId === selectedCol;
    return matchesSearch && matchesCategory && matchesType && matchesCol;
  });

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getTypeBadge = (type: string) => {
    const lower = (type || '').toLowerCase();
    let icon = <FileCheck className="w-3 h-3 shrink-0" />;
    let style = 'bg-blue-100 text-blue-800';

    if (lower.includes('llc') || lower.includes('usa') || lower.includes('empresa')) {
      icon = <Building2 className="w-3 h-3 shrink-0" />;
      style = 'bg-emerald-100 text-emerald-800';
    } else if (lower.includes('conta') || lower.includes('banc') || lower.includes('finance')) {
      icon = <CreditCard className="w-3 h-3 shrink-0" />;
      style = 'bg-indigo-100 text-indigo-800';
    } else if (lower.includes('físic') || lower.includes('fisic') || lower.includes('correio') || lower.includes('sedex') || lower.includes('envio')) {
      icon = <Package className="w-3 h-3 shrink-0" />;
      style = 'bg-amber-100 text-amber-800';
    } else if (lower.includes('serviço') || lower.includes('servico') || lower.includes('consultoria') || lower.includes('assessoria') || lower.includes('mentoria')) {
      icon = <Briefcase className="w-3 h-3 shrink-0" />;
      style = 'bg-purple-100 text-purple-800';
    }

    return (
      <span className={`${style} text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 w-fit whitespace-nowrap shrink-0`}>
        {icon}
        <span>{type || 'Digital'}</span>
      </span>
    );
  };

  const distinctTypes = Array.from(new Set(products.map(p => p.productType).filter(Boolean)));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Catálogo de Produtos & Serviços</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Cadastre e edite arquivos digitais, prestação de serviços, kits LLC, contas e itens físicos
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => downloadSitemapXml(products, collections)}
            title="Exportar sitemap.xml com todos os produtos e páginas indexadas"
            className="h-9 px-3.5 rounded-sm bg-surface-warm hover:bg-black/[0.05] text-ink border border-borderSoft text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-primary" />
            <span>Sitemap.xml ({products.length} itens)</span>
          </button>

          <button
            onClick={openCreateModal}
            className="h-9 px-4 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto ou Serviço</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-md border border-borderSoft text-xs">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Buscar por título, tipo, serviço ou tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-surface-warm border border-borderSoft rounded-xs px-2.5 py-1 text-xs font-medium text-ink focus:bg-white"
          >
            <option value="all">Todos os Tipos</option>
            {distinctTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Collection filter */}
          <select
            value={selectedCol}
            onChange={(e) => setSelectedCol(e.target.value)}
            className="bg-surface-warm border border-borderSoft rounded-xs px-2.5 py-1 text-xs font-medium text-ink focus:bg-white"
          >
            <option value="all">Todas as Coleções</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-surface-warm border border-borderSoft rounded-xs px-2.5 py-1 text-xs font-medium text-ink focus:bg-white"
          >
            <option value="all">Todas as Categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface rounded-md border border-borderSoft shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-warm border-b border-borderSoft text-ink-muted font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Item / Título</th>
                <th className="py-3 px-4">Tipo & Coleção</th>
                <th className="py-3 px-4">Formato / Tamanho</th>
                <th className="py-3 px-4">Preço</th>
                <th className="py-3 px-4">Downloads/Envios</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSoft">
              {filteredProducts.map((product) => {
                const col = collections.find(c => c.id === product.collectionId);
                const detected = detectBrands(product);
                const detectedCountries = detectCountries(product);

                return (
                  <tr key={product.id} className="hover:bg-surface-warm/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-ink max-w-[280px] line-clamp-1">
                          {product.title}
                        </span>
                        {detectedCountries.length > 0 && (
                          <CountryBadgesList countries={detectedCountries} size="xs" maxItems={2} />
                        )}
                      </div>
                      <div className="text-[11px] text-ink-muted font-mono">
                        {product.downloadFileName}
                      </div>
                      {detected.length > 0 && (
                        <div className="mt-1">
                          <BrandLogosList brands={detected} size="xs" maxItems={3} />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {getTypeBadge(product.productType || 'digital')}
                        {product.deliverySpeed === 'immediate' ? (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                            <Zap className="w-2.5 h-2.5 fill-emerald-500 text-emerald-600" />
                            <span>Imediato</span>
                          </div>
                        ) : product.deliverySpeed === 'fast' ? (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 w-fit">
                            <Rocket className="w-2.5 h-2.5 text-blue-600" />
                            <span>Rápido ({product.deliveryTime || 'poucas horas'})</span>
                          </div>
                        ) : product.deliveryTime ? (
                          <div className="flex items-center gap-1 text-[9px] text-ink-muted bg-surface-warm px-1.5 py-0.5 rounded border border-borderSoft w-fit">
                            <Clock className="w-2.5 h-2.5 text-ink-muted" />
                            <span>{product.deliveryTime}</span>
                          </div>
                        ) : null}
                        {col && (
                          <div className="text-[10px] text-ink-muted truncate max-w-[150px]">
                            {col.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[10px] bg-surface-warm px-1.5 py-0.5 rounded border border-borderSoft mr-1.5">
                        {product.format}
                      </span>
                      <span className="text-ink-muted">{product.fileSize}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-ink">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-3 px-4 text-ink">
                      {product.downloadsCount.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleProductStatus(product.id)}
                        className="cursor-pointer"
                        title="Alternar Ativo/Inativo"
                      >
                        {product.active ? (
                          <span className="inline-flex items-center gap-1 text-success font-medium">
                            <ToggleRight className="w-5 h-5 text-success" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-ink-muted font-medium">
                            <ToggleLeft className="w-5 h-5 text-ink-muted" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => downloadFile(product.title, product.downloadFileName, product.format, product.fileContentSample)}
                          className="p-1.5 text-ink-muted hover:text-primary rounded hover:bg-surface-warm transition-colors cursor-pointer"
                          title="Testar Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-ink-muted hover:text-ink rounded hover:bg-surface-warm transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remover "${product.title}"?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 text-ink-muted hover:text-accent-red rounded hover:bg-surface-warm transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-surface w-full max-w-2xl rounded-md border border-borderSoft shadow-notion-modal overflow-hidden max-h-[90vh] flex flex-col animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-borderSoft flex items-center justify-between">
              <h3 className="font-bold text-base text-ink">
                {editingProduct ? 'Editar Produto ou Serviço' : 'Cadastrar Produto ou Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-surface-warm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Type and Collection selection - Especificação Manual pelo Admin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-warm rounded-sm border border-borderSoft">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-ink">Tipo de Produto ou Serviço</label>
                    <span className="text-[10px] text-primary font-semibold">Especificação manual</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="Ex: Consultoria, Assessoria LLC, Serviço, Digital..."
                    className="w-full px-2.5 py-1.5 bg-white border border-borderSoft rounded-sm text-ink font-semibold focus:border-primary text-xs"
                  />
                  {/* Sugestões Rápidas de 1 Clique */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-ink-muted mr-0.5">Sugestões:</span>
                    {['Digital', 'Serviço', 'Consultoria', 'Assessoria', 'LLC USA', 'Contas Globais', 'Dossiê Digital', 'Mentoria'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setProductType(s)}
                        className={`text-[10px] px-1.5 py-0.2 rounded border transition-colors cursor-pointer ${
                          productType === s 
                            ? 'bg-primary text-white border-primary font-bold' 
                            : 'bg-white text-ink-muted hover:text-ink border-borderSoft'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Vincular à Coleção</label>
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-borderSoft rounded-sm text-ink focus:border-primary"
                  >
                    <option value="">Sem Coleção Específica</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Título do Produto</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
                  placeholder="Ex: Kit Completo Formação LLC em Delaware"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Subtítulo / Tagline</label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
                  placeholder="Ex: Articles of Organization, Operating Agreement e Guia do EIN"
                />
              </div>

              {/* Dynamic Type fields - adaptam-se ao tipo especificado manualmente */}
              {(productType.toLowerCase().includes('llc') || productType.toLowerCase().includes('usa') || llcJurisdiction) && (
                <div className="p-3 bg-emerald-50/60 rounded-sm border border-emerald-200">
                  <label className="block font-bold text-emerald-900 mb-1">Jurisdição / Estados Atendidos (Opcional)</label>
                  <input
                    type="text"
                    value={llcJurisdiction}
                    onChange={(e) => setLlcJurisdiction(e.target.value)}
                    placeholder="Ex: Delaware, Wyoming, Novo México, Flórida"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-sm text-ink"
                  />
                </div>
              )}

              {(productType.toLowerCase().includes('conta') || productType.toLowerCase().includes('banc') || accountDetails) && (
                <div className="p-3 bg-indigo-50/60 rounded-sm border border-indigo-200">
                  <label className="block font-bold text-indigo-900 mb-1">Detalhes da Estrutura de Contas (Opcional)</label>
                  <input
                    type="text"
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    placeholder="Ex: Contas Corporativas Mercury, Stripe US & Wise Business"
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-sm text-ink"
                  />
                </div>
              )}



              {/* Campo de Prazo Médio e Agilidade de Entrega */}
              <div className="p-3.5 bg-surface-warm rounded-sm border border-borderSoft space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-ink flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Prazo Médio e Agilidade de Entrega / Execução</span>
                  </label>
                  <span className="text-[10px] text-ink-muted">Visível no card e detalhes do produto</span>
                </div>

                {/* Seletor de Pronta Entrega / Imediata / Rápida / Padrão */}
                <div>
                  <span className="block text-[11px] font-medium text-ink mb-1.5">
                    Modalidade de Agilidade (Produto em mãos ou conclusão imediata):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliverySpeed('immediate');
                        if (!deliveryTime || deliveryTime === '2 a 4 dias úteis') setDeliveryTime('Imediato (Pronta Entrega)');
                      }}
                      className={`p-2 rounded-sm border text-left flex items-start gap-2 transition-all cursor-pointer ${
                        deliverySpeed === 'immediate'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-400'
                          : 'bg-white border-borderSoft text-ink-muted hover:border-emerald-300'
                      }`}
                    >
                      <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${deliverySpeed === 'immediate' ? 'text-emerald-600 fill-emerald-500' : 'text-ink-muted'}`} />
                      <div>
                        <div className="text-xs font-bold text-ink">Pronta Entrega / Imediato</div>
                        <div className="text-[10px] text-ink-muted leading-tight mt-0.5">Em mãos / download instantâneo</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeliverySpeed('fast');
                        if (!deliveryTime || deliveryTime === 'Imediato (Pronta Entrega)') setDeliveryTime('Em até 2 horas');
                      }}
                      className={`p-2 rounded-sm border text-left flex items-start gap-2 transition-all cursor-pointer ${
                        deliverySpeed === 'fast'
                          ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold ring-1 ring-blue-400'
                          : 'bg-white border-borderSoft text-ink-muted hover:border-blue-300'
                      }`}
                    >
                      <Rocket className={`w-4 h-4 shrink-0 mt-0.5 ${deliverySpeed === 'fast' ? 'text-blue-600' : 'text-ink-muted'}`} />
                      <div>
                        <div className="text-xs font-bold text-ink">Entrega Rápida</div>
                        <div className="text-[10px] text-ink-muted leading-tight mt-0.5">Prioritário / poucas horas</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeliverySpeed('standard');
                        if (!deliveryTime || deliveryTime === 'Imediato (Pronta Entrega)') setDeliveryTime('2 a 4 dias úteis');
                      }}
                      className={`p-2 rounded-sm border text-left flex items-start gap-2 transition-all cursor-pointer ${
                        deliverySpeed === 'standard'
                          ? 'bg-ink text-white border-ink font-semibold'
                          : 'bg-white border-borderSoft text-ink-muted hover:border-border'
                      }`}
                    >
                      <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${deliverySpeed === 'standard' ? 'text-white' : 'text-ink-muted'}`} />
                      <div>
                        <div className={`text-xs font-bold ${deliverySpeed === 'standard' ? 'text-white' : 'text-ink'}`}>Prazo Normal</div>
                        <div className={`text-[10px] leading-tight mt-0.5 ${deliverySpeed === 'standard' ? 'text-white/80' : 'text-ink-muted'}`}>Conforme confecção / envio</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Campo de Texto para Prazo Médio Estipulado */}
                <div>
                  <label className="block text-[11px] font-medium text-ink mb-1">
                    Prazo Médio Estipulado de Entrega / Conclusão:
                  </label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="Ex: Imediato, Em até 1 hora, 24 horas, 2 a 4 dias úteis..."
                    className="w-full px-3 py-1.5 bg-white border border-borderSoft rounded-sm text-ink focus:border-primary font-medium text-xs"
                  />
                  {/* Sugestões Rápidas */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-ink-muted mr-0.5">Sugestões de prazo:</span>
                    {[
                      'Imediato (Instantâneo)',
                      'Em até 1 hora',
                      'Até 24 horas',
                      '1 a 2 dias úteis',
                      '3 a 5 dias úteis',
                      'Sedex (1 a 3 dias)'
                    ].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDeliveryTime(st)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          deliveryTime === st
                            ? 'bg-primary text-white border-primary font-semibold'
                            : 'bg-white text-ink-muted hover:text-ink border-borderSoft'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Painel Especial de Pronta Entrega: Arquivo ZIP & Credenciais / Proxy */}
              {deliverySpeed === 'immediate' && (
                <div className="p-4 bg-emerald-50/70 rounded-md border border-emerald-300 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600 fill-emerald-500" />
                      <span className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                        Campos de Pronta Entrega Instantânea
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      Disponibilização Imediata
                    </span>
                  </div>

                  {/* 1. Arquivo ZIP para Download Imediato */}
                  <div className="bg-white p-3 rounded-sm border border-emerald-200 space-y-2">
                    <label className="block font-bold text-ink flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileArchive className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Adicionar Arquivo ZIP para Download Imediato</span>
                      </span>
                      <span className="text-[10px] text-ink-muted font-mono">.zip</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={zipFileName}
                        onChange={(e) => setZipFileName(e.target.value)}
                        placeholder="Ex: Arquivos_Completos_Oficiais.zip"
                        className="flex-1 px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink font-mono text-xs focus:bg-white focus:border-primary"
                      />
                      <label className="h-8.5 px-3 bg-surface-warm hover:bg-black/[0.05] border border-borderSoft rounded-sm text-ink text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        <span>Selecionar .ZIP</span>
                        <input
                          type="file"
                          accept=".zip,.rar,.tar,.gz"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setZipFileName(file.name);
                              setFormat('ZIP');
                              setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="text-[10px] text-ink-muted">
                      Arquivo que o comprador receberá para download assim que o pagamento for concluído.
                    </div>
                  </div>

                  {/* 2. Logins, Acessos e Proxies (Quando necessário) */}
                  <div className="bg-white p-3 rounded-sm border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-ink flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-primary" />
                        <span>Logins, Senhas e Proxies (Quando necessário)</span>
                      </label>
                      <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Opcional / Seguro
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Campo Logins */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-ink flex items-center gap-1">
                            <Key className="w-3 h-3 text-ink-muted" />
                            <span>Logins e Credenciais de Acesso:</span>
                          </label>
                          <span className="text-[10px] text-ink-muted">Usuário, senha, token, pin</span>
                        </div>
                        <textarea
                          rows={2}
                          value={accessLogins}
                          onChange={(e) => setAccessLogins(e.target.value)}
                          placeholder={"Ex: Usuário: cliente@empresa.com\nSenha: ••••••••••\nCódigo 2FA / Chave: JBSWY3DPEHPK3PXP"}
                          className="w-full px-2.5 py-1.5 bg-surface-warm border border-borderSoft rounded-sm font-mono text-ink text-xs focus:bg-white focus:border-primary"
                        />
                      </div>

                      {/* Campo Proxy */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-ink flex items-center gap-1">
                            <Globe className="w-3 h-3 text-ink-muted" />
                            <span>Configuração de Proxy:</span>
                          </label>
                          <span className="text-[10px] text-ink-muted">IP:Porta:User:Pass ou socks5</span>
                        </div>
                        <textarea
                          rows={2}
                          value={proxyDetails}
                          onChange={(e) => setProxyDetails(e.target.value)}
                          placeholder="Ex: 198.51.100.42:9050:proxyuser:proxypass (SOCKS5 Residencial Dedicado)"
                          className="w-full px-2.5 py-1.5 bg-surface-warm border border-borderSoft rounded-sm font-mono text-ink text-xs focus:bg-white focus:border-primary"
                        />
                      </div>

                      {/* Instruções de Uso do Acesso */}
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">
                          Instruções Especiais de Conexão / Acesso:
                        </label>
                        <input
                          type="text"
                          value={accessInstructions}
                          onChange={(e) => setAccessInstructions(e.target.value)}
                          placeholder="Ex: Inserir o proxy no perfil do AdsPower/Dolphin antes de realizar o primeiro login."
                          className="w-full px-2.5 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink text-xs focus:bg-white focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-ink mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FileCategory)}
                    className="w-full px-2 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Formato</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as FileFormat)}
                    className="w-full px-2 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                  >
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Preço Original</label>
                  <input
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-ink mb-1">Tamanho / Peso</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Versão</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Nome Arquivo Entrega</label>
                  <input
                    type="text"
                    required
                    value={downloadFileName}
                    onChange={(e) => setDownloadFileName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">O que está incluso (um por linha)</label>
                <textarea
                  rows={3}
                  value={featuresStr}
                  onChange={(e) => setFeaturesStr(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Conteúdo do Arquivo / Amostra</label>
                <textarea
                  rows={3}
                  value={sampleContent}
                  onChange={(e) => setSampleContent(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm font-mono text-ink focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                />
              </div>

              {/* Live Preview de Marcas theSVG.org detectadas */}
              {(() => {
                const previewBrands = detectBrands({
                  title,
                  tagline,
                  description,
                  tags: tagsStr.split(',').map(t => t.trim()),
                  format,
                  accountDetails,
                });

                if (previewBrands.length === 0) return null;

                return (
                  <div className="p-2.5 bg-surface-warm/80 rounded-sm border border-borderSoft flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-ink-muted">
                      Logos theSVG.org detectadas automaticamente:
                    </span>
                    <BrandLogosList brands={previewBrands} size="xs" maxItems={6} />
                  </div>
                );
              })()}

              {/* Live Preview de Países FlagCDN detectados automaticamente */}
              {(() => {
                const previewCountries = detectCountries({
                  title,
                  tagline,
                  description,
                  tags: tagsStr.split(',').map(t => t.trim()),
                  productType,
                  llcJurisdiction,
                  accountDetails,
                  shippingInfo,
                });

                if (previewCountries.length === 0) return null;

                return (
                  <div className="p-2.5 bg-surface-warm/80 rounded-sm border border-borderSoft flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-ink-muted">
                      Bandeiras de países detectadas automaticamente:
                    </span>
                    <CountryBadgesList countries={previewCountries} size="sm" maxItems={6} />
                  </div>
                );
              })()}

              {/* Otimização para Mecanismos de Busca (SEO & Google) */}
              <div className="p-3.5 bg-surface-warm rounded-sm border border-borderSoft space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <Search className="w-4 h-4 text-primary" />
                    <span>Otimização para Mecanismos de Busca (SEO & Google)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!title) return;
                      setSeoTitle(`${title} | Comprar Online`);
                      setSeoDescription(tagline || (description ? description.slice(0, 155) : ''));
                      setSlug(slugify(title));
                      setSeoKeywords(`${title}, ${productType}, comprar ${productType}, ${tagsStr}`);
                    }}
                    className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    ⚡ Auto-gerar Metadados SEO
                  </button>
                </div>

                {/* Google Search Result Live Preview */}
                <div className="bg-white p-3 rounded-sm border border-borderSoft space-y-1">
                  <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                    Prévia nos Resultados do Google (SERP Preview):
                  </span>
                  <div className="text-[11px] text-emerald-800 font-mono truncate">
                    globaldocs.com.br › item › {slug || slugify(title || 'produto-servico')}
                  </div>
                  <div className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                    {seoTitle || (title ? `${title} — ${productType} | GlobalDOCS` : 'Título do Produto ou Serviço | GlobalDOCS')}
                  </div>
                  <div className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                    {seoDescription || (tagline ? tagline : description ? description.slice(0, 150) : 'Descrição otimizada para ranqueamento orgânico no Google, Bing e redes sociais.')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-ink">Meta Title (Título no Google):</label>
                      <span className={`text-[10px] ${seoTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-ink-muted'}`}>
                        {seoTitle.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder={title ? `${title} | GlobalDOCS` : 'Ex: Formação LLC em Delaware | GlobalDOCS'}
                      className="w-full px-2.5 py-1.5 bg-white border border-borderSoft rounded-sm text-ink text-xs focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink mb-1">
                      URL Amigável (Slug de Busca):
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder={title ? slugify(title) : 'ex: kit-llc-delaware'}
                      className="w-full px-2.5 py-1.5 bg-white border border-borderSoft rounded-sm font-mono text-ink text-xs focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-ink">Meta Description (Snippet de Busca):</label>
                    <span className={`text-[10px] ${seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-ink-muted'}`}>
                      {seoDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Descrição atrativa com palavras-chave que incentive cliques nos resultados orgânicos..."
                    className="w-full px-2.5 py-1.5 bg-white border border-borderSoft rounded-sm text-ink text-xs focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Palavras-chave de Ranqueamento (Keywords):
                  </label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="Ex: abrir llc eua, delaware, documentos prontos, contas globais"
                    className="w-full px-2.5 py-1.5 bg-white border border-borderSoft rounded-sm text-ink text-xs focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span className="font-medium text-ink">Ativo na Loja</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span className="font-medium text-ink">Destaque na Home</span>
                </label>
              </div>

              <div className="pt-4 border-t border-borderSoft flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8.5 px-3.5 rounded-sm bg-surface-warm text-ink font-medium border border-borderSoft hover:bg-black/[0.04] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-8.5 px-4 rounded-sm bg-primary hover:bg-primary-pressed text-white font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
