import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Collection } from '../../types';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  FolderPlus,
  Box,
  FileText
} from 'lucide-react';

export const AdminCollections: React.FC = () => {
  const { collections, addCollection, updateCollection, deleteCollection, products } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [badgeColor, setBadgeColor] = useState('bg-blue-50 text-blue-800 border-blue-200');
  const [active, setActive] = useState(true);

  const openCreateModal = () => {
    setEditingCollection(null);
    setName('');
    setSlug('');
    setDescription('');
    setBadgeColor('bg-blue-50 text-blue-800 border-blue-200');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (col: Collection) => {
    setEditingCollection(col);
    setName(col.name);
    setSlug(col.slug);
    setDescription(col.description);
    setBadgeColor(col.badgeColor || 'bg-blue-50 text-blue-800 border-blue-200');
    setActive(col.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (editingCollection) {
      updateCollection(editingCollection.id, {
        name,
        slug: generatedSlug,
        description,
        badgeColor,
        active,
      });
    } else {
      addCollection({
        name,
        slug: generatedSlug,
        description,
        badgeColor,
        active,
      });
    }
    setIsModalOpen(false);
  };

  const getProductCountForCollection = (colId: string) => {
    return products.filter(p => p.collectionId === colId).length;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Gestão de Coleções de Arquivos</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Organize os arquivos e serviços da loja em coleções temáticas (ex: Kits LLC, Contas Globais, Dossiês & Contratos Digitais)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="h-9 px-4 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Criar Nova Coleção</span>
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((col) => {
          const count = getProductCountForCollection(col.id);

          return (
            <div 
              key={col.id}
              className="bg-surface rounded-md border border-borderSoft p-5 flex flex-col justify-between hover:shadow-notion-card transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${col.badgeColor || 'bg-surface-warm text-ink-muted'}`}>
                    {count} {count === 1 ? 'item vinculado' : 'itens vinculados'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(col)}
                      className="p-1 text-ink-muted hover:text-ink rounded hover:bg-surface-warm transition-colors cursor-pointer"
                      title="Editar Coleção"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir a coleção "${col.name}"?`)) {
                          deleteCollection(col.id);
                        }
                      }}
                      className="p-1 text-ink-muted hover:text-accent-red rounded hover:bg-surface-warm transition-colors cursor-pointer"
                      title="Excluir Coleção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-ink mb-1">
                  {col.name}
                </h3>
                <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed mb-3">
                  {col.description}
                </p>
                <div className="text-[11px] font-mono text-ink-faint">
                  slug: /{col.slug}
                </div>
              </div>

              <div className="pt-3 border-t border-borderSoft mt-4 flex items-center justify-between text-xs">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${col.active ? 'text-success' : 'text-ink-muted'}`}>
                  {col.active ? '✓ Ativa na Loja' : '○ Oculta'}
                </span>
                <span className="text-[11px] text-ink-muted">
                  ID: {col.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Create/Edit Collection */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-surface w-full max-w-lg rounded-md border border-borderSoft shadow-notion-modal overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-borderSoft flex items-center justify-between">
              <h3 className="font-bold text-base text-ink">
                {editingCollection ? 'Editar Coleção' : 'Criar Nova Coleção'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-surface-warm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Nome da Coleção</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Formação & Abertura de LLC nos EUA"
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink font-semibold focus:bg-white focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Slug / Identificador URL</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Ex: llc-usa"
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink font-mono focus:bg-white focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Descrição</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o propósito desta coleção para os clientes..."
                  className="w-full px-3 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Estilo do Badge / Cor</label>
                <select
                  value={badgeColor}
                  onChange={(e) => setBadgeColor(e.target.value)}
                  className="w-full px-2 py-1.5 bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white"
                >
                  <option value="bg-emerald-50 text-emerald-800 border-emerald-200">Verde Esmeralda (Corporativo / LLC)</option>
                  <option value="bg-indigo-50 text-indigo-800 border-indigo-200">Índigo / Roxo (Contas & Validação)</option>
                  <option value="bg-amber-50 text-amber-800 border-amber-200">Âmbar / Dourado (Físico / Papel Moeda)</option>
                  <option value="bg-blue-50 text-blue-800 border-blue-200">Azul Notional (Digital & Templates)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span className="font-medium text-ink">Coleção ativa e visível no catálogo</span>
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
                  {editingCollection ? 'Salvar Alterações' : 'Criar Coleção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
