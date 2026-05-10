import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export default function InteractiveHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let particles: Particle[] = []

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const createParticles = (count: number) => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.8 + 1.2,
      }))
    }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.offsetWidth
      height = canvas.offsetHeight

      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      const particleCount = Math.max(60, Math.min(140, Math.floor((width * height) / 14000)))
      createParticles(particleCount)
    }

    const drawBackgroundGlow = () => {
      const gradientA = ctx.createRadialGradient(width * 0.25, height * 0.28, 0, width * 0.25, height * 0.28, width * 0.45)
      gradientA.addColorStop(0, 'rgba(56, 189, 248, 0.12)')
      gradientA.addColorStop(1, 'rgba(56, 189, 248, 0)')

      const gradientB = ctx.createRadialGradient(width * 0.72, height * 0.35, 0, width * 0.72, height * 0.35, width * 0.38)
      gradientB.addColorStop(0, 'rgba(168, 85, 247, 0.10)')
      gradientB.addColorStop(1, 'rgba(168, 85, 247, 0)')

      const gradientC = ctx.createRadialGradient(width * 0.5, height * 0.78, 0, width * 0.5, height * 0.78, width * 0.35)
      gradientC.addColorStop(0, 'rgba(52, 211, 153, 0.08)')
      gradientC.addColorStop(1, 'rgba(52, 211, 153, 0)')

      ctx.fillStyle = gradientA
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = gradientB
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = gradientC
      ctx.fillRect(0, 0, width, height)
    }

    const drawGrid = () => {
      ctx.save()
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)'
      ctx.lineWidth = 1

      const gap = 42
      for (let x = 0; x < width; x += gap) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      for (let y = 0; y < height; y += gap) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      ctx.restore()
    }

    const updateParticles = () => {
      const mouse = mouseRef.current

      for (const p of particles) {
        if (mouse.active) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const influence = 140

          if (dist < influence && dist > 0.001) {
            const force = (influence - dist) / influence
            p.vx += (dx / dist) * force * 0.008
            p.vy += (dy / dist) * force * 0.008
          }
        }

        p.x += p.vx
        p.y += p.vy

        p.vx *= 0.992
        p.vy *= 0.992

        const speedLimit = 0.65
        p.vx = Math.max(-speedLimit, Math.min(speedLimit, p.vx))
        p.vy = Math.max(-speedLimit, Math.min(speedLimit, p.vy))

        if (p.x < -30) p.x = width + 30
        if (p.x > width + 30) p.x = -30
        if (p.y < -30) p.y = height + 30
        if (p.y > height + 30) p.y = -30
      }
    }

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.22
            ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
    }

    const drawParticles = () => {
      for (const p of particles) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 8)
        glow.addColorStop(0, 'rgba(125, 211, 252, 0.45)')
        glow.addColorStop(1, 'rgba(125, 211, 252, 0)')

        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(224, 242, 254, 0.92)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawFloatingPanels = (time: number) => {
      const t = time * 0.001

      const panels = [
        { x: width * 0.14, y: height * 0.25 + Math.sin(t) * 8, w: 170, h: 64 },
        { x: width * 0.76, y: height * 0.22 + Math.cos(t * 1.1) * 10, w: 190, h: 72 },
        { x: width * 0.68, y: height * 0.68 + Math.sin(t * 0.8) * 9, w: 160, h: 58 },
      ]

      panels.forEach((panel, index) => {
        ctx.save()
        ctx.fillStyle = index === 1
          ? 'rgba(15, 23, 42, 0.22)'
          : 'rgba(15, 23, 42, 0.18)'
        ctx.strokeStyle = index === 1
          ? 'rgba(167, 139, 250, 0.28)'
          : 'rgba(125, 211, 252, 0.18)'
        ctx.lineWidth = 1.2

        const r = 18
        const { x, y, w, h } = panel

        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.strokeStyle = 'rgba(224, 242, 254, 0.16)'
        ctx.beginPath()
        ctx.moveTo(x + 18, y + 20)
        ctx.lineTo(x + w - 18, y + 20)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(x + 18, y + 34)
        ctx.lineTo(x + w * 0.7, y + 34)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(x + 18, y + 48)
        ctx.lineTo(x + w * 0.5, y + 48)
        ctx.stroke()

        ctx.restore()
      })
    }

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height)

      drawBackgroundGlow()
      drawGrid()

      updateParticles()
      drawConnections()
      drawParticles()
      drawFloatingPanels(time)

      if (!prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(render)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = event.clientX - rect.left
      mouseRef.current.y = event.clientY - rect.top
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }

    resize()

    if (prefersReducedMotion) {
      render(0)
    } else {
      animationRef.current = requestAnimationFrame(render)
    }

    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="interactive-hero-canvas" />
}