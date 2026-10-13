import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Banner } from '@/types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ToggleLeft, 
  ToggleRight, 
  Image as ImageIcon, 
  Smartphone, 
  Monitor, 
  Upload, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';

export const AdminBanners: React.FC = () => {
  const { 
    banners, 
    addBanner, 
    updateBanner, 
    deleteBanner, 
    toggleBannerStatus, 
    showToast 
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [desktopImageUrl, setDesktopImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [active, setActive] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setDesktopImageUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop');
    setMobileImageUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop');
    setLinkUrl('');
    setActive(true);
    setPreviewMode('desktop');
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setDesktopImageUrl(banner.desktopImageUrl);
    setMobileImageUrl(banner.mobileImageUrl || banner.desktopImageUrl);
    setLinkUrl(banner.linkUrl || '');
    setActive(banner.active);
    setPreviewMode('desktop');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter menos de 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === 'desktop') {
        setDesktopImageUrl(result);
        if (!mobileImageUrl) setMobileImageUrl(result);
      } else {
        setMobileImageUrl(result);
      }
      showToast(`Imagem ${target === 'desktop' ? 'Desktop' : 'Mobile'} carregada!`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!desktopImageUrl) {
      showToast('Informe ao menos a imagem para Desktop.', 'error');
      return;
    }

    const payload = {
      title,
      subtitle: subtitle || undefined,
      desktopImageUrl,
      mobileImageUrl: mobileImageUrl || desktopImageUrl,
      linkUrl: linkUrl || undefined,
      active,
      order: editingBanner ? editingBanner.order : banners.length + 1,
    };

    if (editingBanner) {
      updateBanner(editingBanner.id, payload);
    } else {
      addBanner(payload);
    }

    setIsModalOpen(false);
  };

  const applyPreset = (preset: { title: string; subtitle: string; desktop: string; mobile: string }) => {
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setDesktopImageUrl(preset.desktop);
    setMobileImageUrl(preset.mobile);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Banners & Destaques da Loja</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Gerencie os banners exibidos na página inicial com proporções independentes para Desktop e Mobile (sem bordas).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="h-9 px-4 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Banner</span>
        </button>
      </div>

      {/* Info Pill */}
      <div className="p-3 bg-primary-tint/50 rounded-sm border border-primary/20 flex items-start gap-2.5 text-xs text-ink">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-primary-pressed">Configuração de Proporção & Visual:</p>
          <p className="text-ink-muted text-[11px] leading-relaxed">
            Os banners na loja pública <strong>não possuem bordas</strong> e se adaptam dinamicamente:
            <span className="font-medium text-ink"> Desktop (21:7 / 16:6)</span> e 
            <span className="font-medium text-ink"> Mobile (16:9 / 4:3)</span>.
            Você pode definir uma imagem sob medida para cada dispositivo ou subir arquivos locais diretamente.
          </p>
        </div>
      </div>

      {/* Banners List */}
      <div className="grid grid-cols-1 gap-4">
        {banners.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-md border border-borderSoft space-y-3">
            <ImageIcon className="w-10 h-10 text-ink-muted mx-auto opacity-40" />
            <h3 className="font-bold text-ink text-sm">Nenhum banner cadastrado</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Crie o primeiro banner para destacar promoções, lançamentos de LLCs ou kits de arquivos.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 h-8 px-3 rounded-sm bg-primary text-white text-xs font-semibold hover:bg-primary-pressed transition-colors cursor-pointer"
            >
              Adicionar Banner
            </button>
          </div>
        ) : (
          banners.map((banner) => (
            <div 
              key={banner.id}
              className="bg-surface rounded-md border border-borderSoft overflow-hidden shadow-xs hover:border-borderSoft/80 transition-all flex flex-col md:flex-row items-stretch"
            >
              {/* Responsive Thumbnails Preview */}
              <div className="md:w-72 shrink-0 bg-surface-warm p-3 flex flex-col justify-center gap-2 border-b md:border-b-0 md:border-r border-borderSoft">
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-ink-muted uppercase mb-1">
                    <Monitor className="w-3 h-3" />
                    <span>Desktop (21:7)</span>
                  </div>
                  <div className="aspect-[21/7] rounded overflow-hidden bg-black/5" style={{ border: 'none' }}>
                    <img 
                      src={banner.desktopImageUrl} 
                      alt={banner.title} 
                      className="w-full h-full object-cover border-0"
                    />
                  </div>
                </div>

                {banner.mobileImageUrl && (
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-ink-muted uppercase mb-1">
                      <Smartphone className="w-3 h-3" />
                      <span>Mobile (16:9)</span>
                    </div>
                    <div className="aspect-[16/9] w-36 rounded overflow-hidden bg-black/5" style={{ border: 'none' }}>
                      <img 
                        src={banner.mobileImageUrl} 
                        alt={banner.title} 
                        className="w-full h-full object-cover border-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Banner Details & Action Controls */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-ink text-sm sm:text-base">
                        {banner.title || 'Banner Sem Título'}
                      </h3>
                      {banner.subtitle && (
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => toggleBannerStatus(banner.id)}
                      className="cursor-pointer shrink-0 flex items-center gap-1"
                      title="Alternar Ativo/Inativo"
                    >
                      {banner.active ? (
                        <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                          <ToggleRight className="w-5 h-5 text-success" />
                          <span>Ativo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ink-muted text-xs font-semibold">
                          <ToggleLeft className="w-5 h-5 text-ink-muted" />
                          <span>Inativo</span>
                        </span>
                      )}
                    </button>
                  </div>

                  {banner.linkUrl && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-primary truncate">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{banner.linkUrl}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-borderSoft flex items-center justify-between">
                  <span className="text-[11px] text-ink-muted font-medium">
                    Ordem de exibição: #{banner.order}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="h-7 px-2.5 rounded-xs bg-surface-warm hover:bg-black/[0.05] text-ink text-xs font-medium border border-borderSoft transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="h-7 px-2 rounded-xs hover:bg-rose-50 text-rose-600 text-xs transition-colors flex items-center justify-center cursor-pointer"
                      title="Excluir Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Criar/Editar Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface rounded-md border border-borderSoft shadow-xl w-full max-w-2xl my-6 overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-borderSoft flex items-center justify-between bg-surface-warm/50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-ink text-sm sm:text-base">
                  {editingBanner ? 'Editar Banner' : 'Cadastrar Novo Banner'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-sm flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Quick Picker */}
            <div className="px-4 sm:px-5 py-2.5 bg-surface-warm/80 border-b border-borderSoft flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="font-bold text-ink-muted shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent-amber-deep" /> Exemplos rápidos:
              </span>
              <button
                type="button"
                onClick={() => applyPreset({
                  title: 'Kits de Formação LLC nos EUA',
                  subtitle: 'Articles of Organization, Operating Agreement e Guia EIN completo',
                  desktop: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
                  mobile: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'
                })}
                className="px-2 py-0.5 rounded bg-white hover:bg-black/5 text-ink border border-borderSoft shrink-0 cursor-pointer"
              >
                LLC USA
              </button>
              <button
                type="button"
                onClick={() => applyPreset({
                  title: 'Contas Corporativas Globais & Dossiês',
                  subtitle: 'Validação e abertura de contas internacionais com compliance oficial',
                  desktop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
                  mobile: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop'
                })}
                className="px-2 py-0.5 rounded bg-white hover:bg-black/5 text-ink border border-borderSoft shrink-0 cursor-pointer"
              >
                Contas Globais
              </button>
              <button
                type="button"
                onClick={() => applyPreset({
                  title: 'Documentos Físicos & Remessas com Apostilamento',
                  subtitle: 'Papel especial moeda e autenticação com entrega expressa Sedex',
                  desktop: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=1600&auto=format&fit=crop',
                  mobile: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop'
                })}
                className="px-2 py-0.5 rounded bg-white hover:bg-black/5 text-ink border border-borderSoft shrink-0 cursor-pointer"
              >
                Físico Haia
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Título do Banner (opcional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Kits Oficiais de Formação LLC"
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Link de Destino (opcional)</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Ex: # ou https://..."
                    className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Subtítulo / Descrição (opcional)</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: Minutas contratuais revisadas e operacionais para 2026"
                  className="w-full px-3 py-2 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                />
              </div>

              {/* Desktop Image Configuration */}
              <div className="p-3 bg-surface-warm/60 rounded-sm border border-borderSoft space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <Monitor className="w-4 h-4 text-primary" />
                    <span>Imagem Desktop (Proporção 21:7 / 16:6)</span>
                  </div>
                  <label className="h-6 px-2 rounded-xs bg-white border border-borderSoft text-ink text-[11px] font-medium flex items-center gap-1 cursor-pointer hover:bg-black/5">
                    <Upload className="w-3 h-3 text-ink-muted" />
                    <span>Subir Arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'desktop')}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={desktopImageUrl}
                  onChange={(e) => setDesktopImageUrl(e.target.value)}
                  placeholder="URL da imagem desktop (ex: https://...)"
                  className="w-full px-3 py-2 bg-white border border-borderSoft rounded-sm text-ink font-mono text-[11px]"
                />
                <p className="text-[10px] text-ink-muted">
                  Recomendado: 1600x530px ou 1920x640px. Renderizado na tela do computador sem bordas.
                </p>
              </div>

              {/* Mobile Image Configuration */}
              <div className="p-3 bg-surface-warm/60 rounded-sm border border-borderSoft space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Imagem Mobile (Proporção 16:9 / 4:3)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMobileImageUrl(desktopImageUrl)}
                      className="h-6 px-2 rounded-xs bg-white border border-borderSoft text-ink text-[10px] hover:bg-black/5 cursor-pointer"
                    >
                      Copiar da Desktop
                    </button>
                    <label className="h-6 px-2 rounded-xs bg-white border border-borderSoft text-ink text-[11px] font-medium flex items-center gap-1 cursor-pointer hover:bg-black/5">
                      <Upload className="w-3 h-3 text-ink-muted" />
                      <span>Subir Arquivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'mobile')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  value={mobileImageUrl}
                  onChange={(e) => setMobileImageUrl(e.target.value)}
                  placeholder="URL da imagem mobile (opcional - usa a desktop caso vazia)"
                  className="w-full px-3 py-2 bg-white border border-borderSoft rounded-sm text-ink font-mono text-[11px]"
                />
                <p className="text-[10px] text-ink-muted">
                  Recomendado: 800x450px ou 750x500px. Proporção vertical/panorâmica adequada para celulares.
                </p>
              </div>

              {/* Live Preview Mode Switcher */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-[11px] uppercase tracking-wider">
                    Pré-visualização ao Vivo (Sem Bordas):
                  </span>
                  <div className="flex items-center gap-1 bg-surface-warm p-0.5 rounded border border-borderSoft">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('desktop')}
                      className={`h-6 px-2 rounded-xs text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                        previewMode === 'desktop' ? 'bg-white text-ink shadow-xs' : 'text-ink-muted'
                      }`}
                    >
                      <Monitor className="w-3 h-3" /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('mobile')}
                      className={`h-6 px-2 rounded-xs text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                        previewMode === 'mobile' ? 'bg-white text-ink shadow-xs' : 'text-ink-muted'
                      }`}
                    >
                      <Smartphone className="w-3 h-3" /> Mobile
                    </button>
                  </div>
                </div>

                {/* Preview Box - Strictly NO borders on the image */}
                <div className={`mx-auto bg-black/10 overflow-hidden rounded-md ${
                  previewMode === 'desktop' ? 'w-full aspect-[21/7]' : 'max-w-xs aspect-[16/9]'
                }`} style={{ border: 'none' }}>
                  {desktopImageUrl ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={previewMode === 'desktop' ? desktopImageUrl : (mobileImageUrl || desktopImageUrl)} 
                        alt="Preview" 
                        className="w-full h-full object-cover block"
                        style={{ border: 'none' }}
                      />
                      {(title || subtitle) && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-3 text-white pointer-events-none">
                          {title && <p className="font-bold text-xs sm:text-sm">{title}</p>}
                          {subtitle && <p className="text-[10px] text-white/90 line-clamp-1">{subtitle}</p>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
                      Insira uma URL ou envie um arquivo para ver a prévia
                    </div>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-borderSoft">
                <div>
                  <div className="font-semibold text-ink">Status de Exibição</div>
                  <div className="text-[11px] text-ink-muted">Ative para exibir na página inicial da loja</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className="cursor-pointer"
                >
                  {active ? (
                    <span className="inline-flex items-center gap-1 text-success font-medium">
                      <ToggleRight className="w-6 h-6 text-success" />
                      <span>Ativo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-muted font-medium">
                      <ToggleLeft className="w-6 h-6 text-ink-muted" />
                      <span>Inativo</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-borderSoft flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3 rounded-sm bg-surface-warm hover:bg-black/[0.05] text-ink font-medium border border-borderSoft cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-sm bg-primary hover:bg-primary-pressed text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Banner</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};
