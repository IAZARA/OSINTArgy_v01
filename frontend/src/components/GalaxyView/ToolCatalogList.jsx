import React, { useMemo } from 'react';
import { ArrowUpRight, FolderGit2, Globe2, SearchX } from 'lucide-react';
import { DIFFICULTY_LABELS, isRepository, TYPE_LABELS } from './catalogModel';

export default function ToolCatalogList({ tools = [], categories = [], onToolSelect, onReset, grouped = true }) {
  const groups = useMemo(() => grouped ? categories.map((category) => ({ category, tools: tools.filter((tool) => tool.category === category.id) })).filter((group) => group.tools.length) : [{ category: { id: 'all', name: 'Resultados ordenados', color: '#7cd4ff' }, tools }], [categories, tools, grouped]);
  if (!tools.length) return <div className="catalog-list-empty"><SearchX size={30} aria-hidden="true" /><h2>No hay fuentes con esos filtros</h2><p>Quitá una condición o probá otros términos para ampliar la búsqueda.</p><button type="button" className="catalog-action" onClick={onReset}>Ver todas las fuentes</button></div>;
  return <section className="catalog-list-view" aria-label="Lista de fuentes y repositorios">
    {grouped && groups.length > 1 && <nav className="catalog-category-index" aria-label="Ir a una categoría">{groups.map(({ category, tools: items }) => <a key={category.id} href={`#catalog-category-${category.id}`} style={{ '--category-color': category.color }}>{category.name}<strong>{items.length}</strong></a>)}</nav>}
    <div className="catalog-list-groups">{groups.map(({ category, tools: items }) => <section key={category.id} id={`catalog-category-${category.id}`} className="catalog-category-section" style={{ '--category-color': category.color || '#7cd4ff' }} aria-labelledby={`catalog-category-title-${category.id}`}>
      <header className="catalog-category-header"><div><span className="catalog-eyebrow">{grouped ? 'Colección' : 'Catálogo'}</span><h2 id={`catalog-category-title-${category.id}`}>{category.name}</h2>{category.description && <p>{category.description}</p>}</div><span className="catalog-category-count">{items.length}</span></header>
      <div className="catalog-tool-list">{items.map((tool, index) => <button key={tool.id} type="button" className="catalog-tool-row" onClick={() => onToolSelect(tool)} aria-label={`Ver ficha de ${tool.name}`}>
        <span className="catalog-tool-row__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="catalog-tool-row__content"><strong>{tool.name}</strong><span>{tool.description || tool.utility}</span><span className="catalog-tool-row__tags"><small>{isRepository(tool) ? <><FolderGit2 size={11} aria-hidden="true" /> Repositorio</> : <><Globe2 size={11} aria-hidden="true" /> {TYPE_LABELS[tool.type] || tool.type}</>}</small><small>{tool.region}</small><small>{tool.is_free === true ? 'Acceso gratuito' : tool.is_free === false ? 'Pago / freemium' : 'Costo sin informar'}</small><small>{DIFFICULTY_LABELS[tool.difficulty_level] || 'Nivel sin informar'}</small></span></span><ArrowUpRight size={19} className="catalog-tool-row__arrow" aria-hidden="true" />
      </button>)}</div>
    </section>)}</div>
  </section>;
}
