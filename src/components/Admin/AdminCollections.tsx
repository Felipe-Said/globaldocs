import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Collection } from '../../types';
import { 
  Edit2, 
  Trash2, 
  X, 
  FolderPlus,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Plus,
  Tags
} from 'lucide-react';

export const AdminCollections: React.FC = () => {
  const { collections, addCollection, updateCollection, reorderCollections, deleteCollection, products } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [subcategoryInput, setSubcategoryInput] = useState('');
  const [badgeColor, setBadgeColor] = useState('bg-blue-50 text-blue-800 border-blue-200');
  const [active, setActive] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const orderedCollections = [...collections].sort((a, b) =>
    Number(a.homeOrder ?? 9999) - Number(b.homeOrder ?? 9999)
  );

  const moveCollection = async (id: string, direction: -1 | 1) => {
    const currentIndex = orderedCollections.findIndex(collection => collection.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedCollections.length) return;
    const reordered = [...orderedCollections];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    setReorderingId(id);
    await reorderCollections(reordered.map(collection => collection.id));
    setReorderingId(null);
  };

  const openCreateModal = () => {
    setEditingCollection(null);
    setName('');
    setSlug('');
    setDescription('');
    setSubcategories([]);
    setSubcategoryInput('');
    setBadgeColor('bg-blue-50 text-blue-800 border-blue-200');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (col: Collection) => {
    setEditingCollection(col);
    setName(col.name);
    setSlug(col.slug);
    setDescription(col.description);
    setSubcategories(Array.from(new Set([
      ...(col.subcategories || []),
      ...products.filter(product => product.collectionId === col.id).map(product => product.subcategory).filter((value): value is string => Boolean(value)),
    ])));
    setSubcategoryInput('');
    setBadgeColor(col.badgeColor || 'bg-blue-50 text-blue-800 border-blue-200');
    setActive(col.active);
    setIsModalOpen(true);
  };

  const addSubcategory = () => {
    const value = subcategoryInput.trim();
    if (!value || subcategories.some(item => item.toLocaleLowerCase('pt-BR') === value.toLocaleLowerCase('pt-BR'))) return;
    setSubcategories(current => [...current, value]);
    setSubcategoryInput('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (editingCollection) {
      updateCollection(editingCollection.id, {
        name,
        slug: generatedSlug,
        description,
        subcategories,
        badgeColor,
        active,
      });
    } else {
      addCollection({
        name,
        slug: generatedSlug,
        description,
        subcategories,
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

      <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-950">
        <ListOrdered className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Prioridade das coleções na home</p>
          <p className="mt-0.5 text-xs leading-relaxed text-blue-900/75">
            A posição abaixo define a ordem exibida aos clientes. Use as setas para colocar primeiro as coleções mais importantes.
          </p>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {orderedCollections.map((col, index) => {
          const count = getProductCountForCollection(col.id);

          return (
            <div 
              key={col.id}
              className="bg-surface rounded-md border border-borderSoft p-5 flex flex-col justify-between hover:shadow-notion-card transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex min-h-6 items-center rounded-full border border-primary/20 bg-primary/10 px-2 text-[11px] font-bold text-primary">
                      #{index + 1} na home
                    </span>
                    <span className={`inline-flex min-h-6 items-center text-[11px] font-semibold px-2 rounded-full border ${col.badgeColor || 'bg-surface-warm text-ink-muted'}`}>
                      {count} {count === 1 ? 'item vinculado' : 'itens vinculados'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void moveCollection(col.id, -1)}
                      disabled={index === 0 || reorderingId !== null}
                      className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-warm hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`Mover ${col.name} para cima`}
                      title="Mover para cima"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void moveCollection(col.id, 1)}
                      disabled={index === orderedCollections.length - 1 || reorderingId !== null}
                      className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-warm hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`Mover ${col.name} para baixo`}
                      title="Mover para baixo"
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => openEditModal(col)}
                      className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-ink rounded-sm hover:bg-surface-warm transition-colors cursor-pointer"
                      title="Editar Coleção"
                      aria-label={`Editar ${col.name}`}
                    >
                      <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir a coleção "${col.name}"?`)) {
                          deleteCollection(col.id);
                        }
                      }}
                      className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-accent-red rounded-sm hover:bg-surface-warm transition-colors cursor-pointer"
                      title="Excluir Coleção"
                      aria-label={`Excluir ${col.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-ink mb-1">
                  {col.name}
                </h3>
                <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed mb-3">
                  {col.description}
                </p>
                {(col.subcategories?.length || 0) > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5" aria-label={`Subcoleções de ${col.name}`}>
                    {col.subcategories!.slice(0, 4).map(subcategory => (
                      <span key={subcategory} className="inline-flex min-h-6 items-center rounded-full border border-borderSoft bg-surface-warm px-2 text-[10px] font-semibold text-ink-muted">
                        {subcategory}
                      </span>
                    ))}
                    {col.subcategories!.length > 4 && (
                      <span className="inline-flex min-h-6 items-center px-1 text-[10px] font-semibold text-ink-muted">
                        +{col.subcategories!.length - 4}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-[11px] font-mono text-ink-faint flex items-center justify-between">
                  <span>slug: /{col.slug}</span>
                  <Link
                    to={`/colecao/${col.slug || col.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-sans flex items-center gap-1 font-semibold"
                  >
                    <span>Ver página</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
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
                className="w-11 h-11 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-surface-warm cursor-pointer"
                aria-label="Fechar janela"
              >
                <X className="w-4 h-4" aria-hidden="true" />
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

              <fieldset className="rounded-sm border border-borderSoft bg-surface-warm/60 p-3">
                <legend className="px-1 text-xs font-bold text-ink">Subcoleções</legend>
                <p className="mb-2 text-[11px] leading-relaxed text-ink-muted">
                  Crie separações internas, como “Contas Gmail” e “Google Ads”. Elas ficarão disponíveis no cadastro dos produtos desta coleção.
                </p>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Tags className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                    <input
                      type="text"
                      value={subcategoryInput}
                      onChange={(event) => setSubcategoryInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addSubcategory();
                        }
                      }}
                      placeholder="Nome da subcoleção"
                      className="h-11 w-full rounded-sm border border-borderSoft bg-white pl-9 pr-3 text-ink focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addSubcategory}
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-sm bg-ink px-3 font-semibold text-white transition-colors hover:bg-black/80"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Adicionar
                  </button>
                </div>
                {subcategories.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {subcategories.map(subcategory => (
                      <span key={subcategory} className="inline-flex min-h-8 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 pl-3 pr-1 text-[11px] font-semibold text-primary">
                        {subcategory}
                        <button
                          type="button"
                          onClick={() => setSubcategories(current => current.filter(item => item !== subcategory))}
                          className="inline-flex size-7 items-center justify-center rounded-full transition-colors hover:bg-primary/10"
                          aria-label={`Remover subcoleção ${subcategory}`}
                        >
                          <X className="size-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] text-ink-muted">Nenhuma subcoleção cadastrada.</p>
                )}
              </fieldset>

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
