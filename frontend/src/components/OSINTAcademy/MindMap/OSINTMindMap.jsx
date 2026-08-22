import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from '@/lib/router'
import { 
  Search, 
  Image, 
  Mail, 
  Globe, 
  Shield, 
  Users, 
  Database,
  Eye,
  Link,
  Code,
  Zap,
  ArrowLeft
} from 'lucide-react'
import './OSINTMindMap.css'
import { useAcademyProgress } from '../useAcademyProgress'

const OSINTMindMap = () => {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const { progress, recordActivity } = useAcademyProgress()
  const svgRef = useRef(null)
  const zoomLabelRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [exploredNodes, setExploredNodes] = useState(() => (
    progress.activities.mindmap?.exploredNodes || []
  ))

  // Datos del mapa mental OSINT
  const mindMapData = {
    name: "OSINT",
    icon: Eye,
    description: "Inteligencia de Fuentes Abiertas",
    category: "root",
    children: [
      {
        name: "Búsqueda",
        icon: Search,
        description: "Técnicas de búsqueda avanzada",
        category: "search",
        children: [
          { name: "Google Dorks", icon: Code, description: "Consultas especializadas para encontrar información específica", category: "technique" },
          { name: "Bing", icon: Globe, description: "Motor de búsqueda de Microsoft", category: "tool" },
          { name: "DuckDuckGo", icon: Shield, description: "Búsqueda privada y segura", category: "tool" },
          { name: "Yandex", icon: Search, description: "Motor de búsqueda ruso, útil para imágenes", category: "tool" }
        ]
      },
      {
        name: "Redes Sociales",
        icon: Users,
        description: "Investigación en plataformas sociales",
        category: "social",
        children: [
          { name: "Facebook", icon: Users, description: "Perfiles, páginas, grupos y publicaciones públicas", category: "platform" },
          { name: "X", icon: Users, description: "Búsqueda avanzada de publicaciones y conversaciones", category: "platform" },
          { name: "LinkedIn", icon: Users, description: "Red profesional, información laboral", category: "platform" },
          { name: "Instagram", icon: Image, description: "Fotos y ubicaciones", category: "platform" },
          { name: "TikTok", icon: Users, description: "Videos virales y tendencias", category: "platform" }
        ]
      },
      {
        name: "Imágenes",
        icon: Image,
        description: "Análisis y verificación de imágenes",
        category: "images",
        children: [
          { name: "Google Images", icon: Search, description: "Búsqueda inversa de imágenes", category: "tool" },
          { name: "TinEye", icon: Eye, description: "Motor de búsqueda inversa especializado", category: "tool" },
          { name: "Exif Data", icon: Database, description: "Metadatos de imágenes", category: "technique" },
          { name: "FotoForensics", icon: Shield, description: "Análisis de manipulación de imágenes", category: "tool" }
        ]
      },
      {
        name: "Emails",
        icon: Mail,
        description: "Verificación y análisis de correos",
        category: "email",
        children: [
          { name: "Hunter.io", icon: Search, description: "Búsqueda de emails corporativos", category: "tool" },
          { name: "Have I Been Pwned", icon: Shield, description: "Verificación de brechas de datos", category: "tool" },
          { name: "Email Headers", icon: Code, description: "Análisis de headers de correo", category: "technique" },
          { name: "SPF/DKIM", icon: Shield, description: "Verificación de autenticidad", category: "technique" }
        ]
      },
      {
        name: "Dominios & IPs",
        icon: Globe,
        description: "Investigación de infraestructura",
        category: "infrastructure",
        children: [
          { name: "Whois", icon: Database, description: "Información de registro de dominios", category: "technique" },
          { name: "Shodan", icon: Search, description: "Motor de búsqueda para dispositivos IoT", category: "tool" },
          { name: "Censys", icon: Eye, description: "Escaneo de internet y certificados", category: "tool" },
          { name: "DNS Records", icon: Link, description: "Registros del sistema de nombres de dominio", category: "technique" }
        ]
      },
      {
        name: "Herramientas",
        icon: Zap,
        description: "Utilidades y frameworks OSINT",
        category: "tools",
        children: [
          { name: "Maltego", icon: Link, description: "Análisis de enlaces y relaciones", category: "tool" },
          { name: "SpiderFoot", icon: Search, description: "Automatización de reconocimiento", category: "tool" },
          { name: "TheHarvester", icon: Database, description: "Recopilación de información", category: "tool" },
          { name: "OSINT Framework", icon: Globe, description: "Colección de herramientas OSINT", category: "tool" }
        ]
      }
    ]
  }

  // Colores por categoría
  const categoryColors = {
    root: '#39b9dc',
    search: '#50a9c2',
    social: '#438ca3',
    images: '#5bbfd1',
    email: '#397b91',
    infrastructure: '#2f6578',
    tools: '#4c9bad',
    technique: '#64c6d8',
    tool: '#547783',
    platform: '#3d8299'
  }

  const categoryLabels = {
    root: 'Raíz',
    search: 'Búsqueda',
    social: 'Redes sociales',
    images: 'Imágenes',
    email: 'Correo',
    infrastructure: 'Infraestructura',
    tools: 'Herramientas',
    technique: 'Técnica',
    tool: 'Herramienta',
    platform: 'Plataforma'
  }

  useEffect(() => {
    drawMindMap()
  }, [searchTerm])

  useEffect(() => {
    recordActivity('mindmap', {
      exploredNodes,
      completed: exploredNodes.length >= 8
    })
  }, [exploredNodes, recordActivity])

  const drawMindMap = () => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 1000
    const height = 700
    const centerX = width / 2
    const centerY = height / 2

    // Configurar zoom
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
        if (zoomLabelRef.current) {
          zoomLabelRef.current.textContent = `Zoom: ${Math.round(event.transform.k * 100)}%`
        }
      })

    svg.call(zoom)

    const container = svg.append('g')

    // Preparar datos jerárquicos
    const root = d3.hierarchy(mindMapData)
    
    // Filtrar nodos según búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      root.each(d => {
        d.visible = d.data.name.toLowerCase().includes(searchLower) ||
                   d.data.description.toLowerCase().includes(searchLower)
      })
    } else {
      root.each(d => { d.visible = true })
    }

    // Layout radial
    const angleStep = (2 * Math.PI) / root.children.length
    
    root.children.forEach((child, i) => {
      const angle = i * angleStep - Math.PI / 2
      const distance = 200
      child.x = centerX + Math.cos(angle) * distance
      child.y = centerY + Math.sin(angle) * distance
      
      // Posicionar subnodos
      if (child.children) {
        const subAngleStep = Math.PI / (child.children.length + 1)
        const startAngle = angle - Math.PI / 3
        
        child.children.forEach((subchild, j) => {
          const subAngle = startAngle + (j + 1) * subAngleStep
          const subDistance = 120
          subchild.x = child.x + Math.cos(subAngle) * subDistance
          subchild.y = child.y + Math.sin(subAngle) * subDistance
        })
      }
    })

    root.x = centerX
    root.y = centerY

    // Dibujar enlaces
    const links = []
    root.each(d => {
      if (d.parent && d.visible && d.parent.visible) {
        links.push({ source: d.parent, target: d })
      }
    })

    container.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', '#477482')
      .attr('stroke-width', 2)
      .attr('opacity', 0.6)

    // Dibujar nodos
    const activateNode = (event, d) => {
      event?.preventDefault?.()
      setSelectedNode(d.data)
      setExploredNodes(nodes => Array.from(new Set([...nodes, d.data.name])))
    }

    const nodeGroups = container.selectAll('.node')
      .data(root.descendants().filter(d => d.visible))
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', d => `Explorar ${d.data.name}: ${d.data.description}`)
      .style('cursor', 'pointer')
      .on('click', activateNode)
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') activateNode(event, d)
      })
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(reduceMotion ? 0 : 200)
          .attr('r', d => getNodeRadius(d) * 1.2)
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(reduceMotion ? 0 : 200)
          .attr('r', d => getNodeRadius(d))
      })

    // Círculos de nodos
    nodeGroups.append('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => categoryColors[d.data.category] || '#95a5a6')
      .attr('stroke', '#0b1b24')
      .attr('stroke-width', 3)

    // Iconos de nodos (simulados con texto)
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#edf8fb')
      .attr('font-size', d => d.depth === 0 ? '20px' : '14px')
      .attr('font-weight', 'bold')
      .text(d => d.data.name.substring(0, 2).toUpperCase())

    // Etiquetas de nodos
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => getNodeRadius(d) + 20)
      .attr('fill', '#b7d0da')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(d => d.data.name)

    // Animación de entrada
    nodeGroups.style('opacity', 0)
      .transition()
      .duration(reduceMotion ? 0 : 600)
      .delay((d, i) => reduceMotion ? 0 : i * 28)
      .style('opacity', 1)
  }

  const getNodeRadius = (d) => {
    if (d.depth === 0) return 40
    if (d.depth === 1) return 30
    return 20
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const resetZoom = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().duration(reduceMotion ? 0 : 500).call(
      d3.zoom().transform,
      d3.zoomIdentity
    )
    if (zoomLabelRef.current) zoomLabelRef.current.textContent = 'Zoom: 100%'
  }

  return (
    <div className="osint-mindmap">
      <div className="mindmap-header">
        <button
          type="button"
          className="mindmap-back"
          onClick={() => navigate('/academy', { state: { selectedAcademy: 'osint' } })}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver a Academia
        </button>
        <h1>Mapa Mental OSINT Interactivo</h1>
        <p>Explora las diferentes categorías y herramientas de OSINT</p>
        <span className="mindmap-explored">
          {exploredNodes.length} {exploredNodes.length === 1 ? 'nodo explorado' : 'nodos explorados'}
        </span>
      </div>

      <div className="mindmap-controls">
        <div className="search-control">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar en el mapa mental..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="zoom-controls">
          <span ref={zoomLabelRef} className="zoom-level">Zoom: 100%</span>
          <button onClick={resetZoom} className="reset-zoom">
            Centrar
          </button>
        </div>
      </div>

      <div className="mindmap-container">
        <svg
          ref={svgRef}
          width="100%"
          height="700"
          viewBox="0 0 1000 700"
          className="mindmap-svg"
        />
        
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              className="node-details"
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
            >
              <div className="node-details-header">
                <div className="node-icon">
                  {React.createElement(selectedNode.icon, { size: 24 })}
                </div>
                <h3>{selectedNode.name}</h3>
                <button 
                  className="close-details"
                  onClick={() => setSelectedNode(null)}
                  aria-label="Cerrar detalles"
                >
                  ×
                </button>
              </div>
              
              <p className="node-description">
                {selectedNode.description}
              </p>
              
              <div className="node-category">
                <span className={`category-badge ${selectedNode.category}`}>
                  {categoryLabels[selectedNode.category] || selectedNode.category}
                </span>
              </div>
              
              {selectedNode.children && (
                <div className="node-children">
                  <h4>Subcategorías:</h4>
                  <div className="children-list">
                    {selectedNode.children.map((child, index) => (
                      <div key={index} className="child-item">
                        <span className="child-name">{child.name}</span>
                        <span className="child-description">{child.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mindmap-legend">
        <h4>Leyenda</h4>
        <div className="legend-items">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: color }}
              />
              <span>{categoryLabels[category] || category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OSINTMindMap
