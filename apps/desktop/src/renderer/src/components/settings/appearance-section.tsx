import { useEffect, useState } from 'react'

import popcornImg from './variant-icons/popcorn.png'
import hiddenLeafImg from './variant-icons/hidden-leaf.png'
import akatsukiImg from './variant-icons/akatsuki.png'
import sodaImg from './variant-icons/soda.png'
import threeDeeImg from './variant-icons/3d.png'
import superSaiyanImg from './variant-icons/super-saiyan.png'
import ramenImg from './variant-icons/ramen.png'

type IconVariantId =
  | 'popcorn'
  | 'hidden-leaf'
  | 'akatsuki'
  | 'soda'
  | '3d'
  | 'super-saiyan'
  | 'ramen'

interface IconVariant {
  id: IconVariantId
  label: string
  image: string
}

const VARIANTS: IconVariant[] = [
  { id: 'popcorn', label: 'Popcorn', image: popcornImg },
  { id: 'hidden-leaf', label: 'Hidden Leaf', image: hiddenLeafImg },
  { id: 'akatsuki', label: 'Akatsuki', image: akatsukiImg },
  { id: 'soda', label: 'Soda', image: sodaImg },
  { id: '3d', label: '3D', image: threeDeeImg },
  { id: 'super-saiyan', label: 'Super Saiyan', image: superSaiyanImg },
  { id: 'ramen', label: 'Ramen', image: ramenImg }
]

export function AppearanceSection(): React.JSX.Element {
  const [variant, setVariant] = useState<IconVariantId>('popcorn')

  useEffect(() => {
    let active = true
    void window.api.appIcon.getVariant().then((id) => {
      if (active) setVariant(id)
    })
    return () => {
      active = false
    }
  }, [])

  const select = (id: IconVariantId): void => {
    setVariant(id)
    window.api.appIcon.setVariant(id).catch(() => setVariant((prev) => prev))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 px-1 pt-3">
        <span className="text-[13px] leading-4 font-medium text-text">App icon</span>
        <span className="text-[12px] leading-4 font-medium text-text-muted">
          Changes the icon shown in your taskbar and Dock.
        </span>
      </div>
      <div className="flex flex-wrap gap-3 px-1">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            title={v.label}
            aria-label={`${v.label} icon`}
            aria-pressed={variant === v.id}
            onClick={() => select(v.id)}
            className={`h-[64px] w-[64px] overflow-hidden rounded-lg bg-surface-2 outline-none transition-[transform,opacity] duration-150 hover:scale-[1.05] focus-visible:ring-2 focus-visible:ring-white/30 ${
              variant === v.id ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <img
              src={v.image}
              alt=""
              draggable={false}
              className="h-full w-full object-cover select-none"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
