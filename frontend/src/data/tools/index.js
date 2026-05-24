// Índice de herramientas OSINT organizadas por categoría
// Fase 4: Contenido y Localización - OSINTArgy

import buscadoresGenerales from './buscadores-generales.json';
import redesSociales from './redes-sociales.json';
import email from './email.json';
import dominiosIps from './dominios-ips.json';
import geolocalizacion from './geolocalizacion.json';
import imagenesVideos from './imagenes-videos.json';
import documentosMetadatos from './documentos-metadatos.json';
import darkwebAmenazas from './darkweb-amenazas.json';
import argentinaLatam from './argentina-latam.json';
import telefonos from './telefonos.json';
import archivos from './archivos.json';
import criptomonedas from './criptomonedas.json';
import utilidadesVarios from './utilidades-varios.json';
import analisisVisualizacion from './analisis-visualizacion.json';
import sistemaInfraestructura from './sistema-infraestructura.json';

/**
 * Combina todas las herramientas de diferentes categorías
 * @returns {Object} Objeto con todas las herramientas organizadas
 */
export const getAllTools = () => {
  const allTools = [
    ...buscadoresGenerales.tools,
    ...redesSociales.tools,
    ...email.tools,
    ...dominiosIps.tools,
    ...geolocalizacion.tools,
    ...imagenesVideos.tools,
    ...documentosMetadatos.tools,
    ...darkwebAmenazas.tools,
    ...argentinaLatam.tools,
    ...telefonos.tools,
    ...archivos.tools,
    ...criptomonedas.tools,
    ...utilidadesVarios.tools,
    ...analisisVisualizacion.tools,
    ...sistemaInfraestructura.tools
  ];

  return {
    tools: allTools,
    totalCount: allTools.length,
    categories: {
      'buscadores-generales': buscadoresGenerales.tools,
      'redes-sociales': redesSociales.tools,
      'email': email.tools,
      'dominios-ips': dominiosIps.tools,
      'geolocalizacion': geolocalizacion.tools,
      'imagenes-videos': imagenesVideos.tools,
      'documentos-metadatos': documentosMetadatos.tools,
      'darkweb-amenazas': darkwebAmenazas.tools,
      'argentina-latam': argentinaLatam.tools,
      'telefonos': telefonos.tools,
      'archivos': archivos.tools,
      'criptomonedas': criptomonedas.tools,
      'utilidades-varios': [
        ...utilidadesVarios.tools,
        ...sistemaInfraestructura.tools
      ],
      'analisis-visualizacion': analisisVisualizacion.tools
    }
  };
};

/**
 * Obtiene herramientas por categoría específica
 * @param {string} categoryId - ID de la categoría
 * @returns {Array} Array de herramientas de la categoría
 */
export const getToolsByCategory = (categoryId) => {
  const toolsData = getAllTools();
  return toolsData.categories[categoryId] || [];
};

/**
 * Busca herramientas por término de búsqueda
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} Array de herramientas que coinciden
 */
export const searchTools = (searchTerm) => {
  const allTools = getAllTools().tools;
  const term = searchTerm.toLowerCase();
  
  return allTools.filter(tool => 
    tool.name.toLowerCase().includes(term) ||
    tool.description.toLowerCase().includes(term) ||
    tool.utility.toLowerCase().includes(term) ||
    tool.tags.some(tag => tag.toLowerCase().includes(term))
  );
};

/**
 * Filtra herramientas por múltiples criterios
 * @param {Object} filters - Objeto con filtros
 * @returns {Array} Array de herramientas filtradas
 */
export const filterTools = (filters = {}) => {
  let tools = getAllTools().tools;
  
  if (filters.category) {
    tools = tools.filter(tool => tool.category === filters.category);
  }
  
  if (filters.subcategory) {
    tools = tools.filter(tool => tool.subcategory === filters.subcategory);
  }
  
  if (filters.region) {
    tools = tools.filter(tool => tool.region === filters.region);
  }
  
  if (filters.language) {
    tools = tools.filter(tool => tool.language === filters.language);
  }
  
  if (filters.difficulty_level) {
    tools = tools.filter(tool => tool.difficulty_level === filters.difficulty_level);
  }
  
  if (filters.is_free !== undefined) {
    tools = tools.filter(tool => tool.is_free === filters.is_free);
  }
  
  if (filters.requires_registration !== undefined) {
    tools = tools.filter(tool => tool.requires_registration === filters.requires_registration);
  }
  
  if (filters.type) {
    tools = tools.filter(tool => tool.type === filters.type);
  }
  
  if (filters.indicators && filters.indicators.length > 0) {
    tools = tools.filter(tool => 
      filters.indicators.some(indicator => tool.indicators.includes(indicator))
    );
  }
  
  return tools;
};

/**
 * Obtiene estadísticas de las herramientas
 * @returns {Object} Objeto con estadísticas
 */
export const getToolsStats = () => {
  const allTools = getAllTools().tools;
  
  const stats = {
    total: allTools.length,
    byCategory: {},
    byRegion: {},
    byLanguage: {},
    byDifficulty: {},
    byType: {},
    freeTools: allTools.filter(tool => tool.is_free).length,
    paidTools: allTools.filter(tool => !tool.is_free).length,
    requiresRegistration: allTools.filter(tool => tool.requires_registration).length,
    noRegistration: allTools.filter(tool => !tool.requires_registration).length
  };
  
  // Estadísticas por categoría
  allTools.forEach(tool => {
    stats.byCategory[tool.category] = (stats.byCategory[tool.category] || 0) + 1;
    stats.byRegion[tool.region] = (stats.byRegion[tool.region] || 0) + 1;
    stats.byLanguage[tool.language] = (stats.byLanguage[tool.language] || 0) + 1;
    stats.byDifficulty[tool.difficulty_level] = (stats.byDifficulty[tool.difficulty_level] || 0) + 1;
    stats.byType[tool.type] = (stats.byType[tool.type] || 0) + 1;
  });
  
  return stats;
};

/**
 * Obtiene herramientas recomendadas basadas en popularidad y rating
 * @param {number} limit - Número máximo de herramientas a retornar
 * @returns {Array} Array de herramientas recomendadas
 */
export const getRecommendedTools = (limit = 10) => {
  const allTools = getAllTools().tools;
  
  return allTools
    .sort((a, b) => {
      // Ordenar por rating y usage_count
      const scoreA = (a.rating * 0.7) + (a.usage_count / 1000 * 0.3);
      const scoreB = (b.rating * 0.7) + (b.usage_count / 1000 * 0.3);
      return scoreB - scoreA;
    })
    .slice(0, limit);
};

/**
 * Obtiene herramientas específicas de Argentina/LATAM
 * @returns {Array} Array de herramientas regionales
 */
export const getArgentinaLatamTools = () => {
  return argentinaLatam.tools;
};

export default {
  getAllTools,
  getToolsByCategory,
  searchTools,
  filterTools,
  getToolsStats,
  getRecommendedTools,
  getArgentinaLatamTools
};
