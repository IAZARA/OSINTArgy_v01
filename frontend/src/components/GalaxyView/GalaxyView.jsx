import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Compass,
  ExternalLink,
  Home,
  LayoutList,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { useFavorites, useToolHistory } from '@hooks/useTools';
import { useCases } from '@/context/CaseContext';
import { useNavigate } from '@/lib/router';
import toast from 'react-hot-toast';
import ToolCatalogList from './ToolCatalogList';
import './GalaxyView.css';

const LABEL_FONT = "'Segoe UI', system-ui, sans-serif";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
};

const fitLineWithEllipsis = (ctx, line, maxWidth) => {
  if (ctx.measureText(line).width <= maxWidth) {
    return line;
  }

  let trimmed = line;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1).trim();
  }

  return `${trimmed}...`;
};

const wrapCanvasText = (ctx, text, maxWidth, maxLines = 3) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= maxLines) {
    return lines.map((line) => fitLineWithEllipsis(ctx, line, maxWidth));
  }

  const visibleLines = lines.slice(0, maxLines);
  visibleLines[maxLines - 1] = fitLineWithEllipsis(
    ctx,
    lines.slice(maxLines - 1).join(' '),
    maxWidth
  );

  return visibleLines;
};

const getOverlapArea = (boxA, boxB, margin = 10) => {
  const xOverlap = Math.max(0, Math.min(boxA.right + margin, boxB.right) - Math.max(boxA.left - margin, boxB.left));
  const yOverlap = Math.max(0, Math.min(boxA.bottom + margin, boxB.bottom) - Math.max(boxA.top - margin, boxB.top));

  return xOverlap * yOverlap;
};

