import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  GitBranch, 
  Download, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Home,
  CheckCircle,
  Circle,
  ExternalLink,
  Info,
  ArrowLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getFlowchartsInfo, getFlowchartById } from '@/data/flowcharts'
import toast from 'react-hot-toast'
import './OSINTFlowcharts.css'

const NODE_WIDTH = 178
const NODE_HEIGHT = 74
const NODE_GAP_X = 86
const NODE_GAP_Y = 34
const NODE_MARGIN = 76

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const wrapSvgLabel = (label, maxChars = 20) => {
  const words = String(label || '').split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)

  if (lines.length <= 2) return lines

  const compact = [lines[0], lines.slice(1).join(' ')]
  if (compact[1].length > maxChars) {
    compact[1] = `${compact[1].slice(0, maxChars - 3).trim()}...`
  }

  return compact
}

const getFlowchartLayout = (flowchart) => {
  if (!flowchart) {
    return { width: 1200, height: 720, nodes: new Map() }
  }

  const nodeById = new Map(flowchart.nodes.map((node) => [node.id, node]))
  const outgoing = new Map()
  const incoming = new Map()

  flowchart.nodes.forEach((node) => {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  })

  flowchart.connections.forEach((connection) => {
    if (!nodeById.has(connection.from) || !nodeById.has(connection.to)) return
    outgoing.get(connection.from).push(connection.to)
    incoming.get(connection.to).push(connection.from)
  })

  const roots = flowchart.nodes.filter((node) => node.type === 'start' || incoming.get(node.id).length === 0)
  const queue = roots.length > 0 ? roots.map((node) => node.id) : [flowchart.nodes[0]?.id].filter(Boolean)
  const depthById = new Map(queue.map((nodeId) => [nodeId, 0]))

  while (queue.length > 0) {
    const nodeId = queue.shift()
    const currentDepth = depthById.get(nodeId) || 0

    outgoing.get(nodeId).forEach((targetId) => {
      const nextDepth = currentDepth + 1
      if (!depthById.has(targetId) || nextDepth > depthById.get(targetId)) {
        depthById.set(targetId, nextDepth)
        if (nextDepth < flowchart.nodes.length) {
          queue.push(targetId)
        }
      }
    })
  }

  flowchart.nodes.forEach((node) => {
    if (!depthById.has(node.id)) {
      depthById.set(node.id, Math.max(0, Math.round((node.x || 0) / 240)))
    }
  })

  const columns = new Map()
  flowchart.nodes.forEach((node) => {
    const depth = depthById.get(node.id)
    if (!columns.has(depth)) columns.set(depth, [])
    columns.get(depth).push(node)
  })

  const sortedDepths = [...columns.keys()].sort((a, b) => a - b)
  const maxColumnHeight = Math.max(
    ...sortedDepths.map((depth) => {
      const nodesInColumn = columns.get(depth)
      return nodesInColumn.length * NODE_HEIGHT + Math.max(0, nodesInColumn.length - 1) * NODE_GAP_Y
    }),
    0
  )
  const height = Math.max(720, maxColumnHeight + NODE_MARGIN * 2)
  const maxDepth = sortedDepths.at(-1) || 0
  const width = Math.max(980, NODE_MARGIN * 2 + (maxDepth + 1) * NODE_WIDTH + maxDepth * NODE_GAP_X)
  const layoutNodes = new Map()

  sortedDepths.forEach((depth) => {
    const nodesInColumn = [...columns.get(depth)].sort((a, b) => (a.y || 0) - (b.y || 0))
    const columnHeight = nodesInColumn.length * NODE_HEIGHT + Math.max(0, nodesInColumn.length - 1) * NODE_GAP_Y
    const startY = Math.max(NODE_MARGIN, (height - columnHeight) / 2)
    const x = NODE_MARGIN + depth * (NODE_WIDTH + NODE_GAP_X)

    nodesInColumn.forEach((node, index) => {
      layoutNodes.set(node.id, {
        ...node,
        x,
        y: startY + index * (NODE_HEIGHT + NODE_GAP_Y),
        depth
      })
    })
  })

  return { width, height, nodes: layoutNodes }
}

