import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useAuth } from '@hooks/useAuth';
import { useFavorites } from '@hooks/useTools';
import './ForceGraphView.css';

const ForceGraphView = ({ tools = [], categories = [], onCategorySelect, selectedCategory, searchQuery = '' }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const simulationRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showCategories, setShowCategories] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, nodeData: null });
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [layoutAlgorithm, setLayoutAlgorithm] = useState('force');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [filteredBySearch, setFilteredBySearch] = useState(false);
  const zoomBehaviorRef = useRef();
  
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Efecto para actualizar dimensiones del SVG
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width || 800, height: height || 600 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Función para detectar relaciones entre herramientas
  const detectToolRelationships = useCallback((allTools) => {
    const relationships = [];
    
    for (let i = 0; i < allTools.length; i++) {
      for (let j = i + 1; j < allTools.length; j++) {
        const tool1 = allTools[i];
        const tool2 = allTools[j];
        
        // Skip si son de la misma categoría (ya están conectados por la categoría)
        if (tool1.category === tool2.category) continue;
        
        let relationshipStrength = 0;
        let relationshipType = 'weak';
        
        // Detectar relaciones por tags compartidos
        const sharedTags = tool1.tags?.filter(tag => tool2.tags?.includes(tag)) || [];
        if (sharedTags.length >= 2) {
          relationshipStrength += sharedTags.length * 2;
          relationshipType = 'tag-based';
        }
        
        // Detectar relaciones por indicadores compartidos
        const sharedIndicators = tool1.indicators?.filter(ind => tool2.indicators?.includes(ind)) || [];
        if (sharedIndicators.length >= 2) {
          relationshipStrength += sharedIndicators.length * 3;
          relationshipType = 'workflow';
        }
        
        // Detectar relaciones por workflows conocidos
        const workflowConnections = {
          // Email investigation workflow
          'email-search': ['breach-check', 'social-media'],
          'hunter-io': ['haveibeenpwned', 'sherlock'],
          'ghunt': ['social-searcher', 'pipl'],
          
          // Domain investigation workflow  
          'whois-lookup': ['shodan', 'censys', 'securitytrails'],
          'shodan': ['nmap', 'masscan'],
          'dns-dumpster': ['subfinder', 'amass'],
          
          // Social media workflow
          'sherlock': ['social-searcher', 'pipl'],
          'facebook-search': ['instagram-search', 'linkedin-search'],
          
          // Image/Media workflow
          'google-images': ['tineye', 'yandex-images'],
          'exiftool': ['google-earth', 'what3words'],
          
          // Crypto workflow
          'blockchain-info': ['oxt', 'wallet-explorer'],
          
          // Document workflow
          'virustotal': ['hybrid-analysis', 'any-run']
        };
        
        if (workflowConnections[tool1.id]?.includes(tool2.id) || 
            workflowConnections[tool2.id]?.includes(tool1.id)) {
          relationshipStrength += 10;
          relationshipType = 'workflow';
        }
        
        // Detectar relaciones por tipo de datos
        const dataTypeConnections = {
          'domain': ['whois-lookup', 'shodan', 'censys', 'securitytrails', 'virustotal'],
          'email': ['hunter-io', 'haveibeenpwned', 'ghunt', 'holehe'],
          'image': ['google-images', 'tineye', 'yandex-images', 'exiftool'],
          'social': ['sherlock', 'social-searcher', 'pipl', 'facebook-search'],
          'crypto': ['blockchain-info', 'oxt', 'wallet-explorer', 'graphsense']
        };
        
        for (const [dataType, toolIds] of Object.entries(dataTypeConnections)) {
          if (toolIds.includes(tool1.id) && toolIds.includes(tool2.id)) {
            relationshipStrength += 5;
            relationshipType = 'data-type';
            break;
          }
        }
        
        // Solo crear enlace si hay suficiente fuerza de relación
        if (relationshipStrength >= 4) {
          relationships.push({
            source: tool1.id,
            target: tool2.id,
            strength: relationshipStrength,
            type: relationshipType
          });
        }
      }
    }
    
    return relationships;
  }, []);

  // Función para transformar datos en nodos y enlaces
  const prepareGraphData = useCallback(() => {
    const nodes = [];
    const links = [];

    // Nodo central OSINTArgy
    nodes.push({
      id: 'osintargy-central',
      type: 'central',
      name: 'OSINTArgy',
      description: 'Plataforma de herramientas OSINT',
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      fx: dimensions.width / 2,
      fy: dimensions.height / 2
    });

    // Nodos de categorías - siempre mostrar para vista tipo Maltego
    categories.forEach((category, index) => {
      // Distribución circular para las categorías
      const angle = (index * 2 * Math.PI) / categories.length;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.25;
      
      nodes.push({
        id: `category-${category.id}`,
        type: 'category',
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        categoryId: category.id,
        // Posición inicial sugerida
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius
      });

      // Enlace del central a la categoría
      links.push({
        source: 'osintargy-central',
        target: `category-${category.id}`,
        type: 'category-link'
      });

      // Nodos de herramientas si la categoría está activa o seleccionada
      if (activeCategory === category.id || selectedCategory?.id === category.id) {
        const categoryTools = tools.filter(tool => tool.category === category.id);
        categoryTools.forEach((tool, toolIndex) => {
          // Distribución circular alrededor de la categoría
          const toolAngle = (toolIndex * 2 * Math.PI) / categoryTools.length;
          const toolRadius = 100;
          const categoryX = dimensions.width / 2 + Math.cos(angle) * radius;
          const categoryY = dimensions.height / 2 + Math.sin(angle) * radius;
          
          nodes.push({
            id: `tool-${tool.id}`,
            type: 'tool',
            name: tool.name,
            description: tool.description,
            url: tool.url,
            icon: tool.icon,
            categoryId: category.id,
            toolId: tool.id,
            toolData: tool, // Guardar datos completos para relaciones
            isFavorite: user ? isFavorite(tool.id) : false,
            // Posición inicial sugerida alrededor de la categoría
            x: categoryX + Math.cos(toolAngle) * toolRadius,
            y: categoryY + Math.sin(toolAngle) * toolRadius
          });

          // Enlace de la categoría a la herramienta
          links.push({
            source: `category-${category.id}`,
            target: `tool-${tool.id}`,
            type: 'tool-link'
          });
        });
        
        // Agregar relaciones entre herramientas de la categoría activa
        if (categoryTools.length > 1) {
          const toolRelationships = detectToolRelationships(categoryTools);
          toolRelationships.forEach(rel => {
            links.push({
              source: `tool-${rel.source}`,
              target: `tool-${rel.target}`,
              type: 'tool-relationship',
              relationshipType: rel.type,
              strength: rel.strength
            });
          });
        }
      }
    });
    
    // Si hay múltiples categorías activas, buscar relaciones entre sus herramientas
    const allActiveTools = [];
    categories.forEach(category => {
      if (activeCategory === category.id || selectedCategory?.id === category.id) {
        const categoryTools = tools.filter(tool => tool.category === category.id);
        allActiveTools.push(...categoryTools);
      }
    });
    
    if (allActiveTools.length > 1) {
      const crossCategoryRelationships = detectToolRelationships(allActiveTools);
      crossCategoryRelationships.forEach(rel => {
        // Solo agregar si ambas herramientas están en el grafo actual
        const sourceExists = nodes.find(n => n.id === `tool-${rel.source}`);
        const targetExists = nodes.find(n => n.id === `tool-${rel.target}`);
        
        if (sourceExists && targetExists) {
          links.push({
            source: `tool-${rel.source}`,
            target: `tool-${rel.target}`,
            type: 'cross-category-relationship',
            relationshipType: rel.type,
            strength: rel.strength
          });
        }
      });
    }

    return { nodes, links };
  }, [categories, tools, showCategories, activeCategory, selectedCategory, dimensions, user, isFavorite, detectToolRelationships]);

  // Función para manejar selección múltiple
  const handleNodeSelection = useCallback((nodeId, ctrlKey = false) => {
    setSelectedNodes(prev => {
      const newSelection = new Set(prev);
      
      if (ctrlKey || multiSelectMode) {
        // Modo selección múltiple
        if (newSelection.has(nodeId)) {
          newSelection.delete(nodeId);
        } else {
          newSelection.add(nodeId);
        }
      } else {
        // Selección simple
        newSelection.clear();
        newSelection.add(nodeId);
      }
      
      return newSelection;
    });
  }, [multiSelectMode]);

  // Función para manejar click derecho (menú contextual)
  const handleNodeRightClick = useCallback((event, d) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      nodeData: d
    });
  }, []);

  // Función para cerrar menú contextual
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Función para manejar clicks en nodos
  const handleNodeClick = useCallback((event, d) => {
    event.stopPropagation();
    
    // Cerrar menú contextual si está abierto
    closeContextMenu();
    
    // Manejar selección de nodos
    handleNodeSelection(d.id, event.ctrlKey || event.metaKey);
    
    if (d.type === 'central') {
      // Reset de vista - limpiar todas las selecciones
      setActiveCategory(null);
      setSelectedNodes(new Set());
      if (onCategorySelect) {
        onCategorySelect(null);
      }
    } else if (d.type === 'category') {
      const newActiveCategory = activeCategory === d.categoryId ? null : d.categoryId;
      setActiveCategory(newActiveCategory);
      if (onCategorySelect) {
        const category = categories.find(cat => cat.id === d.categoryId);
        onCategorySelect(newActiveCategory ? category : null);
      }
    } else if (d.type === 'tool') {
      if (!event.ctrlKey && !event.metaKey && !multiSelectMode) {
        if (d.url) {
          window.open(d.url, '_blank', 'noopener,noreferrer');
        }
      }
    }

    // Alternar estado fijo del nodo (excepto el central que siempre está fijo)
    if (d.type !== 'central') {
      if (d.fx !== null && d.fy !== null) {
        d.fx = null;
        d.fy = null;
      } else {
        d.fx = d.x;
        d.fy = d.y;
      }
      if (simulationRef.current) {
        simulationRef.current.alpha(0.3).restart();
      }
    }
  }, [activeCategory, categories, onCategorySelect, handleNodeSelection, closeContextMenu, multiSelectMode]);

  // Función para manejar acciones del menú contextual
  const handleContextMenuAction = useCallback((action) => {
    const nodeData = contextMenu.nodeData;
    if (!nodeData) return;
    
    switch(action) {
      case 'open':
        if (nodeData.url) {
          window.open(nodeData.url, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'favorite':
        if (nodeData.type === 'tool' && user) {
          toggleFavorite(nodeData.toolId);
        }
        break;
      case 'copy-url':
        if (nodeData.url) {
          navigator.clipboard.writeText(nodeData.url);
        }
        break;
      case 'pin':
        if (nodeData.type !== 'central') {
          nodeData.fx = nodeData.fx !== null ? null : nodeData.x;
          nodeData.fy = nodeData.fy !== null ? null : nodeData.y;
          if (simulationRef.current) {
            simulationRef.current.alpha(0.3).restart();
          }
        }
        break;
      case 'select-related':
        // Seleccionar todas las herramientas relacionadas
        if (nodeData.type === 'tool') {
          const relatedNodes = new Set();
          const allLinks = document.querySelectorAll('.link');
          
          allLinks.forEach(link => {
            const linkData = d3.select(link).datum();
            if (linkData.source.id === nodeData.id || linkData.target.id === nodeData.id) {
              const relatedId = linkData.source.id === nodeData.id ? linkData.target.id : linkData.source.id;
              relatedNodes.add(relatedId);
            }
          });
          
          setSelectedNodes(prev => new Set([...prev, ...relatedNodes]));
        }
        break;
    }
    
    closeContextMenu();
  }, [contextMenu.nodeData, user, toggleFavorite, closeContextMenu]);

  // Funciones de control de vista
  const handleZoomIn = useCallback(() => {
    if (zoomBehaviorRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1.5);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (zoomBehaviorRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 0.67);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (zoomBehaviorRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  const handleCenterView = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alpha(0.8).restart();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleLayoutChange = useCallback((newLayout) => {
    setLayoutAlgorithm(newLayout);
    // Restart simulation with new layout
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  }, []);

  // Efecto para manejar búsqueda y resaltado
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setHighlightedNodes(new Set());
      setFilteredBySearch(false);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const matchingNodes = new Set();
    
    // Buscar en herramientas
    tools.forEach(tool => {
      const matches = [
        tool.name.toLowerCase().includes(query),
        tool.description?.toLowerCase().includes(query),
        tool.tags?.some(tag => tag.toLowerCase().includes(query)),
        tool.indicators?.some(indicator => indicator.toLowerCase().includes(query)),
        tool.categoryId?.toLowerCase().includes(query)
      ].some(match => match);
      
      if (matches) {
        matchingNodes.add(`tool-${tool.id}`);
        // También resaltar la categoría padre
        matchingNodes.add(`category-${tool.category}`);
      }
    });
    
    // Buscar en categorías
    categories.forEach(category => {
      const matches = [
        category.name.toLowerCase().includes(query),
        category.description?.toLowerCase().includes(query),
        category.id.toLowerCase().includes(query)
      ].some(match => match);
      
      if (matches) {
        matchingNodes.add(`category-${category.id}`);
      }
    });
    
    setHighlightedNodes(matchingNodes);
    setFilteredBySearch(matchingNodes.size > 0);
  }, [searchQuery, tools, categories]);

  // Función para manejar favoritos
  const handleFavoriteClick = useCallback((event, toolId) => {
    event.stopPropagation();
    if (user) {
      toggleFavorite(toolId);
    }
  }, [user, toggleFavorite]);

  // Función para mostrar tooltip personalizado
  const showTooltip = useCallback((event, d) => {
    if (!tooltipRef.current) return;
    
    const tooltip = tooltipRef.current;
    tooltip.replaceChildren();

    const appendLine = (text, tagName = null) => {
      if (tooltip.childNodes.length > 0) {
        tooltip.appendChild(document.createElement('br'));
      }

      if (tagName) {
        const element = document.createElement(tagName);
        element.textContent = text;
        tooltip.appendChild(element);
        return;
      }

      tooltip.appendChild(document.createTextNode(text));
    };
    
    if (d.type === 'central') {
      appendLine('OSINTArgy - Haz click para ver/ocultar categorías');
    } else if (d.type === 'category') {
      appendLine(d.name || 'Categoría');
      if (d.description) appendLine(d.description);
      appendLine('Haz click para ver herramientas');
    } else if (d.type === 'tool') {
      appendLine(d.name || 'Herramienta OSINT', 'strong');
      appendLine(d.description || 'Herramienta OSINT');
      
      // Agregar información de relaciones si existen
      if (d.toolData?.tags?.length > 0) {
        appendLine(`Tags: ${d.toolData.tags.slice(0, 3).join(', ')}`, 'small');
      }
      if (d.toolData?.indicators?.length > 0) {
        appendLine(`Capacidades: ${d.toolData.indicators.join(', ')}`, 'small');
      }
      
      appendLine('Haz click para abrir');
      if (user) {
        appendLine(d.isFavorite ? '⭐ En favoritos' : '♥ Click para agregar a favoritos');
      }
    }
    
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
  }, [user]);

  // Función para ocultar tooltip
  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  }, []);

  // Efecto principal para crear y actualizar el grafo
  useEffect(() => {
    if (!svgRef.current || categories.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Limpiar SVG
    svg.selectAll('*').remove();

    // Definir gradientes para nodos tipo Maltego
    const defs = svg.append('defs');
    
    // Gradiente para nodo central
    const centralGradient = defs.append('radialGradient')
      .attr('id', 'centralGradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    centralGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4A90E2');
    centralGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#003366');

    // Gradiente para categorías
    const categoryGradient = defs.append('radialGradient')
      .attr('id', 'categoryGradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    categoryGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#50C878');
    categoryGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1E5A8A');

    // Gradiente para categorías activas
    const activeCategoryGradient = defs.append('radialGradient')
      .attr('id', 'activeCategoryGradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    activeCategoryGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FFE66D');
    activeCategoryGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FF8C42');

    // Gradiente para herramientas
    const toolGradient = defs.append('radialGradient')
      .attr('id', 'toolGradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    toolGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FFB347');
    toolGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FF9800');

    // Gradiente para herramientas favoritas
    const favoriteToolGradient = defs.append('radialGradient')
      .attr('id', 'favoriteToolGradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    favoriteToolGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FFE66D');
    favoriteToolGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FFD700');

    // Preparar datos
    const { nodes, links } = prepareGraphData();

    // Crear simulación basada en el algoritmo seleccionado
    let simulation;
    
    switch(layoutAlgorithm) {
      case 'circular':
        simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(120).strength(0.3))
          .force('charge', d3.forceManyBody().strength(-100))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('radial', d3.forceRadial(Math.min(width, height) * 0.3, width / 2, height / 2).strength(0.8));
        break;
        
      case 'hierarchical':
        simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(150).strength(0.5))
          .force('charge', d3.forceManyBody().strength(-500))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('y', d3.forceY().y(d => {
            if (d.type === 'central') return height * 0.2;
            if (d.type === 'category') return height * 0.5;
            return height * 0.8;
          }).strength(0.5));
        break;
        
      case 'clustered':
        simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(80).strength(0.8))
          .force('charge', d3.forceManyBody().strength(-400))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('cluster', () => {
            // Implementación personalizada de clustering
            nodes.forEach(d => {
              if (d.type === 'tool') {
                const category = categories.find(cat => cat.id === d.categoryId);
                if (category) {
                  const categoryIndex = categories.indexOf(category);
                  const angle = (categoryIndex * 2 * Math.PI) / categories.length;
                  const radius = Math.min(width, height) * 0.3;
                  const targetX = width / 2 + Math.cos(angle) * radius;
                  const targetY = height / 2 + Math.sin(angle) * radius;
                  
                  d.vx += (targetX - d.x) * 0.1;
                  d.vy += (targetY - d.y) * 0.1;
                }
              }
            });
          });
        break;
        
      default: // 'force'
        simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id)
            .distance(d => {
              if (d.type === 'category-link') return Math.min(width, height) * 0.25;
              if (d.type === 'tool-link') return 100;
              return 120;
            })
            .strength(d => {
              if (d.type === 'category-link') return 0.8;
              if (d.type === 'tool-link') return 0.6;
              return 0.5;
            })
          )
          .force('charge', d3.forceManyBody().strength(d => {
            if (d.type === 'central') return -2000;
            if (d.type === 'category') return -800;
            return -300;
          }).distanceMax(Math.min(width, height) * 0.8))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(d => {
            if (d.type === 'central') return 80;
            if (d.type === 'category') return 60;
            return 40;
          }).strength(0.9))
          .force('radial', d3.forceRadial(Math.min(width, height) * 0.25, width / 2, height / 2)
            .strength(d => d.type === 'category' ? 0.3 : 0)
          )
          .force('relationship', d3.forceLink()
            .id(d => d.id)
            .links(links.filter(l => l.type === 'tool-relationship' || l.type === 'cross-category-relationship'))
            .distance(d => 60 - (d.strength || 1) * 3)
            .strength(d => (d.strength || 1) * 0.1)
          );
    }

    simulationRef.current = simulation;

    // Configurar simulación con valores optimizados para aspecto Maltego
    simulation.alpha(1).alphaDecay(0.02).velocityDecay(0.3);

    // Configurar zoom y paneo
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    
    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;
    
    // Crear contenedor principal
    const container = svg.append('g');

    // Crear enlaces
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('class', d => `link ${d.type}`)
      .attr('stroke', d => {
        if (d.type === 'category-link') return '#00D4FF';
        if (d.type === 'tool-link') return '#FFD700';
        if (d.type === 'tool-relationship') {
          switch(d.relationshipType) {
            case 'workflow': return '#00FF88';
            case 'data-type': return '#FF8800';
            case 'tag-based': return '#8800FF';
            default: return '#FFFFFF';
          }
        }
        if (d.type === 'cross-category-relationship') {
          switch(d.relationshipType) {
            case 'workflow': return '#00FF88';
            case 'data-type': return '#FF8800';
            case 'tag-based': return '#8800FF';
            default: return '#FFFFFF';
          }
        }
        return '#FFD700';
      })
      .attr('stroke-width', d => {
        if (d.type === 'category-link') return 3;
        if (d.type === 'tool-link') return 2;
        if (d.type === 'tool-relationship' || d.type === 'cross-category-relationship') {
          return Math.max(1, Math.min(3, d.strength / 3));
        }
        return 2;
      })
      .attr('stroke-opacity', d => {
        let baseOpacity;
        if (d.type === 'category-link') baseOpacity = 0.9;
        else if (d.type === 'tool-link') baseOpacity = 0.7;
        else if (d.type === 'tool-relationship' || d.type === 'cross-category-relationship') {
          baseOpacity = Math.max(0.3, Math.min(0.8, d.strength / 15));
        } else {
          baseOpacity = 0.8;
        }
        
        // Atenuar enlaces que no están conectados a nodos resaltados
        if (filteredBySearch) {
          const sourceHighlighted = highlightedNodes.has(d.source.id || d.source);
          const targetHighlighted = highlightedNodes.has(d.target.id || d.target);
          
          if (!sourceHighlighted && !targetHighlighted) {
            baseOpacity *= 0.2;
          } else if (sourceHighlighted && targetHighlighted) {
            baseOpacity *= 1.5; // Resaltar enlaces entre nodos encontrados
          }
        }
        
        return Math.min(1, baseOpacity);
      })
      .attr('stroke-dasharray', d => {
        if (d.type === 'tool-relationship' || d.type === 'cross-category-relationship') {
          switch(d.relationshipType) {
            case 'workflow': return 'none';
            case 'data-type': return '8,4';
            case 'tag-based': return '4,4';
            default: return '2,2';
          }
        }
        if (d.type === 'tool-link') return '5,5';
        return 'none';
      });

    // Crear nodos
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', d => `node ${d.type}`)
      .style('cursor', 'pointer')
      .on('click', handleNodeClick)
      .on('contextmenu', handleNodeRightClick)
      .on('mouseover', showTooltip)
      .on('mouseout', hideTooltip)
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          // NO liberar automáticamente la posición fija
          // El usuario debe hacer click para alternar el estado fijo
        }));

    // Círculos de nodos
    node.append('circle')
      .attr('r', d => {
        if (d.type === 'central') return 60;
        if (d.type === 'category') return 40;
        return 25;
      })
      .attr('fill', d => {
        if (d.type === 'central') return 'url(#centralGradient)';
        if (d.type === 'category') {
          const isActive = activeCategory === d.categoryId || selectedCategory?.id === d.categoryId;
          return isActive ? 'url(#activeCategoryGradient)' : (d.color || 'url(#categoryGradient)');
        }
        if (d.type === 'tool' && d.isFavorite) return 'url(#favoriteToolGradient)';
        return 'url(#toolGradient)';
      })
      .attr('class', d => {
        let classes = `node ${d.type}`;
        if (selectedNodes.has(d.id)) classes += ' selected';
        if (d.type === 'category' && (activeCategory === d.categoryId || selectedCategory?.id === d.categoryId)) {
          classes += ' active';
        }
        if (highlightedNodes.has(d.id)) classes += ' highlighted';
        if (filteredBySearch && !highlightedNodes.has(d.id)) classes += ' dimmed';
        return classes;
      })
      .attr('stroke', d => {
        if (d.type === 'central') return '#00D4FF';
        if (d.type === 'category') {
          const isActive = activeCategory === d.categoryId || selectedCategory?.id === d.categoryId;
          return isActive ? '#FFD700' : '#00D4FF';
        }
        if (d.type === 'tool' && d.isFavorite) return '#FF6B6B';
        return '#FFFFFF';
      })
      .attr('stroke-width', d => {
        if (d.type === 'central') return 3;
        if (d.type === 'category') return activeCategory === d.categoryId ? 3 : 2;
        return 1.5;
      })
      .style('filter', d => {
        let baseFilter = '';
        
        if (d.type === 'central') {
          baseFilter = 'drop-shadow(0px 0px 15px #00D4FF) drop-shadow(0px 0px 30px rgba(0, 212, 255, 0.5))';
        } else if (d.type === 'category') {
          const isActive = activeCategory === d.categoryId || selectedCategory?.id === d.categoryId;
          baseFilter = isActive ? 
            'drop-shadow(0px 0px 20px #FFD700) drop-shadow(0px 0px 40px rgba(255, 215, 0, 0.6))' : 
            'drop-shadow(0px 0px 8px #00D4FF) drop-shadow(0px 0px 16px rgba(0, 212, 255, 0.3))';
        } else if (d.type === 'tool' && d.isFavorite) {
          baseFilter = 'drop-shadow(0px 0px 12px #FFD700) drop-shadow(0px 0px 24px rgba(255, 215, 0, 0.4))';
        } else if (d.type === 'tool') {
          baseFilter = 'drop-shadow(0px 0px 6px #FF9800) drop-shadow(0px 0px 12px rgba(255, 152, 0, 0.3))';
        }
        
        // Agregar efectos especiales para nodos resaltados por búsqueda
        if (highlightedNodes.has(d.id)) {
          baseFilter += ' drop-shadow(0px 0px 20px #00FF00) drop-shadow(0px 0px 40px rgba(0, 255, 0, 0.6))';
        }
        
        // Atenuar nodos que no coinciden con la búsqueda
        if (filteredBySearch && !highlightedNodes.has(d.id)) {
          baseFilter += ' opacity(0.3)';
        }
        
        return baseFilter || 'none';
      });

    // Iconos/texto en nodos
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', d => {
        if (d.type === 'central') return 'white';
        if (d.type === 'category') return 'white';
        return 'black';
      })
      .attr('font-size', d => {
        if (d.type === 'central') return '24px';
        if (d.type === 'category') return '20px';
        return '14px';
      })
      .text(d => {
        if (d.type === 'central') return '🎯';
        if (d.type === 'category') {
          // Usar iconos específicos de Maltego para categorías
          const iconMap = {
            'social': '👥',
            'domain': '🌐',
            'email': '📧',
            'image': '🖼️',
            'phone': '📞',
            'location': '📍',
            'crypto': '₿',
            'leak': '🔓',
            'metadata': '📄',
            'search': '🔍'
          };
          return iconMap[d.categoryId] || d.icon || '📁';
        }
        return d.icon || '🔧';
      });

    // Botón de favorito para herramientas (solo si el usuario está logueado)
    if (user) {
      const toolNodes = node.filter(d => d.type === 'tool');
      
      toolNodes.append('circle')
        .attr('class', 'favorite-btn')
        .attr('r', 8)
        .attr('cx', 20)
        .attr('cy', -20)
        .attr('fill', d => d.isFavorite ? '#FF6B6B' : 'rgba(255, 255, 255, 0.8)')
        .attr('stroke', '#FF6B6B')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('click', (event, d) => handleFavoriteClick(event, d.toolId));

      toolNodes.append('text')
        .attr('class', 'favorite-icon')
        .attr('x', 20)
        .attr('y', -16)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', d => d.isFavorite ? 'white' : '#FF6B6B')
        .style('pointer-events', 'none')
        .text('♥');
    }

    // Actualizar posiciones en cada tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };

  }, [dimensions, categories, tools, showCategories, activeCategory, selectedNodes, layoutAlgorithm, highlightedNodes, filteredBySearch, handleNodeClick, handleNodeRightClick, prepareGraphData, user, handleFavoriteClick, showTooltip, hideTooltip]);

  // Efecto para cerrar menú contextual al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
      // Limpiar selección si no se mantiene Ctrl/Cmd
      if (!event.ctrlKey && !event.metaKey && !multiSelectMode) {
        setSelectedNodes(new Set());
      }
    };
    
    const handleKeyDown = (event) => {
      // Toggle modo selección múltiple con Shift
      if (event.key === 'Shift') {
        setMultiSelectMode(true);
      }
      // Escape para limpiar selección
      if (event.key === 'Escape') {
        setSelectedNodes(new Set());
        closeContextMenu();
      }
    };
    
    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        setMultiSelectMode(false);
      }
    };
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [contextMenu.visible, closeContextMenu, multiSelectMode]);

  return (
    <div ref={containerRef} className="force-graph-container">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
      
      {/* Tooltip */}
      <div 
        ref={tooltipRef} 
        className="custom-tooltip"
        style={{
          position: 'absolute',
          display: 'none',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000,
          maxWidth: '200px',
          lineHeight: '1.4'
        }}
      />
      
      {/* Menú contextual */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 2000
          }}
        >
          <div className="context-menu-content">
            {contextMenu.nodeData?.type === 'tool' && (
              <>
                <button onClick={() => handleContextMenuAction('open')}>
                  🌐 Abrir herramienta
                </button>
                {user && (
                  <button onClick={() => handleContextMenuAction('favorite')}>
                    {contextMenu.nodeData.isFavorite ? '⭐ Quitar de favoritos' : '♥ Agregar a favoritos'}
                  </button>
                )}
                <button onClick={() => handleContextMenuAction('copy-url')}>
                  📋 Copiar URL
                </button>
                <button onClick={() => handleContextMenuAction('select-related')}>
                  🔗 Seleccionar relacionadas
                </button>
                <hr />
              </>
            )}
            <button onClick={() => handleContextMenuAction('pin')}>
              {contextMenu.nodeData?.fx !== null ? '📍 Liberar posición' : '📋 Fijar posición'}
            </button>
          </div>
        </div>
      )}
      
      {/* Controles de vista */}
      {showControls && (
        <div className="view-controls">
          <div className="control-group zoom-controls">
            <button onClick={handleZoomIn} title="Acercar">
              🔍+
            </button>
            <button onClick={handleZoomOut} title="Alejar">
              🔍-
            </button>
            <button onClick={handleResetView} title="Resetear vista">
              🏠
            </button>
            <button onClick={handleCenterView} title="Centrar nodos">
              🎯
            </button>
          </div>
          
          <div className="control-group layout-controls">
            <select 
              value={layoutAlgorithm} 
              onChange={(e) => handleLayoutChange(e.target.value)}
              title="Algoritmo de diseño"
            >
              <option value="force">Fuerzas</option>
              <option value="circular">Circular</option>
              <option value="hierarchical">Jerárquico</option>
              <option value="clustered">Agrupado</option>
            </select>
          </div>
          
          <div className="control-group view-controls-buttons">
            <button onClick={toggleFullscreen} title="Pantalla completa">
              {isFullscreen ? '🔲' : '🔳'}
            </button>
            <button 
              onClick={() => setShowControls(false)} 
              title="Ocultar controles"
              className="hide-controls"
            >
              ✖
            </button>
          </div>
        </div>
      )}
      
      {/* Botón para mostrar controles cuando están ocultos */}
      {!showControls && (
        <button 
          className="show-controls"
          onClick={() => setShowControls(true)}
          title="Mostrar controles"
        >
          ⚙️
        </button>
      )}
      
      {/* Indicador de modo selección múltiple */}
      {(multiSelectMode || selectedNodes.size > 0) && (
        <div className="selection-indicator">
          {multiSelectMode && <span className="multi-select-mode">⚡ Modo selección múltiple activo</span>}
          {selectedNodes.size > 0 && (
            <span className="selected-count">
              {selectedNodes.size} nodo{selectedNodes.size !== 1 ? 's' : ''} seleccionado{selectedNodes.size !== 1 ? 's' : ''}
            </span>
          )}
          <button 
            className="clear-selection"
            onClick={() => setSelectedNodes(new Set())}
            title="Limpiar selección"
          >
            ❌
          </button>
        </div>
      )}
      
      {/* Indicador de resultados de búsqueda */}
      {filteredBySearch && (
        <div className="search-results-indicator">
          <span className="search-icon">🔍</span>
          <span className="results-count">
            {highlightedNodes.size} resultado{highlightedNodes.size !== 1 ? 's' : ''} encontrado{highlightedNodes.size !== 1 ? 's' : ''}
          </span>
          {searchQuery && (
            <span className="search-query">
              para: "{searchQuery}"
            </span>
          )}
          <button 
            className="clear-search"
            onClick={() => {
              setHighlightedNodes(new Set());
              setFilteredBySearch(false);
            }}
            title="Limpiar búsqueda"
          >
            ❌
          </button>
        </div>
      )}
      
      {/* Ayuda de interacciones */}
      <div className="interaction-help">
        <ul>
          <li>Click derecho: Menú contextual</li>
          <li>Ctrl + Click: Selección múltiple</li>
          <li>Shift: Modo selección</li>
          <li>Rueda: Zoom</li>
          <li>Arrastrar: Paneo</li>
          {searchQuery && <li>Buscar: Resaltado automático</li>}
        </ul>
      </div>
    </div>
  );
};

export default ForceGraphView;
