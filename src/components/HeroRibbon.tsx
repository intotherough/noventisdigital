import { useEffect, useRef } from 'react'

export function HeroRibbon() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    let rafId = 0

    const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.targetX = e.clientX / window.innerWidth
      pointer.targetY = e.clientY / window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)

    const STRANDS = 44
    const SEGMENTS = 180
    const BASE_AMP = 70
    const THICKNESS = 150
    const FREQ_1 = 0.0042
    const FREQ_2 = 0.0019

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height)
      drawFrame(0, true)
    }

    const drawFrame = (tMs: number, fullClear = false) => {
      const t = tMs * 0.001

      if (fullClear) {
        ctx.clearRect(0, 0, width, height)
      } else {
        ctx.fillStyle = 'rgba(10, 10, 13, 0.22)'
        ctx.fillRect(0, 0, width, height)
      }

      pointer.x += (pointer.targetX - pointer.x) * 0.04
      pointer.y += (pointer.targetY - pointer.y) * 0.04

      const centerY = height * (0.5 + (pointer.y - 0.5) * 0.16)
      const mouseInfluence = (pointer.x - 0.5) * 40

      for (let s = 0; s < STRANDS; s++) {
        const strandRatio = s / (STRANDS - 1)
        const strandOffset = (strandRatio - 0.5) * THICKNESS
        const phase = strandRatio * 0.9

        const edgeFalloff = 1 - Math.pow(Math.abs(strandRatio - 0.5) * 2, 1.6)
        const alpha = 0.04 + edgeFalloff * 0.18

        const warmth = Math.pow(edgeFalloff, 2)
        const r = Math.round(241 - warmth * 45)
        const g = Math.round(236 - warmth * 72)
        const b = Math.round(227 - warmth * 122)

        ctx.beginPath()
        ctx.lineWidth = 1
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

        for (let i = 0; i <= SEGMENTS; i++) {
          const u = i / SEGMENTS
          const x = u * width
          const wave1 = Math.sin(x * FREQ_1 + t * 0.9 + phase * 2) * BASE_AMP
          const wave2 = Math.sin(x * FREQ_2 - t * 0.6 + phase * 3.2) * (BASE_AMP * 0.5)
          const bow = Math.sin(u * Math.PI) * 30
          const y =
            centerY +
            strandOffset +
            wave1 +
            wave2 +
            bow +
            mouseInfluence * Math.sin(u * Math.PI)

          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }

    if (reduceMotion) {
      drawStatic()
    } else {
      const loop = (t: number) => {
        drawFrame(t)
        rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return (
    <div aria-hidden="true" className="hero-ribbon">
      <canvas ref={canvasRef} />
    </div>
  )
}
