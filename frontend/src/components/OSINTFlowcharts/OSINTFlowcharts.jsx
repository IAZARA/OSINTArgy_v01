import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  AtSign,
  CheckCircle,
  Circle,
  Download,
  ExternalLink,
  GitBranch,
  Globe2,
  LocateFixed,
  Mail,
  MapPin,
  Maximize2,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  User,
  Wrench,
  X
} from 'lucide-react'
import { Link } from '@/lib/router'
import toast from 'react-hot-toast'
import { getFlowchartsInfo, getFlowchartById } from '@/data/flowcharts'
import { getAllTools } from '@/data/tools/index.js'
import './OSINTFlowcharts.css'

const NODE_WIDTH = 188
const NODE_HEIGHT = 76
const NODE_GAP_X = 96
const NODE_GAP_Y = 38
const NODE_MARGIN = 84
const DEFAULT_VIEW = { x: 0, y: 0, zoom: 1 }

const getInitialView = () => (
  window.matchMedia?.('(max-width: 560px)').matches
    ? { x: -36, y: 0, zoom: 1.45 }
    : DEFAULT_VIEW
)

const FLOW_ICONS = {
  domain: Globe2,
  email: Mail,
  location: MapPin,
  realname: User,
  telephone: Phone,
  username: AtSign
}

const NODE_TYPES = {
  start: { label: 'Punto de partida', color: '#e7685d' },
  process: { label: 'Acción', color: '#4f91d8' },
  data: { label: 'Dato obtenido', color: '#d8953f' },
  result: { label: 'Resultado', color: '#45a878' }
}

const TOOL_ALIASES = {
  hibp: 'have i been pwned',
  'osintargy dork generator': 'generador de dorks',
  'osintargy email osint': 'osint de emails',
  'twitter advanced search': 'twitter advanced search',
  'twitter search': 'twitter'
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const normalizeToolName = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s*\([^)]*\)\s*$/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const wrapSvgLabel = (label, maxChars = 21) => {
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
  if (!flowchart) return { width: 1200, height: 720, nodes: new Map() }

  const nodeById = new Map(flowchart.nodes.map((node) => [node.id, node]))
  const outgoing = new Map(flowchart.nodes.map((node) => [node.id, []]))
  const incoming = new Map(flowchart.nodes.map((node) => [node.id, []]))

  flowchart.connections.forEach((connection) => {
    if (!nodeById.has(connection.from) || !nodeById.has(connection.to)) return
    outgoing.get(connection.from).push(connection.to)
    incoming.get(connection.to).push(connection.from)
  })

  const roots = flowchart.nodes.filter((node) => node.type === 'start' || incoming.get(node.id).length === 0)
  const queue = roots.length ? roots.map((node) => node.id) : [flowchart.nodes[0]?.id].filter(Boolean)
  const depthById = new Map(queue.map((nodeId) => [nodeId, 0]))

  while (queue.length) {
    const nodeId = queue.shift()
    const currentDepth = depthById.get(nodeId) || 0

    outgoing.get(nodeId).forEach((targetId) => {
      const nextDepth = currentDepth + 1
      if ((!depthById.has(targetId) || nextDepth > depthById.get(targetId)) && nextDepth < flowchart.nodes.length) {
        depthById.set(targetId, nextDepth)
        queue.push(targetId)
      }
    })
  }

  flowchart.nodes.forEach((node) => {
    if (!depthById.has(node.id)) depthById.set(node.id, Math.max(0, Math.round((node.x || 0) / 240)))
  })

  const columns = new Map()
  flowchart.nodes.forEach((node) => {
    const depth = depthById.get(node.id)
    if (!columns.has(depth)) columns.set(depth, [])
    columns.get(depth).push(node)
  })

  const sortedDepths = [...columns.keys()].sort((a, b) => a - b)
  const maxColumnHeight = Math.max(...sortedDepths.map((depth) => {
    const column = columns.get(depth)
    return column.length * NODE_HEIGHT + Math.max(0, column.length - 1) * NODE_GAP_Y
  }), 0)
  const height = Math.max(680, maxColumnHeight + NODE_MARGIN * 2)
  const maxDepth = sortedDepths.at(-1) || 0
  const width = Math.max(980, NODE_MARGIN * 2 + (maxDepth + 1) * NODE_WIDTH + maxDepth * NODE_GAP_X)
  const layoutNodes = new Map()

  sortedDepths.forEach((depth) => {
    const column = [...columns.get(depth)].sort((a, b) => (a.y || 0) - (b.y || 0))
    const columnHeight = column.length * NODE_HEIGHT + Math.max(0, column.length - 1) * NODE_GAP_Y
    const startY = Math.max(NODE_MARGIN, (height - columnHeight) / 2)
    const x = NODE_MARGIN + depth * (NODE_WIDTH + NODE_GAP_X)

    column.forEach((node, index) => {
      layoutNodes.set(node.id, { ...node, x, y: startY + index * (NODE_HEIGHT + NODE_GAP_Y), depth })
    })
  })

  return { width, height, nodes: layoutNodes }
}

