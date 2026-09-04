import React from 'react';
import { Check, Filter, FolderGit2, RotateCcw, Search, X } from 'lucide-react';
import { catalogFacets, DIFFICULTY_LABELS, LANGUAGE_LABELS, TYPE_LABELS } from './catalogModel';

const SelectFilter = ({ label, value, onChange, options, allLabel = 'Todas' }) => (
  <label className="catalog-filter-field">
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{allLabel}</option>
      {options.map(({ value: optionValue, label: optionLabel }) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  </label>
);

export default function CatalogFilters({ tools, categories, category, query, filters, onFilter, onCategory, onQuery, onReset, count, sort, onSort, expanded, onExpanded }) {
  const facet = (field, labels = {}) => catalogFacets(tools, field).map((value) => ({ value, label: labels[value] || value.charAt(0).toUpperCase() + value.slice(1) }));
  const activeCount = Object.values(filters).filter(Boolean).length + Number(Boolean(category)) + Number(Boolean(query.trim()));
  return (
    <section className="catalog-filters" aria-label="Buscar y filtrar fuentes">
      <div className="catalog-filters__main">
        <label className="catalog-search">
          <Search size={19} aria-hidden="true" />
          <span className="catalog-sr-only">Buscar fuentes, repositorios o etiquetas</span>
          <input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Buscar fuentes, repos o etiquetas…" />
        </label>
        <button type="button" className={`catalog-action ${filters.repositoriesOnly ? 'is-active' : ''}`} aria-pressed={filters.repositoriesOnly} onClick={() => onFilter('repositoriesOnly', !filters.repositoriesOnly)}>
          <FolderGit2 size={17} aria-hidden="true" /> Solo repositorios {filters.repositoriesOnly && <Check size={14} aria-hidden="true" />}
        </button>
        <button type="button" className="catalog-action" aria-expanded={expanded} aria-controls="catalog-filter-options" onClick={() => onExpanded(!expanded)}>
          <Filter size={17} aria-hidden="true" /> Filtros {activeCount > 0 && <b>{activeCount}</b>}
        </button>
      </div>
      {expanded && <div id="catalog-filter-options" className="catalog-filter-options">
        <SelectFilter label="Categoría" value={category} onChange={onCategory} options={categories.map((item) => ({ value: item.id, label: item.name }))} />
        <SelectFilter label="Región" value={filters.region} onChange={(value) => onFilter('region', value)} options={facet('region')} />
        <SelectFilter label="Tipo de recurso" value={filters.type} onChange={(value) => onFilter('type', value)} options={facet('type', TYPE_LABELS)} allLabel="Todos" />
        <SelectFilter label="Costo" value={filters.cost} onChange={(value) => onFilter('cost', value)} options={[{ value: 'free', label: 'Acceso gratuito' }, { value: 'paid', label: 'De pago / freemium' }]} allLabel="Cualquiera" />
        <SelectFilter label="Registro" value={filters.registration} onChange={(value) => onFilter('registration', value)} options={[{ value: 'none', label: 'Sin registro' }, { value: 'required', label: 'Requiere registro' }]} allLabel="Cualquiera" />
        <SelectFilter label="Dificultad" value={filters.difficulty} onChange={(value) => onFilter('difficulty', value)} options={facet('difficulty_level', DIFFICULTY_LABELS)} />
        <SelectFilter label="Idioma" value={filters.language} onChange={(value) => onFilter('language', value)} options={facet('language', LANGUAGE_LABELS)} allLabel="Todos" />
      </div>}
      <div className="catalog-results-bar">
        <p role="status"><strong>{count}</strong> de {tools.length} fuentes{category && <span> · {categories.find((item) => item.id === category)?.name}</span>}</p>
        {activeCount > 0 && <button type="button" className="catalog-reset" onClick={onReset}><RotateCcw size={14} aria-hidden="true" /> Limpiar filtros</button>}
        <label className="catalog-sort"><span>Ordenar</span><select aria-label="Ordenar fuentes" value={sort} onChange={(event) => onSort(event.target.value)}>
          <option value="name">Nombre A–Z</option><option value="name-desc">Nombre Z–A</option><option value="updated">Actualización reciente</option><option value="rating">Valoración del catálogo</option>
        </select></label>
      </div>
      {activeCount > 0 && <div className="catalog-active-filters" aria-label="Filtros activos">
        {query.trim() && <button type="button" onClick={() => onQuery('')} aria-label="Quitar búsqueda">“{query}” <X size={12} /></button>}
        {category && <button type="button" onClick={() => onCategory('')} aria-label="Quitar categoría">{categories.find((item) => item.id === category)?.name} <X size={12} /></button>}
        {Object.entries(filters).filter(([, value]) => Boolean(value)).map(([key, value]) => {
          const labels = { region: `Región: ${value}`, type: TYPE_LABELS[value], cost: value === 'free' ? 'Acceso gratuito' : 'Pago / freemium', registration: value === 'none' ? 'Sin registro' : 'Requiere registro', difficulty: DIFFICULTY_LABELS[value], language: LANGUAGE_LABELS[value], repositoriesOnly: 'Solo repositorios' };
          return <button key={key} type="button" onClick={() => onFilter(key, key === 'repositoriesOnly' ? false : '')} aria-label={`Quitar filtro ${labels[key] || value}`}>{labels[key] || value} <X size={12} /></button>;
        })}
      </div>}
    </section>
  );
}
