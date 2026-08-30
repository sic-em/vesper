import { Button as BaseButton } from '@base-ui/react/button'

export interface VideoCardProps {
  title: string
  ytKey: string
  onOpen: () => void
}

export function VideoCard({ title, ytKey, onOpen }: VideoCardProps): React.JSX.Element {
  const thumb = `https://i.ytimg.com/vi/${ytKey}/hqdefault.jpg`
  return (
    <BaseButton
      onClick={onOpen}
      className="relative h-[150px] w-[268px] shrink-0 overflow-hidden rounded-xl bg-surface-2 bg-cover bg-center outline-none"
      style={{ backgroundImage: `url(${thumb})` }}
      aria-label={title}
    />
  )
}
