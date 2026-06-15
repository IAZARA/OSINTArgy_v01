import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CircularView.css';

const MAX_VISIBLE_TOOLS = 18;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getToolScore = (tool) => {
  const ratingScore = Number(tool.rating || 0) * 120;
  const usageScore = Math.log10(Number(tool.usage_count || 1) + 1) * 70;
  const freeBoost = tool.is_free ? 35 : 0;
  const registrationPenalty = tool.requires_registration ? 12 : 0;

  return ratingScore + usageScore + freeBoost - registrationPenalty;
};

const getInitials = (name = '') => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

const CircularView = ({ tools = [], categories = [], onCategorySelect, selectedCategory }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 640 });
  const [showCategories, setShowCategories] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(selectedCategory?.id || null);
  const [hoveredToolId, setHoveredToolId] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const updateDimensions = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: Math.max(320, rect.width || 960),
        height: Math.max(420, rect.height || 640)
      });
    };

    updateDimensions();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveCategoryId(selectedCategory?.id || null);
  }, [selectedCategory]);

  const toolCountByCategory = useMemo(() => tools.reduce((counts, tool) => {
    counts[tool.category] = (counts[tool.category] || 0) + 1;
    return counts;
  }, {}), [tools]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) || null,
    [activeCategoryId, categories]
  );

  const activeTools = useMemo(() => {
    if (!activeCategory) return [];

    return tools
      .filter((tool) => tool.category === activeCategory.id)
      .sort((a, b) => getToolScore(b) - getToolScore(a));
  }, [activeCategory, tools]);

  const visibleTools = activeTools.slice(0, MAX_VISIBLE_TOOLS);
  const hiddenToolsCount = Math.max(0, activeTools.length - visibleTools.length);
  const hoveredTool = activeTools.find((tool) => tool.id === hoveredToolId) || null;

  const center = {
    x: dimensions.width / 2,
    y: dimensions.height / 2
  };

  const graphRadius = clamp(
    Math.min(dimensions.width, dimensions.height) * 0.32,
    135,
    260
  );
  const toolRadius = clamp(graphRadius * 0.58, 86, 148);
  const isCompact = dimensions.width < 720;

  const categoryNodes = useMemo(() => {
    const count = Math.max(categories.length, 1);

    return categories.map((category, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      const countForCategory = toolCountByCategory[category.id] || 0;

      return {
        ...category,
        count: countForCategory,
        angle,
        x: center.x + Math.cos(angle) * graphRadius,
        y: center.y + Math.sin(angle) * graphRadius,
        size: clamp(46 + Math.sqrt(countForCategory) * 3, 48, 76)
      };
    });
  }, [categories, center.x, center.y, graphRadius, toolCountByCategory]);

  const toolNodes = useMemo(() => {
    const count = Math.max(visibleTools.length, 1);

    return visibleTools.map((tool, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      const score = getToolScore(tool);

      return {
        ...tool,
        angle,
        x: center.x + Math.cos(angle) * toolRadius,
        y: center.y + Math.sin(angle) * toolRadius,
        size: clamp(24 + score / 115, 28, 42)
      };
    });
  }, [center.x, center.y, toolRadius, visibleTools]);

  const handleCentralClick = () => {
    setShowCategories((current) => !current);
    setActiveCategoryId(null);
    setHoveredToolId(null);
    onCategorySelect?.(null);
  };

  const handleCategoryClick = (category) => {
    const nextCategoryId = activeCategoryId === category.id ? null : category.id;
    setActiveCategoryId(nextCategoryId);
    setHoveredToolId(null);
    onCategorySelect?.(nextCategoryId ? category : null);
  };

  const openTool = (tool) => {
    if (!tool.url) return;
    window.open(tool.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section ref={containerRef} className="circular-view-container" aria-label="Mapa relacional de herramientas OSINT">
      <div className="circular-view__header">
        <div>
          <p className="circular-view__kicker">Mapa relacional</p>
          <h2>Herramientas por categoría</h2>
        </div>
        <button
          className="circular-view__toggle"
          type="button"
          onClick={handleCentralClick}
        >
          {showCategories ? 'Ocultar categorías' : 'Mostrar categorías'}
        </button>
      </div>

      <div className="circular-view__stage">
        <svg
          className="circular-view__svg"
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          role="img"
          aria-label="Grafo radial de categorías y herramientas"
        >
          <defs>
            <radialGradient id="circular-center-gradient" cx="50%" cy="38%" r="66%">
              <stop offset="0%" stopColor="#0ac8ff" stopOpacity="0.34" />
              <stop offset="56%" stopColor="#0b5d78" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#051422" stopOpacity="0.12" />
            </radialGradient>
          </defs>

          <circle className="circular-view__orbit circular-view__orbit--outer" cx={center.x} cy={center.y} r={graphRadius} />
          {activeCategory && (
            <circle className="circular-view__orbit circular-view__orbit--inner" cx={center.x} cy={center.y} r={toolRadius} />
          )}

          {showCategories && categoryNodes.map((category) => (
            <line
              key={`category-link-${category.id}`}
              className={`circular-view__link ${activeCategoryId === category.id ? 'is-active' : ''}`}
              x1={center.x}
              y1={center.y}
              x2={category.x}
              y2={category.y}
            />
          ))}

          {activeCategory && toolNodes.map((tool) => (
            <line
              key={`tool-link-${tool.id}`}
              className={`circular-view__link circular-view__link--tool ${hoveredToolId === tool.id ? 'is-active' : ''}`}
              x1={center.x}
              y1={center.y}
              x2={tool.x}
              y2={tool.y}
            />
          ))}

          <g
            className="circular-view__center-node"
            tabIndex="0"
            role="button"
            aria-label="Alternar categorías"
            onClick={handleCentralClick}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCentralClick();
              }
            }}
          >
            <circle cx={center.x} cy={center.y} r={isCompact ? 52 : 64} />
            <circle cx={center.x} cy={center.y} r={isCompact ? 38 : 46} fill="url(#circular-center-gradient)" />
            <text x={center.x} y={center.y - 4} textAnchor="middle" className="circular-view__center-title">
              OSINTArgy
            </text>
            <text x={center.x} y={center.y + 17} textAnchor="middle" className="circular-view__center-meta">
              {tools.length} tools
            </text>
          </g>

          {showCategories && categoryNodes.map((category) => (
            <g
              key={category.id}
              className={`circular-view__category-node ${activeCategoryId === category.id ? 'is-active' : ''}`}
              transform={`translate(${category.x}, ${category.y})`}
              tabIndex="0"
              role="button"
              aria-label={`Seleccionar ${category.name}`}
              onClick={() => handleCategoryClick(category)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleCategoryClick(category);
                }
              }}
            >
              <circle r={category.size / 2} style={{ '--node-color': category.color || '#4A90E2' }} />
              <text y="-3" textAnchor="middle" className="circular-view__category-icon">
                {category.icon || getInitials(category.name)}
              </text>
              <text y={category.size / 2 + 18} textAnchor="middle" className="circular-view__category-count">
                {category.count}
              </text>
            </g>
          ))}

          {activeCategory && toolNodes.map((tool) => (
            <g
              key={tool.id}
              className={`circular-view__tool-node ${hoveredToolId === tool.id ? 'is-active' : ''}`}
              transform={`translate(${tool.x}, ${tool.y})`}
              tabIndex="0"
              role="button"
              aria-label={`Abrir ${tool.name}`}
              onMouseEnter={() => setHoveredToolId(tool.id)}
              onFocus={() => setHoveredToolId(tool.id)}
              onClick={() => openTool(tool)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openTool(tool);
                }
              }}
            >
              <circle r={tool.size / 2} />
              <text y="4" textAnchor="middle">
                {getInitials(tool.name) || 'T'}
              </text>
            </g>
          ))}
        </svg>

        <aside className="circular-view__panel" aria-live="polite">
          {activeCategory ? (
            <>
              <div className="circular-view__panel-head">
                <span className="circular-view__panel-icon">{activeCategory.icon}</span>
                <div>
                  <h3>{activeCategory.name}</h3>
                  <p>{activeTools.length} herramientas disponibles</p>
                </div>
              </div>

              {hoveredTool ? (
                <div className="circular-view__tool-card">
                  <strong>{hoveredTool.name}</strong>
                  <p>{hoveredTool.utility || hoveredTool.description}</p>
                  <dl>
                    <div>
                      <dt>Tipo</dt>
                      <dd>{hoveredTool.type}</dd>
                    </div>
                    <div>
                      <dt>Dificultad</dt>
                      <dd>{hoveredTool.difficulty_level}</dd>
                    </div>
                    <div>
                      <dt>Rating</dt>
                      <dd>{hoveredTool.rating}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="circular-view__hint">
                  Pasa por un nodo para ver contexto. Haz click para abrir la herramienta.
                </p>
              )}

              <ol className="circular-view__tool-list">
                {visibleTools.slice(0, 8).map((tool) => (
                  <li key={tool.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredToolId(tool.id)}
                      onFocus={() => setHoveredToolId(tool.id)}
                      onClick={() => openTool(tool)}
                    >
                      <span>{tool.name}</span>
                      <small>{tool.type}</small>
                    </button>
                  </li>
                ))}
              </ol>

              {hiddenToolsCount > 0 && (
                <p className="circular-view__more">
                  +{hiddenToolsCount} herramientas ocultas para mantener legible el gráfico.
                </p>
              )}
            </>
          ) : (
            <>
              <h3>Selecciona una categoría</h3>
              <p>
                El anillo exterior muestra volumen por categoría. Al seleccionar una, el centro se convierte en un mapa de herramientas priorizadas.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
};

export default CircularView;
