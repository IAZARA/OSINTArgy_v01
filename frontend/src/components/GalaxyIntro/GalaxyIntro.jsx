import React, { useEffect, useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import './GalaxyIntro.css'

export const GALAXY_INTRO_DURATION = 5000

const easeOut = value => 1 - Math.pow(1 - Math.min(1, Math.max(0, value)), 3)

// A seeded sky keeps the composition stable through resize and StrictMode mounts.
function createSky(count) {
  let seed = 7219
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  return Array.from({ length: count }, (_, index) => {
    const radius = 0.045 + Math.pow(random(), 0.66) * 0.94
    return {
      radius,
      angle: index % 3 * Math.PI * 2 / 3 + radius * 5.1 + (random() - 0.5) * (0.32 + radius * 0.38),
      lift: (random() - 0.5) * 0.065,
      size: 0.35 + Math.pow(random(), 3) * 1.7,
      brightness: 0.2 + random() * 0.8,
      phase: random() * Math.PI * 2,
      backgroundX: random(), backgroundY: random(),
      warm: random() > 0.84,
    }
  })
}

function paintGalaxy(canvas, elapsed, sky, reducedMotion) {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return
  const { width, height } = canvas.getBoundingClientRect()
  if (!width || !height) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#030a12'
  ctx.fillRect(0, 0, width, height)

  const time = reducedMotion ? 2.6 : elapsed / 1000
  const settled = reducedMotion ? 1 : easeOut(time / 1.75)
  const cx = width * 0.5
  const cy = height * 0.455
  const compact = width < 640
  const radius = compact ? Math.min(width * 0.81, height * 0.47) : Math.min(width * 0.49, height * 0.73)
  const zoom = 1.12 - settled * 0.12 + (reducedMotion ? 0 : time * 0.012)

  const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.4)
  haze.addColorStop(0, '#113546')
  haze.addColorStop(0.28, '#092332')
  haze.addColorStop(0.64, '#06121f')
  haze.addColorStop(1, '#030a12')
  ctx.fillStyle = haze
  ctx.fillRect(0, 0, width, height)

  // Distant stars stay quiet while the foreground galaxy slowly resolves.
  ctx.globalCompositeOperation = 'lighter'
  for (let index = 0; index < 180; index++) {
    const star = sky[index]
    const shimmer = reducedMotion ? 0.75 : 0.6 + Math.sin(time * 0.65 + star.phase) * 0.16
    ctx.fillStyle = `rgba(177,212,228,${star.brightness * shimmer * 0.5})`
    ctx.beginPath()
    ctx.arc(star.backgroundX * width, star.backgroundY * height, star.size * 0.55, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.27)
  ctx.scale(1, compact ? 0.72 : 0.54)
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 0.85)
  glow.addColorStop(0, 'rgba(198,230,224,0.17)')
  glow.addColorStop(0.16, 'rgba(100,197,218,0.13)')
  glow.addColorStop(0.6, 'rgba(28,112,158,0.035)')
  glow.addColorStop(1, 'rgba(4,12,20,0)')
  ctx.fillStyle = glow
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2)
  const rotation = time * 0.072
  for (const star of sky) {
    const spread = 1 + (1 - settled) * star.radius * 0.4
    const distance = star.radius * radius * zoom * spread
    const angle = star.angle + rotation + (1 - settled) * 0.36
    const x = Math.cos(angle) * distance
    const y = Math.sin(angle) * distance + star.lift * radius
    const twinkle = reducedMotion ? 0.9 : 0.82 + Math.sin(time * 0.8 + star.phase) * 0.15
    const opacity = star.brightness * twinkle * (0.5 + settled * 0.5)
    ctx.fillStyle = star.warm
      ? `rgba(224,208,166,${opacity * 0.72})`
      : `rgba(${Math.round(114 + (1 - star.radius) * 114)},${Math.round(180 + (1 - star.radius) * 66)},255,${opacity})`
    ctx.beginPath()
    ctx.ellipse(x, y, star.size, star.size * 1.45, 0, 0, Math.PI * 2)
    ctx.fill()
    if (star.size > 1.75) {
      ctx.fillStyle = `rgba(115,205,248,${opacity * 0.055})`
      ctx.beginPath()
      ctx.arc(x, y, star.size * 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  // A handful of connected signals hints at the OSINT explorer, not a loading meter.
  const nodes = [
    [-0.69, -0.2], [-0.44, -0.39], [0.12, -0.46], [0.65, -0.24],
    [0.74, 0.18], [0.38, 0.45], [-0.23, 0.43], [-0.7, 0.2],
  ].map(([x, y]) => ({ x: cx + x * radius, y: cy + y * radius * (compact ? 1 : 0.88) }))
  const reveal = reducedMotion ? 1 : easeOut((time - 1) / 1.3)
  ctx.strokeStyle = `rgba(121,204,231,${reveal * 0.15})`
  ctx.lineWidth = 0.65
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    const next = nodes[(index + 1) % nodes.length]
    ctx.beginPath()
    ctx.moveTo(node.x, node.y)
    ctx.lineTo(node.x + (next.x - node.x) * reveal, node.y + (next.y - node.y) * reveal)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(node.x, node.y, 4.5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = `rgba(174,236,245,${reveal * 0.85})`
    ctx.beginPath()
    ctx.arc(node.x, node.y, 1.65, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'

  // Darken the letterforms' backdrop without hiding the outer spiral arms.
  const shade = ctx.createRadialGradient(cx, cy, radius * 0.06, cx, cy, radius * 0.58)
  shade.addColorStop(0, 'rgba(3,10,18,0.72)')
  shade.addColorStop(0.6, 'rgba(3,10,18,0.42)')
  shade.addColorStop(1, 'rgba(3,10,18,0)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, width, height)
}

export default function GalaxyIntro({ onComplete }) {
  const canvasRef = useRef(null)
  const skipRef = useRef(null)
  const completedRef = useRef(false)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

  const finish = () => {
    if (completedRef.current) return
    completedRef.current = true
    completeRef.current()
  }

  useEffect(() => {
    completedRef.current = false
    const canvas = canvasRef.current
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sky = createSky(window.innerWidth < 640 ? 1000 : 1900)
    const start = performance.now()
    let frame = 0
    let lastPaint = -Infinity
    const draw = now => {
      const elapsed = now - start
      if (elapsed >= GALAXY_INTRO_DURATION) { finish(); return }
      if (now - lastPaint >= 1000 / 40) {
        paintGalaxy(canvas, elapsed, sky, preference.matches)
        lastPaint = now
      }
      if (!preference.matches) frame = requestAnimationFrame(draw)
    }
    const redraw = () => {
      cancelAnimationFrame(frame)
      paintGalaxy(canvas, performance.now() - start, sky, preference.matches)
      if (!preference.matches) frame = requestAnimationFrame(draw)
    }
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); finish() }
      if (event.key === 'Tab') { event.preventDefault(); skipRef.current?.focus({ preventScroll: true }) }
    }
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    skipRef.current?.focus({ preventScroll: true })
    paintGalaxy(canvas, 0, sky, preference.matches)
    if (!preference.matches) frame = requestAnimationFrame(draw)
    const timer = window.setTimeout(finish, GALAXY_INTRO_DURATION)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', redraw)
    preference.addEventListener('change', redraw)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', redraw)
      preference.removeEventListener('change', redraw)
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  return <section className="galaxy-intro" role="dialog" aria-modal="true" aria-labelledby="galaxy-intro-title" aria-describedby="galaxy-intro-description">
    <canvas ref={canvasRef} className="galaxy-intro__sky" aria-hidden="true" />
    <div className="galaxy-intro__vignette" aria-hidden="true" />
    <header className="galaxy-intro__header"><span><i /> INTELIGENCIA DE FUENTES ABIERTAS</span><button ref={skipRef} type="button" className="galaxy-intro__skip" onClick={finish}>Saltar intro <ArrowUpRight size={16} /></button></header>
    <div className="galaxy-intro__identity">
      <svg className="galaxy-intro__orbit" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <circle cx="50" cy="50" r="34" stroke="currentColor" strokeOpacity=".22" strokeWidth=".75" />
        <ellipse cx="50" cy="50" rx="44" ry="15" transform="rotate(-32 50 50)" stroke="currentColor" strokeWidth=".9" />
        <ellipse cx="50" cy="50" rx="15" ry="34" transform="rotate(20 50 50)" stroke="currentColor" strokeOpacity=".5" strokeWidth=".75" />
        <path d="M13 50Q50 16 87 50Q50 84 13 50Z" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="50" cy="50" r="6" fill="currentColor" fillOpacity=".13" stroke="currentColor" />
        <circle cx="50" cy="50" r="2" fill="currentColor" />
        <circle cx="79" cy="27" r="3" fill="#e7cf9b" />
      </svg>
      <p className="galaxy-intro__eyebrow">UN UNIVERSO DE CONEXIONES</p>
      <h1 id="galaxy-intro-title"><span>OSINT</span><span>Argy</span></h1>
      <p id="galaxy-intro-description" className="galaxy-intro__tagline">Cada fuente, una nueva conexión.</p>
      <div className="galaxy-intro__rule" aria-hidden="true"><span /><i /><span /></div>
    </div>
    <footer className="galaxy-intro__footer"><span>ARGENTINA <i /> LATAM <i /> EL MUNDO</span><span className="galaxy-intro__entering">EXPLORAR. CONECTAR. COMPRENDER.</span></footer>
    <div className="galaxy-intro__timeline" aria-hidden="true"><span /></div>
  </section>
}
