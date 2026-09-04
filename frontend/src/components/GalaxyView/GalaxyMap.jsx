import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, LocateFixed, Minus, Pause, Play, Plus, SearchX, Sparkles } from 'lucide-react';
import { buildConstellations, starPosition } from './catalogModel';
import './GalaxyMotion.css';

const INITIAL_CAMERA = { x: 0, y: 0, zoom: 1 };
const LIMIT = (value, min, max) => Math.max(min, Math.min(max, value));

export default function GalaxyMap({ tools, categories, selectedCategory, onCategorySelect, onToolSelect, onShowList, onReset, isObscured = false }) {
  const [camera, setCamera] = useState(INITIAL_CAMERA);
  const [hovered, setHovered] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 620px)').matches);
  const [motionPaused, setMotionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [inViewport, setInViewport] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const wasDragged = useRef(false);
  const constellations = useMemo(() => buildConstellations(categories, tools, compact), [categories, tools, compact]);
  const focused = constellations.find((item) => item.id === selectedCategory);
  const visible = focused ? [focused] : constellations;
  const representedCount = visible.reduce((count, item) => count + (focused ? item.tools.length : Math.min(10, item.tools.length)), 0);
  const worldWidth = compact ? 480 : 1200;
  const worldHeight = compact && !focused ? Math.ceil(categories.length / 2) * 137 + 91 : 720;
  const pointFor = (index, total) => {
    const point = starPosition(index, total, Boolean(focused));
    return compact && focused ? { x: point.x * .49, y: point.y * 1.25 } : point;
  };

  useEffect(() => {
    const media = window.matchMedia('(max-width: 620px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => { setCamera(INITIAL_CAMERA); setHovered(null); }, [selectedCategory, compact]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setInViewport(entry.isIntersecting), { threshold: 0 });
    observer.observe(svgRef.current);
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const motionRunning = !motionPaused && !reducedMotion && inViewport && pageVisible && !isDragging && !isObscured;
  const zoomBy = (amount) => setCamera((previous) => ({ ...previous, zoom: LIMIT(previous.zoom * amount, 0.65, 4) }));

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const onWheel = (event) => {
      if (event.ctrlKey || event.metaKey) { event.preventDefault(); zoomBy(event.deltaY > 0 ? 0.92 : 1.08); }
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    wasDragged.current = false;
    dragRef.current = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
  };
  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const previous = dragRef.current;
    if (!wasDragged.current && Math.hypot(event.clientX - previous.startX, event.clientY - previous.startY) < 5) return;
    svgRef.current?.setPointerCapture(event.pointerId);
    wasDragged.current = true;
    setIsDragging(true);
    setHovered(null);
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.max(worldWidth / rect.width, worldHeight / rect.height) / camera.zoom;
    setCamera((current) => ({ ...current, x: LIMIT(current.x - (event.clientX - previous.x) * ratio, -900, 900), y: LIMIT(current.y - (event.clientY - previous.y) * ratio, -650, 650) }));
    dragRef.current = { ...previous, x: event.clientX, y: event.clientY };
  };
  const finishDrag = () => { dragRef.current = null; setIsDragging(false); };
  const activate = (action) => (event) => {
    event.stopPropagation();
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    if (event.type === 'keydown') event.preventDefault();
    if (!wasDragged.current || event.type === 'keydown') action();
  };
  const onMapKey = (event) => {
    if (event.target !== event.currentTarget) return;
    const moves = { ArrowLeft: [-60, 0], ArrowRight: [60, 0], ArrowUp: [0, -60], ArrowDown: [0, 60] };
    if (moves[event.key]) { event.preventDefault(); setCamera((previous) => ({ ...previous, x: LIMIT(previous.x + moves[event.key][0] / previous.zoom, -900, 900), y: LIMIT(previous.y + moves[event.key][1] / previous.zoom, -650, 650) })); }
    if (['+', '='].includes(event.key)) { event.preventDefault(); zoomBy(1.25); }
    if (event.key === '-') { event.preventDefault(); zoomBy(0.8); }
    if (event.key === 'Home') { event.preventDefault(); setCamera(INITIAL_CAMERA); }
    if (event.key === 'Escape') onCategorySelect('');
  };

  return <section className="galaxy-workspace" aria-label="Explorador de constelaciones">
    <div className="galaxy-map-panel" data-motion={motionRunning ? 'running' : 'paused'}>
      <div className="galaxy-map-heading"><span className="galaxy-map-live" aria-hidden="true" /><span>{focused ? focused.name : 'Mapa de fuentes abiertas'}</span><small>{focused ? `${focused.tools.length} fuentes` : `${categories.length} constelaciones`}</small></div>
      {focused && <button type="button" className="galaxy-back" onClick={() => onCategorySelect('')}><ArrowLeft size={15} /> Todas las constelaciones</button>}
      <svg ref={svgRef} className={`galaxy-map ${compact ? 'galaxy-map--compact' : ''} ${isDragging ? 'is-dragging' : ''}`} style={compact ? { aspectRatio: `${worldWidth} / ${worldHeight}` } : undefined} viewBox={`${worldWidth / 2 - worldWidth / 2 / camera.zoom + camera.x} ${worldHeight / 2 - worldHeight / 2 / camera.zoom + camera.y} ${worldWidth / camera.zoom} ${worldHeight / camera.zoom}`} role="group" aria-label="Mapa interactivo. Usá las flechas para desplazarte, más y menos para el zoom e Inicio para centrar." tabIndex={0} onKeyDown={onMapKey} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}>
        <defs>
          <radialGradient id="galaxy-core-glow"><stop offset="0%" stopColor="#43bfff" stopOpacity=".13" /><stop offset="100%" stopColor="#43bfff" stopOpacity="0" /></radialGradient>
          <pattern id="galaxy-coordinate-grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#547991" strokeWidth=".5" opacity=".12" /></pattern>
        </defs>
        <rect x="-1600" y="-1200" width="4400" height="3120" fill="url(#galaxy-coordinate-grid)" />
        <ellipse className="galaxy-nebula" cx={worldWidth / 2} cy={worldHeight / 2} rx={worldWidth * .48} ry={worldHeight * .48} fill="url(#galaxy-core-glow)" aria-hidden="true" />
        {[230, 370, 535].map((radius, index) => <ellipse className="galaxy-orbital-track" key={radius} cx={worldWidth / 2} cy={worldHeight / 2} rx={radius * (compact ? .5 : 1)} ry={radius * (compact ? .9 : .6)} transform={`rotate(-16 ${worldWidth / 2} ${worldHeight / 2})`} fill="none" stroke="#6aa2bd" strokeWidth=".7" strokeDasharray="3 10" opacity=".15" style={{ animationDirection: index % 2 ? 'reverse' : 'normal' }} aria-hidden="true" />)}
        {Array.from({ length: 85 }, (_, index) => <circle className={index % 3 === 0 ? 'galaxy-distant-star' : undefined} key={index} cx={(index * 167.37) % worldWidth} cy={(index * 97.53) % worldHeight} r={index % 8 === 0 ? 1.7 : .8} fill="#d3ebfa" opacity={index % 3 === 0 ? .4 : .15} style={{ '--twinkle-delay': `${-(index % 11) * .73}s`, '--twinkle-duration': `${4 + index % 5}s` }} aria-hidden="true" />)}
        {!tools.length ? <g className="galaxy-no-results" aria-hidden="true"><text x={worldWidth / 2} y="335">Ajustá los filtros para encontrar fuentes</text><text x={worldWidth / 2} y="370" className="galaxy-no-results__hint">También podés volver al catálogo completo.</text></g> : visible.map((cluster, clusterIndex) => {
          const x = focused ? worldWidth / 2 : cluster.x;
          const y = focused ? 350 : cluster.y;
          const stars = focused ? cluster.tools : cluster.tools.slice(0, 10);
          const color = cluster.color === '#424242' || cluster.color === '#795548' ? '#c3a990' : cluster.color || '#7cd4ff';
          return <g key={cluster.id} transform={`translate(${x} ${y})`} className={`galaxy-cluster ${!cluster.tools.length ? 'is-empty' : ''}`} style={{ '--drift-angle': focused ? '2deg' : '7deg', '--drift-duration': `${18 + clusterIndex % 5 * 3}s`, '--cluster-delay': `${-clusterIndex * 1.7}s` }}>
            <circle r={focused ? 90 : 70} fill={color} opacity=".035" aria-hidden="true" />
            <g className="galaxy-cluster-aura" aria-hidden="true" pointerEvents="none">
              <circle className="galaxy-core-halo" r={focused ? 44 : 32} fill={color} opacity=".055" />
              <circle r={focused ? 62 : 51} fill="none" stroke={color} strokeOpacity=".18" strokeDasharray="2 6" />
              <circle className="galaxy-orbit-comet" r={focused ? 62 : 51} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" pathLength="100" strokeDasharray="8 92" opacity=".65" />
              <circle className="galaxy-core-wave" r="15" fill="none" stroke={color} strokeWidth=".8" />
            </g>
            <g className="galaxy-constellation-drift">
              <g pointerEvents="none" aria-hidden="true">
                {stars.map((tool, index) => {
                  const point = pointFor(index, stars.length);
                  return <React.Fragment key={tool.id}>
                    <line x1="0" y1="0" x2={point.x} y2={point.y} stroke={color} strokeWidth={hovered?.id === tool.id ? 1.7 : .8} opacity={hovered?.id === tool.id ? .7 : .28} />
                    {index % Math.max(3, Math.ceil(stars.length / 12)) === 0 && <line className="galaxy-connection-pulse" x1="0" y1="0" x2={point.x} y2={point.y} stroke={color} strokeWidth="1.7" strokeLinecap="round" pathLength="100" strokeDasharray="13 110" style={{ '--pulse-delay': `${-index * .8 - clusterIndex * .47}s` }} />}
                  </React.Fragment>;
                })}
              </g>
              {stars.map((tool, index) => { const point = pointFor(index, stars.length); const active = hovered?.id === tool.id; return <g key={tool.id} transform={`translate(${point.x} ${point.y})`} className={`galaxy-star ${active ? 'is-hovered' : ''}`} tabIndex={0} role="button" aria-label={`Ver ficha de ${tool.name}`} onMouseEnter={() => setHovered(tool)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(tool)} onBlur={() => setHovered(null)} onClick={activate(() => onToolSelect(tool))} onKeyDown={activate(() => onToolSelect(tool))}>
                <title>{tool.name}</title><circle r={focused ? 16 : 12} fill="transparent" />
                <g className="galaxy-star-light" style={{ '--twinkle-delay': `${-index * .61 - clusterIndex * .37}s`, '--twinkle-duration': `${3 + index % 4}s` }} pointerEvents="none" aria-hidden="true">
                  <circle r={active ? 10 : 7} fill={color} opacity=".18" />
                  <circle r={active ? 4.3 : focused ? 3.6 : 2.7} fill={active ? '#fff' : color} />
                  <circle r="1" fill="#f2faff" opacity=".85" />
                </g>
              </g>; })}
            </g>
            <g className="galaxy-cluster-core" tabIndex={0} role="button" aria-label={`Explorar ${cluster.name}, ${cluster.tools.length} fuentes`} onClick={activate(() => onCategorySelect(cluster.id))} onKeyDown={activate(() => onCategorySelect(cluster.id))}>
              <title>{cluster.name}: {cluster.tools.length} fuentes</title><circle r="19" fill="transparent" /><circle r="10" fill={color} opacity=".12" /><circle r="5" fill={color} /><circle r="12" fill="none" stroke={color} strokeOpacity=".55" />
            </g>
            {!focused && <g className="galaxy-cluster-label" transform={compact ? 'translate(0 -20)' : undefined} tabIndex={0} role="button" aria-label={`Enfocar ${cluster.name}`} onClick={activate(() => onCategorySelect(cluster.id))} onKeyDown={activate(() => onCategorySelect(cluster.id))}>
              <rect x="-104" y="64" width="208" height="45" rx="7" fill="#0c1925" stroke={color} strokeOpacity=".22" />
              <text x="0" y="84" fill="#deedf6">{cluster.shortName}</text><text x="0" y="100" className="galaxy-cluster-count" fill={color}>{cluster.tools.length} fuentes</text>
            </g>}
          </g>;
        })}
      </svg>
      {hovered && <div className="galaxy-hover-detail" aria-live="polite"><Sparkles size={15} /><strong>{hovered.name}</strong><span>Seleccioná para abrir la ficha</span></div>}
      <div className="galaxy-map-controls" role="group" aria-label="Controles del mapa">
        <button type="button" onClick={() => zoomBy(0.8)} disabled={camera.zoom <= .65} aria-label="Alejar mapa"><Minus size={18} /></button><output aria-label="Nivel de zoom">{Math.round(camera.zoom * 100)}%</output><button type="button" onClick={() => zoomBy(1.25)} disabled={camera.zoom >= 4} aria-label="Acercar mapa"><Plus size={18} /></button><span /><button type="button" onClick={() => setCamera(INITIAL_CAMERA)} aria-label="Centrar mapa"><LocateFixed size={18} /></button>
        <span /><button type="button" className="galaxy-motion-toggle" onClick={() => setMotionPaused((paused) => !paused)} disabled={reducedMotion} aria-label={reducedMotion ? 'Animación desactivada por movimiento reducido' : motionPaused ? 'Reanudar animación de constelaciones' : 'Pausar animación de constelaciones'} title={reducedMotion ? 'Tu dispositivo tiene activado el movimiento reducido' : motionPaused ? 'Reanudar animación' : 'Pausar animación'}>{motionPaused || reducedMotion ? <Play size={16} /> : <Pause size={16} />}</button>
      </div>
      <div className="galaxy-map-footer"><span>{representedCount} de {tools.length} fuentes representadas</span><span>Arrastrá para mover · Ctrl/⌘ + rueda para zoom</span></div>
    </div>
    <aside className="galaxy-explorer" aria-label={focused ? `Fuentes de ${focused.name}` : 'Categorías de fuentes'}>
      <div className="galaxy-explorer-heading"><span className="catalog-eyebrow">{focused ? 'Constelación enfocada' : 'Elegí una constelación'}</span><h2>{focused ? focused.shortName : 'Tu próximo punto de partida'}</h2><p>{focused ? focused.description : 'Cada constelación agrupa una especialidad. Enfocala para explorar todas sus fuentes.'}</p></div>
      <div className="galaxy-explorer-items">
        {focused ? focused.tools.map((tool) => <button type="button" className="galaxy-source-link" key={tool.id} onClick={() => onToolSelect(tool)}><span><strong>{tool.name}</strong><small>{tool.type} · {tool.region}</small></span><ArrowUpRight size={16} /></button>) : constellations.map((cluster) => <button type="button" className="galaxy-category-link" key={cluster.id} onClick={() => onCategorySelect(cluster.id)}><i style={{ background: cluster.color }} aria-hidden="true" /><span>{cluster.shortName}</span><b>{cluster.tools.length}</b></button>)}
        {tools.length === 0 && <div className="galaxy-explorer-empty"><SearchX size={22} /><p>No hay resultados.</p><button className="catalog-reset" type="button" onClick={onReset}>Limpiar filtros</button></div>}
      </div>
      <button type="button" className="galaxy-open-list" onClick={onShowList}>Ver {tools.length} fuentes en lista <ArrowUpRight size={16} /></button>
      <p className="galaxy-map-note">Las líneas indican pertenencia a una categoría. La vista general muestra hasta 10 fuentes por constelación.</p>
    </aside>
  </section>;
}
