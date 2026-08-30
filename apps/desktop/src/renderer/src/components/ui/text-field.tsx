import { useState } from 'react'
import { Input } from '@base-ui/react/input'
import { cn } from '@renderer/lib/cn'
import { EyeIcon, EyeOffIcon } from '@renderer/components/icons'
import { useErrorShake } from '@renderer/hooks/use-error-shake'

type BaseInputProps = React.ComponentPropsWithoutRef<typeof Input>

export interface TextFieldProps extends Omit<BaseInputProps, 'children'> {
  label?: string
  hint?: string
  error?: string
  trailing?: React.ReactNode
  containerClassName?: string
  ref?: React.Ref<HTMLInputElement>
}

export function TextField({
  label,
  hint,
  error,
  trailing,
  containerClassName,
  className,
  type,
  ref,
  ...props
}: TextFieldProps): React.JSX.Element {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && revealed ? 'text' : type
  const shakeRef = useErrorShake<HTMLSpanElement>(error)

  const reveal = isPassword ? (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      aria-label={revealed ? 'Hide password' : 'Show password'}
      className="text-text-muted hover:text-text-tertiary outline-none transition-opacity active:opacity-70"
    >
      {revealed ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
    </button>
  ) : null

  return (
    <label
      className={cn('t-input-wrap flex flex-col gap-1.5', error && 'is-error', containerClassName)}
    >
      {label ? (
        <span className="text-[12px] leading-4 font-semibold text-text-tertiary">{label}</span>
      ) : null}
      <span
        ref={shakeRef}
        className={cn(
          't-input flex h-12 items-center gap-2 rounded-[14px] bg-surface-2 px-[14px] shadow-[inset_0_0_0_1px_transparent]',
          error && 'shadow-[inset_0_0_0_1px_rgb(248_113_113/0.55)]'
        )}
      >
        <Input
          ref={ref}
          type={inputType}
          className={cn(
            'h-full flex-1 bg-transparent text-[14px] leading-5 font-medium text-text outline-none placeholder:text-text-muted',
            className
          )}
          {...props}
        />
        {reveal}
        {trailing}
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
