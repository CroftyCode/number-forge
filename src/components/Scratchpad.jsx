import { useEffect, useRef, useState } from 'react'

const INKS = [
  { code: 'graphite', hex: '#1b1c24', label: 'Pencil' },
  { code: 'ember', hex: '#d94f00', label: 'Red pen' },
  { code: 'quench', hex: '#00806b', label: 'Green pen' }
]

export default function Scratchpad({ open, onToggle }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const strokes = useRef([])
  const current = useRef(null)
  const [ink, setInk] = useState(INKS[0])
  const [width, setWidth] = useState(3)

  const redraw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokes.current) {
      ctx.strokeStyle = s.colour
      ctx.lineWidth = s.width
      ctx.beginPath()
      s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
    }
  }

  const resize = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.getContext('2d').scale(dpr, dpr)
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    redraw()
  }

  useEffect(() => {
    if (!open) return
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [open])

  const pointFrom = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e) => {
    e.preventDefault()
    canvasRef.current.setPointerCapture(e.pointerId)
    drawing.current = true
    // A stylus eraser flips to rubbing out.
    const erasing = e.pointerType === 'pen' && e.buttons === 32
    current.current = {
      colour: erasing ? '#f3f1e4' : ink.hex,
      width: erasing ? 24 : width,
      points: [pointFrom(e)]
    }
    strokes.current.push(current.current)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    current.current.points.push(pointFrom(e))
    redraw()
  }

  const end = () => {
    drawing.current = false
    current.current = null
  }

  const undo = () => { strokes.current.pop(); redraw() }
  const clear = () => { strokes.current = []; redraw() }

  // Real keyboard on a Chromebook, so wire up the shortcut he will reach for.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA'].includes(e.target.tagName)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (typing) return
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div
      className={`flex min-h-0 flex-col ${open ? 'min-h-[42vh] flex-1 lg:min-h-0' : ''}`}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <div className="flex items-baseline gap-3">
          <button
            onClick={onToggle}
            className="font-hud text-[11px] tracking-tight text-chalk/70 hover:text-quench"
          >
            {open ? '▾ Hide workbench' : '▸ Show workbench'}
          </button>
          {open && (
            <span className="hidden font-hud text-[9px] text-chalk/30 lg:inline">
              WORK IT OUT HERE
            </span>
          )}
        </div>

        {open && (
          <div className="flex items-center gap-2">
            {/* Swatches sit on a paper chip so the pencil grey is visible
                against the dark chrome. */}
            <div className="flex items-center gap-1 rounded-sm bg-paper px-1.5 py-1">
              {INKS.map((i) => (
                <button
                  key={i.code}
                  onClick={() => setInk(i)}
                  aria-label={i.label}
                  title={i.label}
                  className="h-5 w-5 rounded-full transition"
                  style={{
                    background: i.hex,
                    outline: ink.code === i.code ? '2px solid #12131c' : 'none',
                    outlineOffset: '2px'
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setWidth(width === 3 ? 7 : 3)}
              className="font-hud text-[10px] text-chalk/60 hover:text-chalk"
            >
              {width === 3 ? 'THIN' : 'THICK'}
            </button>
            <button onClick={undo} className="font-hud text-[10px] text-chalk/60 hover:text-chalk">UNDO</button>
            <button onClick={clear} className="font-hud text-[10px] text-chalk/60 hover:text-fault">CLEAR</button>
          </div>
        )}
      </div>

      {open && (
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="squared-paper pixel-edge w-full flex-1 touch-none rounded-sm"
        />
      )}
    </div>
  )
}
