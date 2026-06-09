import { useRef, useCallback } from 'react'

/**
 * LiquidBlock — non-clickable element with liquid fill inside.
 * Click → liquid sloshes inside the boundary, element stays put.
 *
 * Props:
 *  fillColor   string  CSS color/var for liquid fill  default: var(--liq-white)
 *  fillHeight  number  0–100, % of card filled        default: 40
 *  style       object  outer container styles
 *  className   string  extra classes
 *  children    node    content above the liquid
 *  ripple      bool    add click ripple (default true)
 */
export default function LiquidBlock({
  fillColor = 'var(--liq-white)',
  fillHeight = 40,
  style = {},
  className = '',
  children,
  ripple = true,
}) {
  const fillRef = useRef(null)
  const containerRef = useRef(null)

  const handleClick = useCallback((e) => {
    // Slosh the liquid
    const fill = fillRef.current
    if (fill) {
      fill.classList.remove('sloshing')
      void fill.offsetWidth // reflow to restart animation
      fill.classList.add('sloshing')
      setTimeout(() => fill.classList.remove('sloshing'), 720)
    }

    // Ripple from click point
    if (ripple && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const dot = document.createElement('span')
      dot.className = 'ripple-dot'
      dot.style.left = (e.clientX - rect.left) + 'px'
      dot.style.top  = (e.clientY - rect.top)  + 'px'
      containerRef.current.appendChild(dot)
      setTimeout(() => dot.remove(), 620)
    }
  }, [ripple])

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`glass glass-card ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Liquid fill layer */}
      <div
        ref={fillRef}
        style={{
          position: 'absolute',
          bottom: -4,
          left: '-10%',
          width: '120%',
          height: `${fillHeight + 8}%`,
          background: fillColor,
          borderRadius: '52% 48% 0 0 / 28% 28% 0 0',
          animation: 'breathe 4.5s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'height 1.2s var(--eout)',
        }}
        onAnimationEnd={e => {
          // keep breathing after slosh ends
          if (e.animationName === 'slosh') {
            e.target.style.animation = 'breathe 4.5s ease-in-out infinite'
          }
        }}
      />
      {/* Content above liquid */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

/* Convenience wrappers */
export function LiquidStat({ value, label, color, fillPct, style={} }) {
  const fillVar = {
    'var(--orange)': 'var(--liq-orange)',
    'var(--blue)':   'var(--liq-blue)',
    'var(--pink)':   'var(--liq-pink)',
    'var(--green)':  'var(--liq-green)',
    'var(--gold)':   'var(--liq-gold)',
  }[color] || 'var(--liq-white)'

  return (
    <LiquidBlock fillColor={fillVar} fillHeight={fillPct ?? 35} style={{ padding:'18px 22px', ...style }}>
      <div style={{ fontSize:28, fontWeight:800, color, fontFamily:'var(--mono)', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{label}</div>
    </LiquidBlock>
  )
}

export function LiquidTag({ children, color, style={} }) {
  const fillMap = {
    'var(--orange)': 'var(--liq-orange)',
    'var(--blue)':   'var(--liq-blue)',
    'var(--pink)':   'var(--liq-pink)',
    'var(--green)':  'var(--liq-green)',
  }
  const fillColor = fillMap[color] || 'var(--liq-white)'
  return (
    <LiquidBlock fillColor={fillColor} fillHeight={55}
      style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, color, ...style }}>
      {children}
    </LiquidBlock>
  )
}

export function LiquidBadge({ children, style={} }) {
  return (
    <LiquidBlock fillColor="rgba(255,255,255,0.08)" fillHeight={60} ripple={true}
      style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6, fontSize:9, fontWeight:600, color:'var(--dim)', letterSpacing:1, ...style }}>
      {children}
    </LiquidBlock>
  )
}
