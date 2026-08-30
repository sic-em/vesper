interface LinkBadgeProps {
  href: string
  label: string
  icon: React.ReactNode
  color?: string
}

export function LinkBadge({
  href,
  label,
  icon,
  color = '#f472b6'
}: LinkBadgeProps): React.JSX.Element {
  const bg = hexToRgba(color, 0.14)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px 2px 6px',
        borderRadius: 6,
        background: bg,
        color,
        fontWeight: 500,
        fontSize: '0.95em',
        textDecoration: 'none',
        verticalAlign: 'middle',
        lineHeight: 1
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          width: 14,
          height: 14,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>{label}</span>
    </a>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(244,114,182,${alpha})`
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}
