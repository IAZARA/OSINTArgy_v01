import React, { useMemo } from 'react';
import { ArrowRight, ExternalLink, SearchX, Sparkles } from 'lucide-react';

const sortByName = (firstTool, secondTool) =>
  firstTool.name.localeCompare(secondTool.name, 'es', { sensitivity: 'base' });

const ToolCatalogList = ({
  tools = [],
  categories = [],
  focusedCategory = null,
  onToolSelect
}) => {
  const groups = useMemo(
    () => categories
      .map((category) => ({
        category,
        tools: tools
          .filter((tool) => tool.category === category.id)
          .sort(sortByName)
      }))
      .filter((group) => group.tools.length > 0),
    [categories, tools]
  );

  const categoryLabel = groups.length === 1 ? 'categoría' : 'categorías';
  const toolLabel = tools.length === 1 ? 'herramienta' : 'herramientas';

  return (
    <section className="catalog-list-view" aria-labelledby="catalog-list-title">
      <div className="catalog-list-view__inner">
        <header className="catalog-list-hero">
          <div className="catalog-list-hero__copy">
            <span className="catalog-list-eyebrow">
              <Sparkles size={16} aria-hidden="true" />
              Catálogo completo
            </span>
            <h1 id="catalog-list-title">
              {focusedCategory
                ? focusedCategory.name
                : 'Todas las herramientas, sin perder ninguna.'}
            </h1>
            <p>
              {focusedCategory
                ? `Estas son las ${tools.length} herramientas de la categoría. La galaxia muestra una selección visual; acá podés revisar el listado completo.`
                : 'Explorá el catálogo de OSINTArgy agrupado por categoría. Abrí cualquier ficha para conocer su utilidad o sumarla a una investigación.'}
            </p>
          </div>

          <div className="catalog-list-summary" aria-label="Resumen del catálogo">
            <div>
              <strong>{tools.length}</strong>
              <span>{toolLabel}</span>
            </div>
            <div>
              <strong>{groups.length}</strong>
              <span>{categoryLabel}</span>
            </div>
          </div>
        </header>

        {groups.length > 1 && (
          <nav className="catalog-category-index" aria-label="Ir a una categoría">
            {groups.map(({ category, tools: categoryTools }) => (
              <a
                key={category.id}
                href={`#catalog-category-${category.id}`}
                style={{ '--category-color': category.color || '#00D4FF' }}
              >
                <span>{category.name}</span>
                <strong>{categoryTools.length}</strong>
              </a>
            ))}
          </nav>
        )}

        {groups.length === 0 ? (
          <div className="catalog-list-empty">
            <SearchX size={28} aria-hidden="true" />
            <h2>No encontramos herramientas</h2>
            <p>Probá con otro término o limpiá los filtros para volver al catálogo completo.</p>
          </div>
        ) : (
          <div className="catalog-list-groups">
            {groups.map(({ category, tools: categoryTools }) => (
              <section
                key={category.id}
                id={`catalog-category-${category.id}`}
                className="catalog-category-section"
                style={{ '--category-color': category.color || '#00D4FF' }}
                aria-labelledby={`catalog-category-title-${category.id}`}
              >
                <header className="catalog-category-header">
                  <div className="catalog-category-header__identity">
                    <span className="catalog-category-icon" aria-hidden="true">
                      {category.icon || '✦'}
                    </span>
                    <div>
                      <span className="catalog-category-kicker">Categoría</span>
                      <h2 id={`catalog-category-title-${category.id}`}>{category.name}</h2>
                      {category.description && <p>{category.description}</p>}
                    </div>
                  </div>
                  <span className="catalog-category-count">
                    <strong>{categoryTools.length}</strong>
                    {categoryTools.length === 1 ? ' herramienta' : ' herramientas'}
                  </span>
                </header>

                <div className="catalog-tool-list">
                  {categoryTools.map((tool, index) => (
                    <button
                      key={tool.id || `${category.id}-${tool.name}`}
                      type="button"
                      className="catalog-tool-row"
                      onClick={() => onToolSelect(tool)}
                      aria-label={`Ver ficha de ${tool.name}`}
                    >
                      <span className="catalog-tool-row__index" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="catalog-tool-row__content">
                        <strong>{tool.name}</strong>
                        <span>{tool.description || tool.utility || 'Herramienta OSINT'}</span>
                        {tool.tags?.length > 0 && (
                          <span className="catalog-tool-row__tags" aria-hidden="true">
                            {tool.tags.slice(0, 3).map((tag) => (
                              <small key={tag}>{tag}</small>
                            ))}
                          </span>
                        )}
                      </span>
                      <span className="catalog-tool-row__action" aria-hidden="true">
                        Ver ficha
                        {tool.url ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ToolCatalogList;