const countFlowTools = (flowchart) => new Set(
  flowchart.nodes.flatMap((node) => node.tools || [])
).size

const ToolLink = ({ toolName, tool }) => {
  if (!tool) return <span className="node-tool node-tool--unlinked">{toolName}</span>

  const content = (
    <>
      <span>{tool.name}</span>
      <ExternalLink size={14} aria-hidden="true" />
    </>
  )

  if (tool.url.startsWith('/')) {
    return <Link className="node-tool" to={tool.url}>{content}</Link>
  }

  return (
    <a className="node-tool" href={tool.url} target="_blank" rel="noreferrer">
      {content}
    </a>
  )
}

const OSINTFlowcharts = () => {
  const [selectedFlowchart, setSelectedFlowchart] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const savedProgress = JSON.parse(localStorage.getItem('osint-flowcharts-progress') || '[]')
      return new Set(Array.isArray(savedProgress) ? savedProgress : [])
    } catch (error) {
      console.error('No se pudo cargar el progreso de los flujos:', error)
      return new Set()
    }
  })
  const [selectedNode, setSelectedNode] = useState(null)
  const [viewState, setViewState] = useState(DEFAULT_VIEW)

  const svgRef = useRef(null)
  const viewportRef = useRef(null)
  const pointerRef = useRef(null)
  const viewRef = useRef(DEFAULT_VIEW)

  const flowchartsInfo = getFlowchartsInfo()
  const toolCatalog = useMemo(() => getAllTools().tools, [])
  const toolIndex = useMemo(() => {
    const index = new Map()
    toolCatalog.forEach((tool) => index.set(normalizeToolName(tool.name), tool))
    return index
  }, [toolCatalog])
  const flowchartLayout = useMemo(() => getFlowchartLayout(selectedFlowchart), [selectedFlowchart])

  useEffect(() => {
    localStorage.setItem('osint-flowcharts-progress', JSON.stringify([...completedSteps]))
  }, [completedSteps])

  const applyView = (next, commit = false) => {
    const safeView = {
      x: Number.isFinite(next.x) ? next.x : 0,
      y: Number.isFinite(next.y) ? next.y : 0,
      zoom: clamp(Number.isFinite(next.zoom) ? next.zoom : 1, 0.55, 2.6)
    }
    viewRef.current = safeView
    viewportRef.current?.setAttribute('transform', `translate(${safeView.x}, ${safeView.y}) scale(${safeView.zoom})`)
    if (commit) setViewState(safeView)
  }

  useEffect(() => {
    applyView(getInitialView(), true)
  }, [selectedFlowchart])

  const resolveTool = (toolName) => {
    const normalized = normalizeToolName(toolName)
    const aliased = TOOL_ALIASES[normalized] || normalized
    if (toolIndex.has(aliased)) return toolIndex.get(aliased)

    if (aliased.length < 5) return null
    return toolCatalog.find((tool) => {
      const candidate = normalizeToolName(tool.name)
      return candidate.startsWith(`${aliased} `) || aliased.startsWith(`${candidate} `)
    }) || null
  }

  const isStepCompleted = (flowchartId, nodeId) => completedSteps.has(`${flowchartId}-${nodeId}`)

  const getCompletedCount = (flowchart) => flowchart.nodes.filter((node) => (
    isStepCompleted(flowchart.id, node.id)
  )).length

  const handleFlowchartSelect = (flowchartId) => {
    const flowchart = getFlowchartById(flowchartId)
    if (!flowchart) {
      toast.error('No se pudo abrir este flujo')
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
    setSelectedFlowchart(flowchart)
    setSelectedNode(null)
  }

  const handleBackToSelection = () => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    setSelectedFlowchart(null)
    setSelectedNode(null)
  }

  const toggleStepCompletion = (nodeId) => {
    if (!selectedFlowchart) return
    const stepKey = `${selectedFlowchart.id}-${nodeId}`
    const wasCompleted = completedSteps.has(stepKey)
    setCompletedSteps((current) => {
      const next = new Set(current)
      if (next.has(stepKey)) {
        next.delete(stepKey)
      } else {
        next.add(stepKey)
      }
      return next
    })
    toast.success(wasCompleted ? 'Paso marcado como pendiente' : 'Paso completado')
  }

  const changeZoom = (delta) => {
    applyView({ ...viewRef.current, zoom: viewRef.current.zoom + delta }, true)
  }

  const resetView = () => applyView(getInitialView(), true)

  const handlePointerDown = (event) => {
    if (event.button !== 0 || event.target.closest?.('.flowchart__node-group')) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    pointerRef.current = {
      id: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      unitX: flowchartLayout.width / rect.width,
      unitY: flowchartLayout.height / rect.height
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.classList.add('is-panning')
  }

  const handlePointerMove = (event) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    const deltaX = (event.clientX - pointer.clientX) * pointer.unitX
    const deltaY = (event.clientY - pointer.clientY) * pointer.unitY
    pointer.clientX = event.clientX
    pointer.clientY = event.clientY
    applyView({ ...viewRef.current, x: viewRef.current.x + deltaX, y: viewRef.current.y + deltaY })
  }

  const handlePointerUp = (event) => {
    if (!pointerRef.current) return
    pointerRef.current = null
    event.currentTarget.classList.remove('is-panning')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setViewState(viewRef.current)
  }

  const downloadFlowchart = () => {
    if (!selectedFlowchart || !svgRef.current) return
    const exportSvg = svgRef.current.cloneNode(true)
    exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    exportSvg.querySelector('.flowchart__viewport')?.setAttribute('transform', 'translate(0, 0) scale(1)')
    const svgData = new XMLSerializer().serializeToString(exportSvg)
    const svgUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }))
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `osintargy-${selectedFlowchart.id}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
    URL.revokeObjectURL(svgUrl)
    toast.success('Flujo descargado en SVG')
  }

  if (!selectedFlowchart) {
    return (
      <div className="osint-flowcharts">
        <main className="flowcharts__container flowcharts__landing">
          <header className="flowcharts__hero">
            <div className="flowcharts__hero-mark" aria-hidden="true"><GitBranch size={26} /></div>
            <div>
              <p className="flowcharts__kicker">Guías de investigación</p>
              <h1>Flujos OSINT</h1>
              <p>Elegí un punto de partida, documentá cada hallazgo y abrí las herramientas necesarias sin perder el contexto.</p>
            </div>
            <div className="flowcharts__hero-stats" aria-label="Resumen de los flujos">
              <span><strong>{flowchartsInfo.length}</strong> recorridos</span>
              <span><strong>{flowchartsInfo.reduce((sum, flow) => sum + getFlowchartById(flow.id).nodes.length, 0)}</strong> pasos</span>
              <span><strong>{toolCatalog.length}</strong> herramientas</span>
            </div>
          </header>

          <section className="flowcharts__grid" aria-label="Flujos disponibles">
            {flowchartsInfo.map((flowchart) => {
              const fullFlowchart = getFlowchartById(flowchart.id)
              const completed = getCompletedCount(fullFlowchart)
              const FlowIcon = FLOW_ICONS[flowchart.id] || LocateFixed
              return (
                <button
                  key={flowchart.id}
                  className="flowchart-card"
                  onClick={() => handleFlowchartSelect(flowchart.id)}
                  style={{ '--flow-accent': flowchart.color }}
                >
                  <span className="flowchart-card__icon"><FlowIcon size={23} /></span>
                  <span className="flowchart-card__body">
                    <span className="flowchart-card__title">{flowchart.title}</span>
                    <span className="flowchart-card__description">{flowchart.description}</span>
                  </span>
                  <span className="flowchart-card__meta">
                    <span>{fullFlowchart.nodes.length} pasos</span>
                    <span>{countFlowTools(fullFlowchart)} recursos</span>
                    {completed > 0 && <span className="flowchart-card__progress">{completed} completados</span>}
                  </span>
                  <span className="flowchart-card__action">Abrir flujo <ArrowLeft size={15} /></span>
                </button>
              )
            })}
          </section>

          <aside className="flowcharts__method">
            <ShieldCheck size={22} aria-hidden="true" />
            <div>
              <h2>Una guía, no una conclusión</h2>
              <p>Corroborá cada dato con fuentes independientes, registrá fecha y origen, y respetá la legislación aplicable.</p>
            </div>
            <ol>
              <li>Seleccioná un nodo</li>
              <li>Abrí una fuente</li>
              <li>Validá el hallazgo</li>
              <li>Marcá el avance</li>
            </ol>
          </aside>
        </main>
      </div>
    )
  }

  const completedCount = getCompletedCount(selectedFlowchart)
  const completionPercentage = Math.round((completedCount / selectedFlowchart.nodes.length) * 100)
  const SelectedFlowIcon = FLOW_ICONS[selectedFlowchart.id] || LocateFixed

  return (
    <div className="osint-flowcharts">
      <main className="flowcharts__container flowchart-workspace">
        <header className="flowchart-toolbar">
          <button onClick={handleBackToSelection} className="flowchart-toolbar__back">
            <ArrowLeft size={18} /> Todos los flujos
          </button>

          <div className="flowchart-toolbar__identity">
            <span className="flowchart-toolbar__icon"><SelectedFlowIcon size={21} /></span>
            <div>
              <h1>{selectedFlowchart.title}</h1>
              <p>{selectedFlowchart.description}</p>
            </div>
          </div>

          <div className="flowchart-toolbar__status" aria-label={`${completionPercentage}% completado`}>
            <strong>{completedCount}/{selectedFlowchart.nodes.length}</strong>
            <span>pasos completados</span>
          </div>

          <div className="flowchart-toolbar__controls" aria-label="Controles del diagrama">
            <button onClick={() => changeZoom(-0.15)} aria-label="Alejar" title="Alejar"><Minus size={17} /></button>
            <span>{Math.round(viewState.zoom * 100)}%</span>
            <button onClick={() => changeZoom(0.15)} aria-label="Acercar" title="Acercar"><Plus size={17} /></button>
            <button onClick={resetView} aria-label="Restablecer vista" title="Restablecer vista"><RotateCcw size={17} /></button>
            <button onClick={downloadFlowchart} aria-label="Descargar SVG" title="Descargar SVG"><Download size={17} /></button>
          </div>
        </header>

        <div className={`flowchart-stage ${selectedNode ? 'flowchart-stage--with-panel' : ''}`}>
          <section className="flowchart-canvas" aria-label={`Diagrama de ${selectedFlowchart.title}`}>
            <div className="flowchart-legend" aria-label="Leyenda">
              {Object.entries(NODE_TYPES).map(([type, value]) => (
                <span key={type}><i style={{ '--legend-color': value.color }} />{value.label}</span>
              ))}
            </div>
            <div className="flowchart-hint"><Maximize2 size={14} /> Arrastrá el fondo para desplazarte</div>

            <svg
              ref={svgRef}
              className="flowchart__svg"
              viewBox={`0 0 ${flowchartLayout.width} ${flowchartLayout.height}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <defs>
                <pattern id="flowchart-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(151, 181, 204, 0.065)" strokeWidth="1" />
                </pattern>
                <marker id="arrowhead" markerWidth="12" markerHeight="9" refX="10" refY="4.5" orient="auto">
                  <polygon points="0 0, 12 4.5, 0 9" fill="#7899b4" />
                </marker>
                <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.025)" />
                </linearGradient>
              </defs>

              <rect className="flowchart__pan-surface" width={flowchartLayout.width} height={flowchartLayout.height} fill="url(#flowchart-grid)" />

              <g ref={viewportRef} className="flowchart__viewport" transform="translate(0, 0) scale(1)">
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
                  const complete = isStepCompleted(selectedFlowchart.id, fromNode.id) && isStepCompleted(selectedFlowchart.id, toNode.id)

                  return <path key={`${connection.from}-${connection.to}-${index}`} d={path} markerEnd="url(#arrowhead)" className={`flowchart__connection ${complete ? 'completed' : ''}`} />
                })}

                {selectedFlowchart.nodes.map((node) => {
                  const layoutNode = flowchartLayout.nodes.get(node.id) || node
                  const labelLines = wrapSvgLabel(node.label)
                  const completed = isStepCompleted(selectedFlowchart.id, node.id)
                  const selected = selectedNode?.id === node.id
                  const typeColor = NODE_TYPES[node.type]?.color || '#78909c'

                  return (
                    <g
                      key={node.id}
                      className={`flowchart__node-group ${selected ? 'selected' : ''} ${completed ? 'completed' : ''}`}
                      transform={`translate(${layoutNode.x}, ${layoutNode.y})`}
                      onClick={() => setSelectedNode(node)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedNode(node)
                        }
                      }}
                      role="button"
                      tabIndex="0"
                      aria-label={`${node.label}. ${node.description}`}
                    >
                      <rect x="4" y="6" width={NODE_WIDTH} height={NODE_HEIGHT} rx="12" className="flowchart__node-shadow" />
                      <rect
                        width={NODE_WIDTH}
                        height={NODE_HEIGHT}
                        rx="12"
                        fill={typeColor}
                        stroke={selected ? '#f4c76b' : 'rgba(255, 255, 255, 0.24)'}
                        strokeWidth={selected ? '3' : '1.25'}
                        className="flowchart__node"
                      />
                      <rect width={NODE_WIDTH} height="35" rx="12" fill="url(#nodeGradient)" className="flowchart__node-highlight" />
                      <circle cx="18" cy="18" r="5" fill="rgba(255, 255, 255, 0.88)" />
                      <text x={NODE_WIDTH / 2} y={labelLines.length === 1 ? 42 : 35} textAnchor="middle" fill="white" fontSize="12.5" fontWeight="650" className="flowchart__node-text">
                        {labelLines.map((line, lineIndex) => (
                          <tspan key={`${line}-${lineIndex}`} x={NODE_WIDTH / 2} dy={lineIndex === 0 ? 0 : 16}>{line}</tspan>
                        ))}
                      </text>
                      <g
                        className="flowchart__completion"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleStepCompletion(node.id)
                        }}
                        role="button"
                        aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                      >
                        <circle cx={NODE_WIDTH - 17} cy="17" r="10" fill={completed ? '#236f50' : 'rgba(13, 28, 40, 0.38)'} stroke="rgba(255,255,255,.82)" strokeWidth="1.4" />
                        {completed && <path d={`M ${NODE_WIDTH - 21} 17 l3 3 6 -7`} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                      </g>
                      {node.internal_tool && <Wrench x={NODE_WIDTH - 27} y={NODE_HEIGHT - 27} width="16" height="16" color="white" aria-hidden="true" />}
                    </g>
                  )
                })}
              </g>
            </svg>
          </section>

          {selectedNode && (
            <aside className="node-panel" aria-label={`Detalle de ${selectedNode.label}`}>
              <header className="node-panel__header">
                <div>
                  <span>{NODE_TYPES[selectedNode.type]?.label || 'Paso'}</span>
                  <h2>{selectedNode.label}</h2>
                </div>
                <button onClick={() => setSelectedNode(null)} aria-label="Cerrar detalle"><X size={18} /></button>
              </header>

              <div className="node-panel__content">
                <p>{selectedNode.description}</p>

                {selectedNode.example && (
                  <div className="node-panel__example">
                    <strong>Ejemplo</strong>
                    <code>{selectedNode.example}</code>
                  </div>
                )}

                {selectedNode.tools?.length > 0 && (
                  <section className="node-panel__tools">
                    <h3><Search size={16} /> Fuentes sugeridas</h3>
                    <div className="node-panel__tool-list">
                      {selectedNode.tools.map((toolName) => (
                        <ToolLink key={toolName} toolName={toolName} tool={resolveTool(toolName)} />
                      ))}
                    </div>
                  </section>
                )}

                {selectedNode.internal_tool && (
                  <Link to={selectedNode.internal_tool} className="node-panel__primary-action">
                    <Wrench size={17} /> Abrir herramienta integrada
                  </Link>
                )}

                <button
                  onClick={() => toggleStepCompletion(selectedNode.id)}
                  className={`node-panel__completion ${isStepCompleted(selectedFlowchart.id, selectedNode.id) ? 'is-complete' : ''}`}
                >
                  {isStepCompleted(selectedFlowchart.id, selectedNode.id) ? <CheckCircle size={18} /> : <Circle size={18} />}
                  {isStepCompleted(selectedFlowchart.id, selectedNode.id) ? 'Paso completado' : 'Marcar como completado'}
                </button>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}

export default OSINTFlowcharts