const OSINTFlowcharts = () => {
  const [selectedFlowchart, setSelectedFlowchart] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  
  const flowchartsInfo = getFlowchartsInfo()
  const flowchartLayout = useMemo(
    () => getFlowchartLayout(selectedFlowchart),
    [selectedFlowchart]
  )

  // Cargar progreso guardado
  useEffect(() => {
    const savedProgress = localStorage.getItem('osint-flowcharts-progress')
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress)
        setCompletedSteps(new Set(progress))
      } catch (error) {
        console.error('Error loading saved progress:', error)
      }
    }
  }, [])

  // Guardar progreso
  useEffect(() => {
    localStorage.setItem('osint-flowcharts-progress', JSON.stringify([...completedSteps]))
  }, [completedSteps])

  const handleFlowchartSelect = (flowchartId) => {
    const flowchart = getFlowchartById(flowchartId)
    setSelectedFlowchart(flowchart)
    setSelectedNode(null)
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleBackToSelection = () => {
    setSelectedFlowchart(null)
    setSelectedNode(null)
  }

  const toggleStepCompletion = (nodeId) => {
    const newCompleted = new Set(completedSteps)
    const stepKey = `${selectedFlowchart.id}-${nodeId}`
    
    if (newCompleted.has(stepKey)) {
      newCompleted.delete(stepKey)
      toast.success('Paso marcado como pendiente')
    } else {
      newCompleted.add(stepKey)
      toast.success('Paso marcado como completado')
    }
    
    setCompletedSteps(newCompleted)
  }

  const handleNodeClick = (node) => {
    setSelectedNode(node)
    
    // Si el nodo tiene herramienta interna, abrir en nueva pestaña
    if (node.internal_tool) {
      window.open(node.internal_tool, '_blank')
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleReset = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.classList?.contains('flowchart__pan-surface')) {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const downloadFlowchart = () => {
    if (!selectedFlowchart || !svgRef.current) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `osint-flowchart-${selectedFlowchart.id}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
    
    toast.success('Flowchart descargado')
  }

  const getNodeColor = (node) => {
    switch (node.type) {
      case 'start': return '#E74C3C'
      case 'process': return '#3498DB'
      case 'result': return '#27AE60'
      case 'data': return '#F39C12'
      default: return '#95A5A6'
    }
  }

  const isStepCompleted = (nodeId) => {
    return completedSteps.has(`${selectedFlowchart?.id}-${nodeId}`)
  }

  const getCompletionPercentage = () => {
    if (!selectedFlowchart) return 0
    const totalSteps = selectedFlowchart.nodes.length
    const completedCount = selectedFlowchart.nodes.filter(node => 
      isStepCompleted(node.id)
    ).length
    return Math.round((completedCount / totalSteps) * 100)
  }

  if (!selectedFlowchart) {
    return (
      <div className="osint-flowcharts">
        <div className="flowcharts__container">
          {/* Header */}
          <div className="flowcharts__header">
            <div className="flowcharts__title">
              <GitBranch className="flowcharts__icon" size={32} />
              <div>
                <h1>OSINT Flowcharts</h1>
              </div>
            </div>
          </div>

          {/* Grid de Flowcharts */}
          <div className="flowcharts__grid">
            {flowchartsInfo.map((flowchart) => (
              <button
                key={flowchart.id}
                className="flowchart__button"
                onClick={() => handleFlowchartSelect(flowchart.id)}
                style={{ '--accent-color': flowchart.color }}
              >
                <span className="flowchart__button-icon">{flowchart.icon}</span>
                <h3 className="flowchart__button-title">{flowchart.title}</h3>
                <p className="flowchart__button-description">{flowchart.description}</p>
              </button>
            ))}
          </div>

          {/* Información adicional */}
          <div className="flowcharts__info">
            <div className="info__card">
              <Info size={24} />
              <div>
                <h3>¿Cómo usar los Flowcharts?</h3>
                <ul>
                  <li>Selecciona el tipo de investigación que quieres realizar</li>
                  <li>Sigue los pasos del diagrama de flujo de forma secuencial</li>
                  <li>Haz clic en los nodos para ver detalles y herramientas</li>
                  <li>Marca los pasos completados para llevar tu progreso</li>
                  <li>Usa las herramientas integradas de OSINTArgy cuando estén disponibles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="osint-flowcharts">
      <div className="flowcharts__container">
        {/* Header del flowchart específico */}
        <div className="flowchart__header">
          <div className="flowchart__nav">
            <button 
              onClick={handleBackToSelection}
              className="back-button"
            >
              <ArrowLeft size={20} />
              Volver a Flowcharts
            </button>
          </div>
          
          <div className="flowchart__info">
            <span className="flowchart__icon-large">{selectedFlowchart.icon}</span>
            <div>
              <h1>{selectedFlowchart.title}</h1>
              <p>{selectedFlowchart.description}</p>
            </div>
          </div>

          <div className="flowchart__controls">
            <div className="progress-info">
              <span className="progress-percentage">{getCompletionPercentage()}%</span>
              <span className="progress-label">Completado</span>
            </div>
            
            <div className="zoom-controls">
              <button onClick={handleZoomOut} className="control-button">
                <ZoomOut size={16} />
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={handleZoomIn} className="control-button">
                <ZoomIn size={16} />
              </button>
              <button onClick={handleReset} className="control-button">
                <Home size={16} />
              </button>
              <button onClick={downloadFlowchart} className="control-button">
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Área del diagrama */}
        <div className="flowchart__diagram-container" ref={containerRef}>
          <svg
            ref={svgRef}
            className="flowchart__svg"
            viewBox={`0 0 ${flowchartLayout.width} ${flowchartLayout.height}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <pattern id="flowchart-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              </pattern>
              <marker
                id="arrowhead"
                markerWidth="12"
                markerHeight="9"
                refX="10"
                refY="4.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 12 4.5, 0 9"
                  fill="#7da6c9"
                />
              </marker>
              
              <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.18)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.04)" />
              </linearGradient>
            </defs>

            <rect
              className="flowchart__pan-surface"
              width={flowchartLayout.width}
              height={flowchartLayout.height}
              fill="url(#flowchart-grid)"
            />
            
            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
              {/* Conexiones */}
              {selectedFlowchart.connections.map((connection, index) => {
                const fromNode = flowchartLayout.nodes.get(connection.from)
                const toNode = flowchartLayout.nodes.get(connection.to)
                
                if (!fromNode || !toNode) return null

                const startX = fromNode.x + NODE_WIDTH
                const startY = fromNode.y + NODE_HEIGHT / 2
                const endX = toNode.x
                const endY = toNode.y + NODE_HEIGHT / 2
                const curve = clamp(Math.abs(endX - startX) * 0.46, 58, 190)
                const path = `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`
                const isConnectionComplete = isStepCompleted(fromNode.id) && isStepCompleted(toNode.id)

                return (
                  <path
                    key={index}
                    d={path}
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className={`flowchart__connection ${isConnectionComplete ? 'completed' : ''}`}
                  />
                )
              })}

              {/* Nodos */}
              {selectedFlowchart.nodes.map((node) => {
                const layoutNode = flowchartLayout.nodes.get(node.id) || node
                const labelLines = wrapSvgLabel(node.label)
                const completed = isStepCompleted(node.id)

                return (
                <g
                  key={node.id}
                  className={`flowchart__node-group ${selectedNode?.id === node.id ? 'selected' : ''} ${completed ? 'completed' : ''}`}
                  transform={`translate(${layoutNode.x}, ${layoutNode.y})`}
                  onClick={() => handleNodeClick(node)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Sombra del nodo */}
                  <rect
                    x="4"
                    y="5"
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="10"
                    className="flowchart__node-shadow"
                  />
                  
                  {/* Nodo principal */}
                  <rect
                    x="0"
                    y="0"
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="10"
                    fill={getNodeColor(node)}
                    stroke={selectedNode?.id === node.id ? '#FFD166' : 'rgba(255, 255, 255, 0.22)'}
                    strokeWidth={selectedNode?.id === node.id ? '3' : '1.2'}
                    className="flowchart__node"
                  />
                  
                  {/* Gradiente interno */}
                  <rect
                    x="0"
                    y="0"
                    width={NODE_WIDTH}
                    height="34"
                    rx="10"
                    fill="url(#nodeGradient)"
                    className="flowchart__node-highlight"
                    style={{ pointerEvents: 'none' }}
                  />

                  <circle
                    cx="20"
                    cy="20"
                    r="8"
                    fill="rgba(255, 255, 255, 0.92)"
                    className="flowchart__type-dot"
                  />
                  
                  <text
                    x="38"
                    y={labelLines.length === 1 ? 43 : 35}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                    className="flowchart__node-text"
                    style={{ pointerEvents: 'none' }}
                  >
                    {labelLines.map((line, lineIndex) => (
                      <tspan
                        key={line}
                        x={NODE_WIDTH / 2 + 8}
                        dy={lineIndex === 0 ? 0 : 15}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>

                  {/* Indicador de completado */}
                  <circle
                    cx={NODE_WIDTH - 17}
                    cy="16"
                    r="9"
                    fill={completed ? '#2ECC71' : 'rgba(255, 255, 255, 0.24)'}
                    stroke="white"
                    strokeWidth="1.6"
                    className="completion-indicator"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStepCompletion(node.id)
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  
                  {completed && (
                    <text
                      x={NODE_WIDTH - 17}
                      y="16"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      ✓
                    </text>
                  )}

                  {/* Indicador de herramienta interna */}
                  {node.internal_tool && (
                    <>
                      <circle
                        cx={NODE_WIDTH - 17}
                        cy={NODE_HEIGHT - 15}
                        r="9"
                        fill="#E67E22"
                        stroke="white"
                        strokeWidth="1.6"
                      />
                      <text
                        x={NODE_WIDTH - 17}
                        y={NODE_HEIGHT - 15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="8"
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        🔧
                      </text>
                    </>
                  )}
                </g>
                )
              })}
            </g>
          </svg>
        </div>

        {/* Panel de información del nodo seleccionado */}
        {selectedNode && (
          <div className="node-info-panel">
            <div className="node-info__header">
              <h3>{selectedNode.label}</h3>
              <button 
                onClick={() => setSelectedNode(null)}
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="node-info__content">
              <p>{selectedNode.description}</p>
              
              {selectedNode.example && (
                <div className="node-info__example">
                  <strong>Ejemplo:</strong> {selectedNode.example}
                </div>
              )}

              {selectedNode.tools && (
                <div className="node-info__tools">
                  <strong>Herramientas sugeridas:</strong>
                  <ul>
                    {selectedNode.tools.map((tool, index) => (
                      <li key={index}>{tool}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedNode.internal_tool && (
                <div className="node-info__internal">
                  <Link 
                    to={selectedNode.internal_tool}
                    target="_blank"
                    className="internal-tool-link"
                  >
                    <ExternalLink size={16} />
                    Usar herramienta integrada
                  </Link>
                </div>
              )}

              <div className="node-info__actions">
                <button
                  onClick={() => toggleStepCompletion(selectedNode.id)}
                  className={`completion-button ${isStepCompleted(selectedNode.id) ? 'completed' : ''}`}
                >
                  {isStepCompleted(selectedNode.id) ? (
                    <>
                      <CheckCircle size={16} />
                      Marcar como pendiente
                    </>
                  ) : (
                    <>
                      <Circle size={16} />
                      Marcar como completado
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OSINTFlowcharts