const drawConstellationLabel = ({
  ctx,
  name,
  color,
  x,
  y,
  fontSize,
  canvasWidth,
  canvasHeight,
  zoom,
  placedLabels,
  isActive,
  isFocused,
  isMobile
}) => {
  const maxTextWidth = isMobile ? 160 : 230;
  const lineHeight = Math.round(fontSize * 1.18);
  const paddingX = isMobile ? 8 : 12;
  const paddingY = isMobile ? 6 : 8;
  const outwardX = x - canvasWidth / 2;
  const outwardY = y - canvasHeight / 2;
  const outwardLength = Math.max(1, Math.hypot(outwardX, outwardY));
  const unitX = outwardX / outwardLength;
  const unitY = outwardY / outwardLength;
  const perpendicularX = -unitY;
  const perpendicularY = unitX;
  const distance = clamp(88 * zoom, 72, isMobile ? 108 : 132);

  ctx.save();
  ctx.font = `700 ${fontSize}px ${LABEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapCanvasText(ctx, name, maxTextWidth, isMobile ? 2 : 3);
  const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const labelWidth = textWidth + paddingX * 2;
  const labelHeight = lines.length * lineHeight + paddingY * 2;

  const candidateCenters = [
    { x: x + unitX * distance, y: y + unitY * distance },
    { x: x + unitX * distance + perpendicularX * 74, y: y + unitY * distance + perpendicularY * 74 },
    { x: x + unitX * distance - perpendicularX * 74, y: y + unitY * distance - perpendicularY * 74 },
    { x: x + unitX * distance + perpendicularX * 148, y: y + unitY * distance + perpendicularY * 148 },
    { x: x + unitX * distance - perpendicularX * 148, y: y + unitY * distance - perpendicularY * 148 },
    { x: x - unitX * distance * 0.6, y: y - unitY * distance * 0.6 },
    { x: x + perpendicularX * 96, y: y + perpendicularY * 96 },
    { x: x - perpendicularX * 96, y: y - perpendicularY * 96 },
    { x: x - unitX * distance * 1.15 + perpendicularX * 72, y: y - unitY * distance * 1.15 + perpendicularY * 72 },
    { x: x - unitX * distance * 1.15 - perpendicularX * 72, y: y - unitY * distance * 1.15 - perpendicularY * 72 }
  ];

  const edgeMargin = isMobile ? 10 : 18;
  const makeBox = (center) => {
    const centerX = clamp(center.x, edgeMargin + labelWidth / 2, canvasWidth - edgeMargin - labelWidth / 2);
    const centerY = clamp(center.y, edgeMargin + labelHeight / 2, canvasHeight - edgeMargin - labelHeight / 2);

    return {
      centerX,
      centerY,
      left: centerX - labelWidth / 2,
      right: centerX + labelWidth / 2,
      top: centerY - labelHeight / 2,
      bottom: centerY + labelHeight / 2
    };
  };

  const scoredCandidates = candidateCenters
    .map(makeBox)
    .map((candidate) => ({
      box: candidate,
      score: placedLabels.reduce((score, labelBox) => score + getOverlapArea(candidate, labelBox), 0)
    }));

  const selectedBox = scoredCandidates.find((candidate) => candidate.score === 0)?.box ||
    scoredCandidates.sort((candidateA, candidateB) => candidateA.score - candidateB.score)[0].box;

  placedLabels.push(selectedBox);

  const backgroundAlpha = isFocused ? 0.74 : isActive ? 0.68 : 0.54;
  const borderAlpha = isFocused || isActive ? 0.76 : 0.42;

  ctx.shadowColor = color;
  ctx.shadowBlur = isFocused || isActive ? 18 : 8;
  ctx.fillStyle = `rgba(0, 10, 22, ${backgroundAlpha})`;
  ctx.strokeStyle = `${color}${Math.round(borderAlpha * 255).toString(16).padStart(2, '0')}`;
  ctx.lineWidth = isFocused ? 1.8 : 1.2;
  drawRoundedRect(ctx, selectedBox.left, selectedBox.top, labelWidth, labelHeight, 8);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  lines.forEach((line, lineIndex) => {
    const lineY = selectedBox.centerY - ((lines.length - 1) * lineHeight) / 2 + lineIndex * lineHeight;
    ctx.fillText(line, selectedBox.centerX, lineY);
  });

  ctx.restore();
};

const GalaxyView = ({ tools = [], categories = [], onCategorySelect, selectedCategory, searchQuery = '' }) => {
  const canvasRef = useRef();
  const containerRef = useRef();
  const animationRef = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [targetCamera, setTargetCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedConstellation, setSelectedConstellation] = useState(null);
  const [focusedConstellation, setFocusedConstellation] = useState(null);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [toolPreview, setToolPreview] = useState(null);
  const [viewMode, setViewMode] = useState('galaxy');
  
  // Estados para soporte móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [touches, setTouches] = useState([]);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isPinchZooming, setIsPinchZooming] = useState(false);
  
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToHistory } = useToolHistory();
  const { activeCase, addFindingFromTool } = useCases();
  const navigate = useNavigate();

  const addToolToActiveCase = useCallback(async (tool, { openSource = false } = {}) => {
    if (!activeCase) {
      toast('Creá o seleccioná un caso para registrar esta herramienta.');
      navigate('/investigations');
      return;
    }

    if (openSource && tool.url) {
      window.open(tool.url, '_blank', 'noopener,noreferrer');
      addToHistory(tool);
      const params = new URLSearchParams({
        view: 'findings',
        new: '1',
        toolId: tool.id || '',
        toolName: tool.name || '',
        sourceUrl: tool.url || ''
      });
      toast.success('Formulario de hallazgo preparado.');
      setToolPreview(null);
      navigate(`/investigation-board/${activeCase.id}?${params.toString()}`);
      return;
    }

    try {
      await addFindingFromTool(tool, {
        title: openSource ? `Hallazgo por verificar con ${tool.name}` : `Revisar con ${tool.name}`,
        notes: openSource
          ? `Fuente abierta desde OSINTArgy. Registrá acá lo observado y vinculalo con entidades o ubicaciones.`
          : `Herramienta agregada desde la galaxia para evaluar durante la investigación.`
      });
      toast.success(`Agregada a ${activeCase.name}.`);
    } catch (error) {
      toast.error(error.message);
    }
  }, [activeCase, addFindingFromTool, addToHistory, navigate]);

  // Funciones utilitarias para touch
  const getDistanceBetweenTouches = useCallback((touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenterBetweenTouches = useCallback((touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }, []);

  const getTouchPosition = useCallback((touch, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }, []);

  // Configuración de la galaxia con optimizaciones móviles
  const GALAXY_CONFIG = {
    colors: {
      primary: '#00D4FF',
      secondary: '#FFD700',
      accent: '#FF6B6B',
      nebula: '#9C27B0',
      energy: '#00FF88'
    },
    // Configuración específica para móviles
    mobile: {
      backgroundStars: 50,      // Menos estrellas de fondo
      maxStarsPerConstellation: 10, // Menos estrellas por constelación
      animationSpeed: 0.6,      // Animaciones más lentas
      enableNebulae: false,     // Sin nebulosas complejas
      touchThreshold: 10,       // Umbral para detectar movimiento
      doubleTapDelay: 300       // Tiempo para doble tap
    },
    desktop: {
      backgroundStars: 200,
      maxStarsPerConstellation: 15,
      animationSpeed: 1,
      enableNebulae: true,
      touchThreshold: 5,
      doubleTapDelay: 300
    }
  };

  const getGalaxyRadii = useCallback(() => {
    const width = dimensions.width || window.innerWidth;
    const height = dimensions.height || window.innerHeight;
    const radiusX = clamp(width * (isMobile ? 0.32 : 0.34), isMobile ? 150 : 330, isMobile ? 250 : 540);
    const radiusY = clamp(height * (isMobile ? 0.32 : 0.34), isMobile ? 150 : 230, isMobile ? 250 : 360);

    return { radiusX, radiusY };
  }, [dimensions.height, dimensions.width, isMobile]);

  // Generar posiciones de constelaciones en círculo
  const generateConstellations = useCallback(() => {
    const constellations = [];
    const angleStep = (2 * Math.PI) / categories.length;
    const { radiusX, radiusY } = getGalaxyRadii();
    
    categories.forEach((category, index) => {
      const angle = index * angleStep;
      
      const constellation = {
        id: category.id,
        name: category.name,
        x: Math.cos(angle) * radiusX,
        y: Math.sin(angle) * radiusY,
        color: category.color || GALAXY_CONFIG.colors.primary,
        stars: [],
        angle: angle,
        pulsing: false
      };

      // Generar estrellas (herramientas) para esta constelación
      const categoryTools = tools.filter(tool => tool.category === category.id);
      const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
      const starsCount = Math.min(categoryTools.length, config.maxStarsPerConstellation);
      
      categoryTools.slice(0, starsCount).forEach((tool, toolIndex) => {
        const starAngle = (toolIndex * 2 * Math.PI) / starsCount;
        const starDistance = 50 + (toolIndex % 3) * 25; // Distribución en anillos
        
        constellation.stars.push({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          utility: tool.utility,
          tags: tool.tags,
          rating: tool.rating,
          type: tool.type,
          url: tool.url,
          x: constellation.x + Math.cos(starAngle) * starDistance,
          y: constellation.y + Math.sin(starAngle) * starDistance,
          size: tool.rating ? (tool.rating / 5) * 4 + 2 : 4,
          brightness: isFavorite(tool.id) ? 1 : 0.7,
          isFavorite: user ? isFavorite(tool.id) : false,
          twinkle: ((index + 1) * 37 + (toolIndex + 3) * 19) % 100 / 100,
          category: category.id
        });
      });
      
      constellations.push(constellation);
    });
    
    return constellations;
  }, [categories, tools, user, isFavorite, getGalaxyRadii]);

  // Efecto para actualizar dimensiones y detectar móvil
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
        setIsMobile(window.innerWidth < 768);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Función para dibujar el fondo estrellado (optimizada para móvil)
  const drawStarField = useCallback((ctx, time) => {
    const { width, height } = dimensions;
    const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
    const speed = config.animationSpeed;
    
    // Crear campo de estrellas de fondo con cantidad adaptativa
    for (let i = 0; i < config.backgroundStars; i++) {
      const x = (Math.sin(i * 0.1 + time * 0.0001 * speed) * width * 2) % width;
      const y = (Math.cos(i * 0.15 + time * 0.0001 * speed) * height * 2) % height;
      const size = Math.sin(i + time * 0.001 * speed) * 0.5 + 0.5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${size * (isMobile ? 0.2 : 0.3)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [dimensions, isMobile]);

  // Función para dibujar nebulosas (optimizada para móvil)
  const drawNebulae = useCallback((ctx, time) => {
    const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
    
    // Saltear nebulosas en móviles para mejor performance
    if (!config.enableNebulae) return;
    
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const speed = config.animationSpeed;
    
    // Crear gradientes de nebulosa
    for (let i = 0; i < 3; i++) {
      const x = centerX + Math.sin(time * 0.0005 * speed + i) * 200;
      const y = centerY + Math.cos(time * 0.0003 * speed + i) * 150;
      const radius = 150 + Math.sin(time * 0.001 * speed + i) * 50;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(156, 39, 176, ${0.1 + Math.sin(time * 0.002 * speed + i) * 0.05})`);
      gradient.addColorStop(0.5, `rgba(63, 81, 181, ${0.05 + Math.sin(time * 0.001 * speed + i) * 0.03})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [dimensions, isMobile]);

  // Función para dibujar constelaciones
  const drawConstellations = useCallback((ctx, constellations, time) => {
    const { width, height } = dimensions;
    const centerX = width / 2 + camera.x;
    const centerY = height / 2 + camera.y;
    const { radiusX, radiusY } = getGalaxyRadii();
    const placedLabels = isMobile ? [] : [
      {
        left: 0,
        right: 96,
        top: Math.max(0, height / 2 - 132),
        bottom: Math.min(height, height / 2 + 132)
      },
      {
        left: Math.max(0, width - 232),
        right: width,
        top: Math.max(0, height / 2 - 92),
        bottom: Math.min(height, height / 2 + 92)
      },
      {
        left: 0,
        right: Math.min(width, 360),
        top: Math.max(0, height - 132),
        bottom: height
      }
    ];
    
    constellations.forEach((constellation, index) => {
      let animatedX, animatedY;
      
      // Si esta constelación está enfocada, posicionarla al frente y detener rotación
      if (focusedConstellation && focusedConstellation === constellation.id) {
        // Posición fija al frente del centro
        animatedX = 0;
        animatedY = -150; // Ligeramente arriba del centro
      } else {
        // Animación de rotación normal para constelaciones no enfocadas (optimizada para móvil)
        const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
        const rotationSpeed = 0.000018 * config.animationSpeed;
        const rotationAngle = constellation.angle + (time * rotationSpeed);
        
        // Posición animada de la constelación (también optimizada)
        const orbitalDrift = Math.sin(time * 0.0003 * config.animationSpeed + index) * 12;
        animatedX = Math.cos(rotationAngle) * (radiusX + orbitalDrift);
        animatedY = Math.sin(rotationAngle) * (radiusY + orbitalDrift * 0.65);
      }
      
      const consX = centerX + animatedX * camera.zoom;
      const consY = centerY + animatedY * camera.zoom;
      
      // Efecto pulsante para constelaciones seleccionadas o con hover (optimizado para móvil)
      const isActive = selectedCategory && selectedCategory.id === constellation.id;
      const isFocused = focusedConstellation === constellation.id;
      const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
      const pulseIntensity = isFocused ? 
        Math.sin(time * 0.003 * config.animationSpeed) * 0.4 + 1.0 : 
        isActive ? 
        Math.sin(time * 0.002 * config.animationSpeed) * 0.3 + 0.7 : 
        Math.sin(time * 0.001 * config.animationSpeed + index) * 0.1 + 0.9;
      
      // Dibujar aura de constelación con animación
      const baseAuraRadius = isFocused ? 120 * camera.zoom : 80 * camera.zoom;
      const auraRadius = baseAuraRadius * pulseIntensity;
      const auraGradient = ctx.createRadialGradient(consX, consY, 0, consX, consY, auraRadius);
      
      // Colores más intensos para constelaciones enfocadas y activas
      const auraAlpha = isFocused ? '60' : isActive ? '40' : '20';
      const auraAlphaOuter = isFocused ? '30' : isActive ? '20' : '10';
      
      auraGradient.addColorStop(0, `${constellation.color}${auraAlpha}`);
      auraGradient.addColorStop(0.7, `${constellation.color}${auraAlphaOuter}`);
      auraGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(consX, consY, auraRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Efectos especiales para constelaciones enfocadas
      if (isFocused) {
        // Múltiples anillos de energía (más lentos)
        for (let ring = 1; ring <= 3; ring++) {
          const ringRadius = auraRadius * (0.4 + ring * 0.2);
          const ringAlpha = Math.sin(time * 0.0015 + ring) * 0.3 + 0.5; // Más lento
          ctx.strokeStyle = `${constellation.color}${Math.floor(ringAlpha * 100).toString(16)}`;
          ctx.lineWidth = 3 - ring;
          ctx.beginPath();
          ctx.arc(consX, consY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Destellos giratorios (más lentos)
        for (let i = 0; i < 6; i++) {
          const sparkAngle = time * 0.0008 + (i * Math.PI / 3); // Mucho más lento
          const sparkX = consX + Math.cos(sparkAngle) * auraRadius * 0.8;
          const sparkY = consY + Math.sin(sparkAngle) * auraRadius * 0.8;
          
          ctx.fillStyle = `${constellation.color}AA`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (isActive) {
        // Anillo de energía para constelaciones activas pero no enfocadas
        ctx.strokeStyle = `${constellation.color}60`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(consX, consY, auraRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Dibujar conexiones entre estrellas cercanas con animación
      const shouldShowConnections = isFocused || camera.zoom > 1.5;
      if (shouldShowConnections) {
        constellation.stars.forEach((star, i) => {
          constellation.stars.slice(i + 1).forEach(otherStar => {
            const distance = Math.sqrt(
              Math.pow(star.x - otherStar.x, 2) + 
              Math.pow(star.y - otherStar.y, 2)
            );
            
            if (distance < 80) {
              // Posiciones actualizadas con la rotación de la constelación
              const starX = centerX + (animatedX + (star.x - constellation.x)) * camera.zoom;
              const starY = centerY + (animatedY + (star.y - constellation.y)) * camera.zoom;
              const otherX = centerX + (animatedX + (otherStar.x - constellation.x)) * camera.zoom;
              const otherY = centerY + (animatedY + (otherStar.y - constellation.y)) * camera.zoom;
              
              // Líneas de conexión más visibles para constelaciones enfocadas (optimizado)
              const baseAlpha = isFocused ? 0.7 : 0.4;
              const connectionAlpha = Math.sin(time * 0.001 * config.animationSpeed + i) * 0.2 + baseAlpha;
              ctx.strokeStyle = `${constellation.color}${Math.floor(connectionAlpha * 100).toString(16)}`;
              ctx.lineWidth = isFocused ? 1.5 : (0.5 + (connectionAlpha * 0.5));
              ctx.beginPath();
              ctx.moveTo(starX, starY);
              ctx.lineTo(otherX, otherY);
              ctx.stroke();
            }
          });
        });
      }
      
      // Dibujar estrellas (herramientas) con posiciones animadas
      constellation.stars.forEach((star, starIndex) => {
        // Posición animada de la estrella siguiendo la rotación de la constelación
        const starX = centerX + (animatedX + (star.x - constellation.x)) * camera.zoom;
        const starY = centerY + (animatedY + (star.y - constellation.y)) * camera.zoom;
        const starSize = star.size * camera.zoom;
        
        // Efecto de parpadeo mejorado con variaciones (optimizado para móvil)
        const baseTwinkleSpeed = 0.003 + (starIndex * 0.0008);
        const twinkleSpeed = baseTwinkleSpeed * config.animationSpeed;
        const twinkle = Math.sin(time * twinkleSpeed + star.twinkle * Math.PI * 2) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        
        // Efecto de escala sutil para estrellas (optimizado)
        const scaleVariation = Math.sin(time * 0.002 * config.animationSpeed + starIndex) * 0.1 + 1;
        const animatedStarSize = starSize * scaleVariation;
        
        // Glow effect mejorado para estrellas favoritas
        if (star.isFavorite) {
          const glowRadius = animatedStarSize * 4;
          const glowGradient = ctx.createRadialGradient(starX, starY, 0, starX, starY, glowRadius);
          glowGradient.addColorStop(0, `${GALAXY_CONFIG.colors.secondary}80`);
          glowGradient.addColorStop(0.5, `${GALAXY_CONFIG.colors.secondary}40`);
          glowGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(starX, starY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Anillo orbital para favoritas
          ctx.strokeStyle = `${GALAXY_CONFIG.colors.secondary}60`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(starX, starY, animatedStarSize * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Aura sutil para todas las estrellas
        const starAuraRadius = animatedStarSize * 2.5;
        const starAuraGradient = ctx.createRadialGradient(starX, starY, 0, starX, starY, starAuraRadius);
        starAuraGradient.addColorStop(0, `${constellation.color}40`);
        starAuraGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = starAuraGradient;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(starX, starY, starAuraRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar estrella principal
        ctx.fillStyle = star.isFavorite ? 
          GALAXY_CONFIG.colors.secondary : 
          constellation.color;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        ctx.arc(starX, starY, animatedStarSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo brillante de la estrella
        ctx.fillStyle = 'white';
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(starX, starY, animatedStarSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        
        // Dibujar nombre con mejor estilo - siempre visible para constelaciones enfocadas
        const shouldShowName = isFocused || (camera.zoom > 2 && animatedStarSize > 3);
        if (shouldShowName) {
          const fontSize = isFocused ? 
            Math.max(12, 14 * Math.min(camera.zoom / 2, 1)) : 
            Math.max(8, 10 * Math.min(camera.zoom / 2, 1));
          
          ctx.fillStyle = isFocused ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)';
          ctx.font = `${fontSize}px 'Segoe UI', system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.lineWidth = isFocused ? 3 : 2;
          ctx.strokeText(star.name, starX, starY + animatedStarSize + 20);
          ctx.fillText(star.name, starX, starY + animatedStarSize + 20);
        }
      });
      
      // Dibujar nombre de constelación con efectos mejorados
      if (camera.zoom < 3) {
        const fontSize = Math.max(isMobile ? 11 : 12, Math.min(isMobile ? 13 : 16, 15 * Math.min(camera.zoom, 1)));
        drawConstellationLabel({
          ctx,
          name: constellation.name,
          color: constellation.color,
          x: consX,
          y: consY,
          fontSize,
          canvasWidth: width,
          canvasHeight: height,
          zoom: camera.zoom,
          placedLabels,
          isActive,
          isFocused,
          isMobile
        });
      }
    });
  }, [dimensions, camera, selectedCategory, focusedConstellation, isMobile, getGalaxyRadii]);

  // Interpolación suave de cámara
  const interpolateCamera = useCallback(() => {
    const lerp = (start, end, factor) => start + (end - start) * factor;
    const lerpFactor = 0.08; // Velocidad de interpolación
    
    setCamera(prev => {
      const newX = lerp(prev.x, targetCamera.x, lerpFactor);
      const newY = lerp(prev.y, targetCamera.y, lerpFactor);
      const newZoom = lerp(prev.zoom, targetCamera.zoom, lerpFactor);
      
      // Detener navegación si estamos cerca del objetivo
      const deltaX = Math.abs(newX - targetCamera.x);
      const deltaY = Math.abs(newY - targetCamera.y);
      const deltaZoom = Math.abs(newZoom - targetCamera.zoom);
      
      if (deltaX < 1 && deltaY < 1 && deltaZoom < 0.01) {
        setIsNavigating(false);
      }
      
      return { x: newX, y: newY, zoom: newZoom };
    });
  }, [targetCamera]);

  // Loop de animación principal
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const time = Date.now();
    
    // Interpolar cámara suavemente
    if (isNavigating) {
      interpolateCamera();
    }
    
    // Limpiar canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Dibujar fondo negro espacial
    ctx.fillStyle = '#000015';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // Dibujar elementos de la galaxia
    drawStarField(ctx, time);
    drawNebulae(ctx, time);
    
    // Generar y dibujar constelaciones
    const constellations = generateConstellations();
    drawConstellations(ctx, constellations, time);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [dimensions, drawStarField, drawNebulae, drawConstellations, generateConstellations, isNavigating, interpolateCamera]);

  // Iniciar animación
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, dimensions]);

  // Manejar clics en el canvas
  const handleCanvasClick = useCallback((event) => {
    // Evitar clicks si se ha arrastrado
    if (hasDragged) {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Convertir coordenadas de pantalla a coordenadas de galaxia
    const galaxyX = (clickX - dimensions.width / 2 - camera.x) / camera.zoom;
    const galaxyY = (clickY - dimensions.height / 2 - camera.y) / camera.zoom;
    
    const constellations = generateConstellations();
    const currentTime = Date.now();
    const { radiusX, radiusY } = getGalaxyRadii();
    
    // Buscar estrella clickeada con posiciones animadas
    for (const [index, constellation] of constellations.entries()) {
      let animatedX, animatedY;
      
      // Usar la misma lógica de posicionamiento que en el renderizado
      if (focusedConstellation && focusedConstellation === constellation.id) {
        // Posición fija al frente del centro para constelaciones enfocadas
        animatedX = 0;
        animatedY = -150;
      } else {
        // Calcular posición animada actual de la constelación (misma velocidad que el renderizado)
        const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
        const rotationSpeed = 0.000018 * config.animationSpeed;
        const rotationAngle = constellation.angle + (currentTime * rotationSpeed);
        const orbitalDrift = Math.sin(currentTime * 0.0003 * config.animationSpeed + index) * 12;
        animatedX = Math.cos(rotationAngle) * (radiusX + orbitalDrift);
        animatedY = Math.sin(rotationAngle) * (radiusY + orbitalDrift * 0.65);
      }
      
      for (const star of constellation.stars) {
        // Posición animada de la estrella
        const starAnimatedX = animatedX + (star.x - constellation.x);
        const starAnimatedY = animatedY + (star.y - constellation.y);
        
        const distance = Math.sqrt(
          Math.pow(galaxyX - starAnimatedX, 2) + 
          Math.pow(galaxyY - starAnimatedY, 2)
        );
        
        if (distance < star.size + 15) { // Área de click un poco más grande
          console.log('Clicked on star:', star.name, 'URL:', star.url); // Debug
          // Mostrar preview de la herramienta en lugar de abrir directamente
          setToolPreview(star);
          return;
        }
      }
      
      // Buscar constelación clickeada con posición animada
      const distanceToConstellation = Math.sqrt(
        Math.pow(galaxyX - animatedX, 2) + 
        Math.pow(galaxyY - animatedY, 2)
      );
      
      if (distanceToConstellation < 100) {
        // Si ya está enfocada, desenfocar
        if (focusedConstellation === constellation.id) {
          setFocusedConstellation(null);
          setSelectedConstellation(null);
          if (onCategorySelect) {
            onCategorySelect(null);
          }
          // Volver a la vista general
          setTargetCamera({ x: 0, y: 0, zoom: 1 });
          setIsNavigating(true);
        } else {
          // Enfocar esta constelación
          setFocusedConstellation(constellation.id);
          setSelectedConstellation(constellation.id);
          if (onCategorySelect) {
            const category = categories.find(cat => cat.id === constellation.id);
            onCategorySelect(category);
          }
          
          // Navegar hacia la posición frontal con zoom apropiado
          setTargetCamera({
            x: 0,
            y: 150, // Compensar por la posición y=-150 de la constelación enfocada
            zoom: 2.5  // Zoom mayor para ver las herramientas claramente
          });
          setIsNavigating(true);
        }
        return;
      }
    }
  }, [dimensions, camera, generateConstellations, categories, onCategorySelect, hasDragged, focusedConstellation, isMobile, getGalaxyRadii]);

  // Manejar inicio de arrastre
  const handleMouseDown = useCallback((event) => {
    if (event.button === 0) { // Solo botón izquierdo
      setIsDragging(true);
      setHasDragged(false);
      setDragStart({ x: event.clientX, y: event.clientY });
      setLastPanPosition({ x: camera.x, y: camera.y });
    }
  }, [camera]);

  // Manejar movimiento del mouse
  const handleMouseMove = useCallback((event) => {
    if (isDragging) {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      
      // Si se ha movido lo suficiente, considerar como arrastre
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setHasDragged(true);
      }
      
      // Aplicar el movimiento a la cámara
      const newX = lastPanPosition.x + deltaX / camera.zoom;
      const newY = lastPanPosition.y + deltaY / camera.zoom;
      
      setCamera(prev => ({ ...prev, x: newX, y: newY }));
      setTargetCamera(prev => ({ ...prev, x: newX, y: newY }));
    }
  }, [isDragging, dragStart, lastPanPosition, camera.zoom]);

  // Manejar fin de arrastre
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Funciones de manejo de touch para móviles
  const handleTouchStart = useCallback((event) => {
    event.preventDefault();
    const touchArray = Array.from(event.touches);
    setTouches(touchArray);
    setHasInteracted(true); // Marcar que el usuario ha interactuado
    
    if (touchArray.length === 1) {
      // Un solo dedo - iniciar arrastre
      const touch = touchArray[0];
      const touchPos = getTouchPosition(touch, canvasRef.current);
      setIsDragging(true);
      setHasDragged(false);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setLastPanPosition({ x: camera.x, y: camera.y });
      
      // Detectar doble tap
      const now = Date.now();
      const timeDiff = now - lastTouchTime;
      const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
      
      if (timeDiff < config.doubleTapDelay) {
        // Doble tap - centrar vista
        setTargetCamera({ x: 0, y: 0, zoom: 1 });
        setIsNavigating(true);
      }
      setLastTouchTime(now);
      
    } else if (touchArray.length === 2) {
      // Dos dedos - iniciar pinch zoom
      setIsDragging(false);
      setIsPinchZooming(true);
      const distance = getDistanceBetweenTouches(touchArray[0], touchArray[1]);
      setLastPinchDistance(distance);
    }
  }, [camera, lastTouchTime, isMobile, getTouchPosition, getDistanceBetweenTouches]);

  const handleTouchMove = useCallback((event) => {
    event.preventDefault();
    const touchArray = Array.from(event.touches);
    
    if (touchArray.length === 1 && isDragging) {
      // Un solo dedo - arrastre
      const touch = touchArray[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
      
      // Si se ha movido lo suficiente, considerar como arrastre
      if (Math.abs(deltaX) > config.touchThreshold || Math.abs(deltaY) > config.touchThreshold) {
        setHasDragged(true);
      }
      
      // Aplicar el movimiento a la cámara
      const newX = lastPanPosition.x + deltaX / camera.zoom;
      const newY = lastPanPosition.y + deltaY / camera.zoom;
      
      setCamera(prev => ({ ...prev, x: newX, y: newY }));
      setTargetCamera(prev => ({ ...prev, x: newX, y: newY }));
      
    } else if (touchArray.length === 2) {
      // Dos dedos - pinch zoom
      const currentDistance = getDistanceBetweenTouches(touchArray[0], touchArray[1]);
      
      if (lastPinchDistance > 0) {
        const scale = currentDistance / lastPinchDistance;
        const newZoom = Math.max(0.5, Math.min(camera.zoom * scale, 4));
        
        // Obtener centro entre los dedos
        const center = getCenterBetweenTouches(touchArray[0], touchArray[1]);
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;
        
        // Ajustar posición de cámara para hacer zoom hacia el centro de los dedos
        const worldCenterX = (centerX - dimensions.width / 2 - camera.x) / camera.zoom;
        const worldCenterY = (centerY - dimensions.height / 2 - camera.y) / camera.zoom;
        
        const newCameraX = camera.x + worldCenterX * (camera.zoom - newZoom);
        const newCameraY = camera.y + worldCenterY * (camera.zoom - newZoom);
        
        setCamera({ x: newCameraX, y: newCameraY, zoom: newZoom });
        setTargetCamera({ x: newCameraX, y: newCameraY, zoom: newZoom });
      }
      
      setLastPinchDistance(currentDistance);
    }
  }, [isDragging, dragStart, lastPanPosition, camera, lastPinchDistance, 
      isMobile, dimensions, getDistanceBetweenTouches, getCenterBetweenTouches]);

  const handleTouchEnd = useCallback((event) => {
    event.preventDefault();
    const touchArray = Array.from(event.touches);
    
    if (touchArray.length === 0) {
      // No más dedos - finalizar todas las interacciones
      setIsDragging(false);
      setIsPinchZooming(false);
      setLastPinchDistance(0);
      setTouches([]);
      
      // Si no hubo arrastre, simular click
      if (!hasDragged && touches.length === 1) {
        const touch = touches[0];
        const touchPos = getTouchPosition(touch, canvasRef.current);
        
        // Simular evento de click para reutilizar la lógica existente
        const fakeEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          clientX: touch.clientX,
          clientY: touch.clientY
        };
        handleCanvasClick(fakeEvent);
      }
      
    } else if (touchArray.length === 1) {
      // Queda un dedo - volver a modo arrastre
      setIsPinchZooming(false);
      setLastPinchDistance(0);
      const touch = touchArray[0];
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setLastPanPosition({ x: camera.x, y: camera.y });
    }
    
    setTouches(touchArray);
  }, [hasDragged, touches, camera, getTouchPosition, handleCanvasClick]);

  // Manejar wheel para zoom mejorado
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(camera.zoom * zoomFactor, 5));
    
    // Calcular punto de zoom basado en la posición del mouse
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Ajustar posición de cámara para hacer zoom hacia el cursor
    const worldMouseX = (mouseX - dimensions.width / 2 - camera.x) / camera.zoom;
    const worldMouseY = (mouseY - dimensions.height / 2 - camera.y) / camera.zoom;
    
    const newCameraX = camera.x + worldMouseX * (camera.zoom - newZoom);
    const newCameraY = camera.y + worldMouseY * (camera.zoom - newZoom);
    
    setCamera({ x: newCameraX, y: newCameraY, zoom: newZoom });
    setTargetCamera({ x: newCameraX, y: newCameraY, zoom: newZoom });
  }, [camera, dimensions]);

  // Agregar listeners de mouse y touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Eventos de mouse (para desktop)
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Eventos de touch (para móviles)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Prevenir comportamientos por defecto del navegador en móviles
    canvas.style.touchAction = 'none';
    
    return () => {
      // Limpiar listeners de mouse
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Limpiar listeners de touch
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && toolPreview) {
        setToolPreview(null);
      }
    };

    if (toolPreview) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [toolPreview]);

  const focusedCategory = selectedCategory || categories.find(category => category.id === focusedConstellation);
  const config = isMobile ? GALAXY_CONFIG.mobile : GALAXY_CONFIG.desktop;
  const renderedToolCount = categories.reduce((total, category) => {
    const categoryToolCount = tools.filter(tool => tool.category === category.id).length;
    return total + Math.min(categoryToolCount, config.maxStarsPerConstellation);
  }, 0);
  const renderedStarsLabel = renderedToolCount === 1 ? 'estrella representada' : 'estrellas representadas';

  return (
    <div 
      ref={containerRef} 
      className={`galaxy-view galaxy-view--${viewMode} ${isNavigating ? 'navigating' : ''} ${isDragging ? 'dragging' : ''} ${isMobile ? 'mobile' : ''} ${hasInteracted ? 'interacted' : ''} ${isPinchZooming ? 'pinch-zooming' : ''} ${touches.length > 0 ? 'touch-active' : ''}`}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        className="galaxy-canvas"
      />

      <div className="catalog-view-switcher" role="group" aria-label="Vista del catálogo">
        <button
          type="button"
          className={viewMode === 'galaxy' ? 'is-active' : ''}
          onClick={() => setViewMode('galaxy')}
          aria-pressed={viewMode === 'galaxy'}
        >
          <Sparkles size={17} aria-hidden="true" />
          Galaxia
        </button>
        <button
          type="button"
          className={viewMode === 'list' ? 'is-active' : ''}
          onClick={() => setViewMode('list')}
          aria-pressed={viewMode === 'list'}
        >
          <LayoutList size={17} aria-hidden="true" />
          Lista
        </button>
      </div>

      {viewMode === 'galaxy' ? (
        <>
          {(searchQuery || focusedCategory) && (
            <div className="galaxy-context-panel" aria-live="polite">
              <Sparkles size={16} aria-hidden="true" />
              <span className="galaxy-context-panel__copy">
                <b>
                  {focusedCategory ? focusedCategory.name : 'Catálogo completo'}
                  {searchQuery ? ` · "${searchQuery}"` : ''}
                </b>
                <small>{renderedToolCount} de {tools.length} representadas en la galaxia</small>
              </span>
              <strong>{tools.length}</strong>
            </div>
          )}

          {/* Controles de navegación */}
          <div className="galaxy-controls">
            <button
              className="galaxy-btn"
              onClick={() => {
                setTargetCamera({ x: 0, y: 0, zoom: 1 });
                setIsNavigating(true);
              }}
              title="Regresar al centro"
              aria-label="Regresar al centro"
            >
              <Home size={22} aria-hidden="true" />
            </button>
            <button
              className="galaxy-btn"
              onClick={() => {
                const newZoom = Math.min(camera.zoom * 1.2, 5);
                setTargetCamera(prev => ({ ...prev, zoom: newZoom }));
                setIsNavigating(true);
              }}
              title="Acercar"
              aria-label="Acercar"
            >
              <ZoomIn size={22} aria-hidden="true" />
            </button>
            <button
              className="galaxy-btn"
              onClick={() => {
                const newZoom = Math.max(camera.zoom * 0.8, 0.1);
                setTargetCamera(prev => ({ ...prev, zoom: newZoom }));
                setIsNavigating(true);
              }}
              title="Alejar"
              aria-label="Alejar"
            >
              <ZoomOut size={22} aria-hidden="true" />
            </button>
            <button
              className="galaxy-btn"
              onClick={() => {
                const orbitRadius = 200;
                const angle = Math.random() * Math.PI * 2;
                setTargetCamera({
                  x: Math.cos(angle) * orbitRadius,
                  y: Math.sin(angle) * orbitRadius,
                  zoom: 1.5
                });
                setIsNavigating(true);
              }}
              title="Explorar órbita"
              aria-label="Explorar órbita"
            >
              <Compass size={22} aria-hidden="true" />
            </button>
            {focusedConstellation && (
              <button
                className="galaxy-btn galaxy-btn--danger"
                onClick={() => {
                  setFocusedConstellation(null);
                  setSelectedConstellation(null);
                  if (onCategorySelect) {
                    onCategorySelect(null);
                  }
                  setTargetCamera({ x: 0, y: 0, zoom: 1 });
                  setIsNavigating(true);
                }}
                title="Salir del enfoque"
                aria-label="Salir del enfoque"
              >
                <X size={22} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Información de navegación */}
          <div className="galaxy-info">
            <div className="galaxy-stats">
              <div className="stat">
                <span className="stat-label">Constelaciones:</span>
                <span className="stat-value">{categories.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Estrellas:</span>
                <span className="stat-value">{renderedToolCount}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Catálogo:</span>
                <span className="stat-value">{tools.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Zoom:</span>
                <span className="stat-value">{camera.zoom.toFixed(1)}x</span>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="galaxy-legend" aria-label="Resumen de galaxia">
            <div className="galaxy-legend__title">
              <Sparkles size={18} aria-hidden="true" />
              <h4>Galaxia OSINTArgy</h4>
            </div>
            <div className="galaxy-legend__meta">
              <span>{categories.length} constelaciones</span>
              <span>{renderedToolCount} {renderedStarsLabel}</span>
              <span>{tools.length} herramientas en el catálogo</span>
            </div>
            <p>Cambiá a Lista para verlas todas.</p>
            {focusedConstellation && (
              <p className="galaxy-legend__focus">Constelación enfocada</p>
            )}
          </div>
        </>
      ) : (
        <ToolCatalogList
          tools={tools}
          categories={categories}
          focusedCategory={focusedCategory}
          onToolSelect={setToolPreview}
        />
      )}

      {/* Modal de preview de herramienta */}
      {toolPreview && (
        <div className="tool-preview-overlay" onClick={() => setToolPreview(null)}>
          <div className="tool-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tool-preview-header">
              <h3>{toolPreview.name}</h3>
              <button 
                className="close-preview-btn"
                onClick={() => setToolPreview(null)}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            
            <div className="tool-preview-content">
              <div className="tool-description">
                <h4>Descripción</h4>
                <p>{toolPreview.description}</p>
              </div>
              
              {toolPreview.utility && (
                <div className="tool-utility">
                  <h4>Utilidad</h4>
                  <p>{toolPreview.utility}</p>
                </div>
              )}
              
              <div className="tool-details">
                <div className="tool-tags">
                  <h4>Tags</h4>
                  <div className="tags-container">
                    {toolPreview.tags?.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                
                {toolPreview.rating && (
                  <div className="tool-rating">
                    <h4>Rating</h4>
                    <div className="rating-display">
                      {Array.from({length: 5}, (_, i) => (
                        <span key={i} className={i < Math.floor(toolPreview.rating) ? 'star filled' : 'star'}>
                          ⭐
                        </span>
                      ))}
                      <span className="rating-number">({toolPreview.rating}/5)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="tool-preview-actions">
              <button 
                className="cancel-btn"
                onClick={() => setToolPreview(null)}
              >
                <ArrowLeft size={18} aria-hidden="true" />
                Cancelar
              </button>
              <button 
                className="add-case-btn"
                onClick={() => addToolToActiveCase(toolPreview)}
                title={activeCase ? `Agregar a ${activeCase.name}` : 'Seleccionar un caso'}
              >
                <Briefcase size={18} aria-hidden="true" />
                {activeCase ? 'Agregar al caso' : 'Elegir caso'}
              </button>
              <button
                className="open-tool-btn"
                onClick={() => addToolToActiveCase(toolPreview, { openSource: true })}
              >
                <ExternalLink size={18} aria-hidden="true" />
                Abrir y registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalaxyView;
