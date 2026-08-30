import { Ring } from '@renderer/components/ui/spinner'
import { cn } from '@renderer/lib/cn'

interface BufferOverlayProps {
  backdropUrl?: string
  logoUrl?: string
  visible: boolean
  mode?: 'initial' | 'rebuffer'
}

export function BufferOverlay({
  backdropUrl,
  logoUrl,
  visible,
  mode = 'initial'
}: BufferOverlayProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden={!visible}
    >
      {mode === 'initial' && backdropUrl ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      ) : null}
      {mode === 'initial' ? <div className="absolute inset-0 bg-black/55" /> : null}
      <div className="relative flex flex-col items-center gap-6">
        {logoUrl ? <LogoFillIn src={logoUrl} /> : <Ring className="size-7 text-white" />}
      </div>
    </div>
  )
}

function LogoFillIn({ src }: { src: string }): React.JSX.Element {
  return (
    <div
      className="relative h-[110px] w-[380px] max-w-[60vw]"
      style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.6))' }}
    >
      <img
        src={src}
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain opacity-25"
      />
      <div
        className="vesper-logo-fill absolute inset-0 h-full w-full"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <style>{`
        .vesper-logo-fill {
          -webkit-mask-image: linear-gradient(110deg, #000 0%, #000 50%, transparent 65%, transparent 100%);
                  mask-image: linear-gradient(110deg, #000 0%, #000 50%, transparent 65%, transparent 100%);
          -webkit-mask-size: 220% 100%;
                  mask-size: 220% 100%;
          -webkit-mask-repeat: no-repeat;
                  mask-repeat: no-repeat;
          animation: vesper-logo-fill-anim 2.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes vesper-logo-fill-anim {
          0%   { -webkit-mask-position: -120% 0; mask-position: -120% 0; }
          80%  { -webkit-mask-position: 120% 0;  mask-position: 120% 0;  }
          100% { -webkit-mask-position: 120% 0;  mask-position: 120% 0;  }
        }
      `}</style>
    </div>
  )
}
