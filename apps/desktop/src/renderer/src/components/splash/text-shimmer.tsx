import { m as motion } from 'motion/react'
import { useMemo, type CSSProperties } from 'react'

interface TextShimmerProps {
  children: string
  duration?: number
  spread?: number
  baseColor?: string
  shimmerColor?: string
  style?: CSSProperties
}

export function TextShimmer({
  children,
  duration = 2,
  spread = 2,
  baseColor = 'rgba(154, 152, 152, 0.55)',
  shimmerColor = '#fdfcfc',
  style
}: TextShimmerProps): React.JSX.Element {
  const dynamicSpread = useMemo(() => children.length * spread, [children, spread])

  return (
    <motion.span
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{ repeat: Infinity, duration, ease: 'linear' }}
      style={{
        position: 'relative',
        display: 'inline-block',
        backgroundSize: '250% 100%, auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundRepeat: 'no-repeat, padding-box',
        backgroundImage: `linear-gradient(90deg, transparent calc(50% - ${dynamicSpread}px), ${shimmerColor}, transparent calc(50% + ${dynamicSpread}px)), linear-gradient(${baseColor}, ${baseColor})`,
        ...style
      }}
    >
      {children}
    </motion.span>
  )
}
