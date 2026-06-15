import fallbackTools from '../tools.json';

/**
 * Índice sincronizado de herramientas OSINT.
 * La fuente editable vive en ./tools/*.json y scripts/sync-tools-fallback.mjs
 * genera ../tools.json para que el frontend no dependa de imports manuales.
 */
const allTools = fallbackTools.tools || [];

const groupToolsByCategory = (tools) => tools.reduce((groups, tool) => {
  if (!groups[tool.category]) {
    groups[tool.category] = [];
  }

  groups[tool.category].push(tool);
  return groups;
}, {});

export const getAllTools = () => {
  const categories = groupToolsByCategory(allTools);

  return {
    tools: allTools,
    totalCount: allTools.length,
    categories
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
  return getToolsByCategory('argentina-latam');
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
