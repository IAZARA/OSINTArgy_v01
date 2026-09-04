import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, Briefcase, ExternalLink, FolderGit2, LayoutList, Sparkles, Star, X } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { useFavorites, useToolHistory } from '@hooks/useTools';
import { useCases } from '@/context/CaseContext';
import { Link, useNavigate } from '@/lib/router';
import toast from 'react-hot-toast';
import CatalogFilters from './CatalogFilters';
import GalaxyMap from './GalaxyMap';
import ToolCatalogList from './ToolCatalogList';
import { DIFFICULTY_LABELS, EMPTY_FILTERS, filterCatalog, isRepository, LANGUAGE_LABELS, safeToolUrl, sortCatalog, TYPE_LABELS } from './catalogModel';
import './GalaxyView.css';

function ToolPreview({ tool, category, onClose, onAddCase, onOpenAndRecord, onOpen, caseName, favorite, onFavorite }) {
  const dialogRef = useRef(null);
  const sourceUrl = safeToolUrl(tool.url);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return <dialog ref={dialogRef} className="catalog-tool-dialog" aria-labelledby="catalog-tool-dialog-title" onCancel={onClose} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="catalog-tool-dialog__inner">
      <header className="catalog-tool-dialog__header"><div><span className="catalog-eyebrow">{category?.name || 'Fuente OSINT'}</span><h2 id="catalog-tool-dialog-title">{tool.name}</h2></div><button type="button" className="catalog-dialog-close" onClick={onClose} aria-label="Cerrar ficha"><X size={20} /></button></header>
      <div className="catalog-tool-dialog__body"><p className="catalog-tool-description">{tool.description}</p>{tool.utility && <section><h3>Para qué sirve</h3><p>{tool.utility}</p></section>}
        <dl className="catalog-tool-metadata">
          <div><dt>Formato</dt><dd>{isRepository(tool) ? 'Repositorio · ' : ''}{TYPE_LABELS[tool.type] || tool.type || 'Sin informar'}</dd></div>
          <div><dt>Cobertura</dt><dd>{tool.region || 'Sin informar'}</dd></div>
          <div><dt>Acceso</dt><dd>{tool.is_free === true ? 'Acceso gratuito' : tool.is_free === false ? 'Pago / freemium' : 'Sin informar'}</dd></div>
          <div><dt>Cuenta</dt><dd>{tool.requires_registration === true ? 'Requiere registro' : tool.requires_registration === false ? 'Sin registro' : 'Sin informar'}</dd></div>
          <div><dt>Nivel</dt><dd>{DIFFICULTY_LABELS[tool.difficulty_level] || 'Sin informar'}</dd></div>
          <div><dt>Idioma</dt><dd>{LANGUAGE_LABELS[tool.language] || tool.language || 'Sin informar'}</dd></div>
        </dl>
        {tool.tags?.length > 0 && <div className="catalog-tool-tags" aria-label="Etiquetas">{tool.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        {sourceUrl && <a className="catalog-source-url" href={sourceUrl} target={sourceUrl.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer" onClick={() => onOpen(tool)}>{sourceUrl}<ExternalLink size={13} aria-hidden="true" /></a>}
        <p className="catalog-source-note">Las condiciones de acceso pueden cambiar. Confirmá los requisitos en la fuente antes de usarla.</p>
      </div>
      <footer className="catalog-tool-dialog__actions">
        {sourceUrl && <a className="catalog-action catalog-action--primary" href={sourceUrl} target={sourceUrl.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer" onClick={() => onOpen(tool)}>Abrir fuente <ArrowUpRight size={17} /></a>}
        <button type="button" className="catalog-action" onClick={() => onAddCase(tool)}><Briefcase size={16} /> {caseName ? 'Agregar al caso' : 'Elegir caso'}</button>
        {sourceUrl && <button type="button" className="catalog-action" onClick={() => onOpenAndRecord(tool)}>Abrir y registrar</button>}
        {onFavorite && <button type="button" className={`catalog-action ${favorite ? 'is-active' : ''}`} onClick={() => onFavorite(tool.id)} aria-pressed={favorite}><Star size={16} /> {favorite ? 'Guardada' : 'Guardar'}</button>}
      </footer>
      {caseName && <p className="catalog-dialog-case">Caso activo: {caseName}</p>}
    </div>
  </dialog>;
}

export default function GalaxyView({ tools = [], categories = [], onCategorySelect, selectedCategory, searchQuery = '', onSearchChange }) {
  const [viewMode, setViewMode] = useState('galaxy');
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [sort, setSort] = useState('name');
  const [expanded, setExpanded] = useState(() => window.matchMedia('(min-width: 621px)').matches);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [toolPreview, setToolPreview] = useState(null);
  const [grouped, setGrouped] = useState(true);
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToHistory } = useToolHistory();
  const { activeCase, addFindingFromTool } = useCases();
  const navigate = useNavigate();
  const categoryId = selectedCategory?.id || '';
  const query = onSearchChange ? searchQuery : localQuery;
  useEffect(() => { setLocalQuery(searchQuery); }, [searchQuery]);
  const setQuery = (value) => { setLocalQuery(value); onSearchChange?.(value); };
  const selectCategory = (id) => onCategorySelect?.(categories.find((category) => category.id === id) || null);
  const resetFilters = () => { setFilters({ ...EMPTY_FILTERS }); setQuery(''); selectCategory(''); };
  const filteredTools = useMemo(() => sortCatalog(filterCatalog(tools, { ...filters, category: categoryId, query }), sort), [tools, filters, categoryId, query, sort]);
  const repositoryCount = useMemo(() => tools.filter(isRepository).length, [tools]);

  const addToolToActiveCase = useCallback(async (tool, { openSource = false } = {}) => {
    if (!activeCase) { toast('Creá o seleccioná un caso para registrar esta fuente.'); navigate('/investigations'); return; }
    const url = safeToolUrl(tool.url);
    if (openSource && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      addToHistory(tool);
      const params = new URLSearchParams({ view: 'findings', new: '1', toolId: tool.id || '', toolName: tool.name || '', sourceUrl: url });
      setToolPreview(null);
      navigate(`/investigation-board/${activeCase.id}?${params.toString()}`);
      return;
    }
    try {
      await addFindingFromTool(tool, { title: `Revisar con ${tool.name}`, notes: 'Fuente agregada desde el catálogo para evaluar durante la investigación.' });
      toast.success(`Agregada a ${activeCase.name}.`);
    } catch (error) { toast.error(error.message); }
  }, [activeCase, addFindingFromTool, addToHistory, navigate]);

  return <div className={`galaxy-view galaxy-view--${viewMode}`}>
    <div className="catalog-shell">
      <header className="catalog-hero">
        <div className="catalog-hero__copy"><span className="catalog-eyebrow"><span className="catalog-status-dot" /> OSINTArgy / Explorador de fuentes</span><h1>Conectá las piezas.<br /><span>Encontrá tu próxima fuente.</span></h1><p>De una pregunta a una pista: explorá herramientas, datos abiertos y repositorios para investigar con criterio.</p><div className="catalog-hero__stats"><span><strong>{tools.length}</strong> fuentes</span><span><strong>{categories.length}</strong> especialidades</span><span><FolderGit2 size={15} /><strong>{repositoryCount}</strong> repositorios</span></div></div>
        <div className="catalog-hero__aside"><Link className="catalog-academy-link" to="/academy"><BookOpen size={19} aria-hidden="true" /><span>Aprendé a investigar<small>Explorá la Academia OSINT</small></span><ArrowUpRight size={19} /></Link><div className="catalog-view-switcher" role="group" aria-label="Vista del catálogo"><button type="button" className={viewMode === 'galaxy' ? 'is-active' : ''} aria-pressed={viewMode === 'galaxy'} onClick={() => setViewMode('galaxy')}><Sparkles size={17} /> Galaxia</button><button type="button" className={viewMode === 'list' ? 'is-active' : ''} aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}><LayoutList size={17} /> Lista</button></div></div>
      </header>
      <CatalogFilters tools={tools} categories={categories} category={categoryId} query={query} filters={filters} onFilter={(key, value) => setFilters((previous) => ({ ...previous, [key]: value }))} onCategory={selectCategory} onQuery={setQuery} onReset={resetFilters} count={filteredTools.length} sort={sort} onSort={setSort} expanded={expanded} onExpanded={setExpanded} />
      {viewMode === 'galaxy' ? <GalaxyMap isObscured={Boolean(toolPreview)} tools={filteredTools} categories={categories} selectedCategory={categoryId} onCategorySelect={selectCategory} onToolSelect={setToolPreview} onShowList={() => setViewMode('list')} onReset={resetFilters} /> : <><div className="catalog-list-options"><label><input type="checkbox" checked={grouped} onChange={(event) => setGrouped(event.target.checked)} /> Agrupar por categoría</label><span>Seleccioná una fuente para ver su ficha.</span></div><ToolCatalogList tools={filteredTools} categories={categories} onToolSelect={setToolPreview} onReset={resetFilters} grouped={grouped} /></>}
    </div>
    {toolPreview && <ToolPreview tool={toolPreview} category={categories.find((category) => category.id === toolPreview.category)} onClose={() => setToolPreview(null)} onAddCase={addToolToActiveCase} onOpenAndRecord={(tool) => addToolToActiveCase(tool, { openSource: true })} onOpen={addToHistory} caseName={activeCase?.name} favorite={isFavorite(toolPreview.id)} onFavorite={user ? toggleFavorite : null} />}
  </div>;
}
