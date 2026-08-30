import { cn } from '@renderer/lib/cn'
import { useErrorShake } from '@renderer/hooks/use-error-shake'

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  containerClassName?: string
  trailingMeta?: React.ReactNode
  ref?: React.Ref<HTMLTextAreaElement>
}

export function TextArea({
  label,
  hint,
  error,
  containerClassName,
  className,
  trailingMeta,
  ref,
  ...props
}: TextAreaProps): React.JSX.Element {
  const shakeRef = useErrorShake<HTMLSpanElement>(error)
  return (
    <label
      className={cn('t-input-wrap flex flex-col gap-1.5', error && 'is-error', containerClassName)}
    >
      {(label || trailingMeta) && (
        <span className="flex items-center justify-between">
          {label ? (
            <span className="text-[12px] leading-4 font-semibold text-text-tertiary">{label}</span>
          ) : null}
          {trailingMeta}
        </span>
      )}
      <span
        ref={shakeRef}
        className={cn(
          't-input block rounded-[14px] bg-surface-2 shadow-[inset_0_0_0_1px_transparent]',
          error && 'shadow-[inset_0_0_0_1px_rgb(248_113_113/0.55)]'
        )}
      >
        <textarea
          ref={ref}
          className={cn(
            'block min-h-[96px] w-full resize-y rounded-[14px] bg-transparent px-[14px] py-3 text-[14px] leading-5 font-medium text-text outline-none placeholder:text-text-muted',
            className
          )}
          {...props}
        />
      </span>
      {error || hint ? (
        <span
          className={cn(
            't-error-msg text-[12px] leading-4 font-medium',
            error ? 'text-red-400' : 'text-text-muted'
          )}
        >
          {error ?? hint}
        </span>
      ) : null}
    </label>
  )
}
