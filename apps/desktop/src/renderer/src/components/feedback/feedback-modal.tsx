import { useEffect, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { useAction, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { AnimatePresence, m as motion } from 'motion/react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Avatar } from '@renderer/components/ui/avatar'
import { Select } from '@renderer/components/ui/select'
import { CloseIcon, CmdIcon, ReturnIcon } from '@renderer/components/icons'
import { isMac } from '@renderer/lib/platform'
import { cn } from '@renderer/lib/cn'
import { useErrorShake } from '@renderer/hooks/use-error-shake'
import { api } from '@convex/_generated/api'

const MIN_MSG = 5
const MAX_MSG = 4000

const feedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(MIN_MSG, `At least ${MIN_MSG} characters`)
    .max(MAX_MSG, `Max ${MAX_MSG} characters`),
  type: z.enum(['bug', 'feature', 'other'])
})

function extractError(e: unknown): string {
  if (e instanceof ConvexError) {
    const data = (e as ConvexError<string>).data
    return typeof data === 'string' ? data : 'Something went wrong'
  }
  if (e instanceof Error) {
    // Strip "Uncaught ConvexError: " prefix and " at handler ..." suffix that
    // bubbles up from Convex actions on the client.
    const m = e.message.match(/ConvexError:\s*([\s\S]+?)(?:\s+at\s+\w|$)/)
    if (m && m[1]) return m[1].trim()
  }
  return 'Something went wrong. Please try again.'
}

type FeedbackType = 'bug' | 'feature' | 'other'

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'other', label: 'Other' }
]

function AdminStack({
  admins
}: {
  admins: Array<{ username: string; displayName: string; avatarUrl?: string }>
}): React.JSX.Element {
  const MAX = 5
  const shown = admins.slice(0, MAX)
  const extra = admins.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <span
          key={a.username}
          className="-ml-2 inline-block rounded-full ring-[3px] ring-[#1a1a1a] first:ml-0"
          style={{ zIndex: shown.length - i }}
        >
          <Avatar
            size="lg"
            className="size-11"
            alt={a.displayName}
            seed={a.username}
            src={a.avatarUrl}
          />
        </span>
      ))}
      {extra > 0 ? (
        <span
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-text ring-[3px] ring-[#1a1a1a]"
          aria-label={`${extra} more`}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  )
}

function detectPlatform(): string {
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return 'win'
  if (/Mac/i.test(ua)) return 'mac'
  if (/Linux/i.test(ua)) return 'linux'
  return 'other'
}

type FeedbackValues = z.infer<typeof feedbackSchema>

export function FeedbackModal({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}): React.JSX.Element {
  const submit = useAction(api.feedback.submit)
  const me = useQuery(api.profiles.me)
  const admins = useQuery(api.profiles.listAdmins)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors, isValid, isSubmitted }
  } = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    mode: 'onChange',
    defaultValues: { message: '', type: 'bug' }
  })

  const message = watch('message')
  const fieldError = errors.message?.message
  const shownError = serverError ?? (isSubmitted ? fieldError : undefined)
  const shakeRef = useErrorShake<HTMLSpanElement>(shownError)

  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        reset({ message: '', type: 'bug' })
        setState('idle')
        setServerError(null)
      }, 200)
      return () => clearTimeout(id)
    }
    return
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    setState('sending')
    setServerError(null)
    try {
      await submit({
        message: values.message,
        type: values.type,
        username: me?.profile?.username,
        displayName: me?.profile?.displayName,
        route: window.location.hash.slice(1) || '/',
        platform: detectPlatform()
      })
      setState('sent')
    } catch (e) {
      setState('error')
      setServerError(extractError(e))
    }
  })

  const canSend = isValid && state === 'idle'

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void onSubmit()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup
          aria-label="Send feedback"
          className="fixed top-1/2 left-1/2 z-50 flex h-[360px] w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-[0_24px_64px_rgba(0,0,0,0.5)] outline-none"
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-md text-text-tertiary outline-none transition-colors duration-150 ease-out hover:bg-white/[0.08] hover:text-white active:opacity-70"
          >
            <CloseIcon className="size-3" />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            {state === 'sent' ? (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center"
              >
                {admins && admins.length > 0 ? <AdminStack admins={admins} /> : null}
                <h2 className="text-[22px] leading-7 font-semibold text-text">Thank you!</h2>
                <p className="text-[13px] leading-5 font-medium text-text-tertiary">
                  We appreciate every message that helps us improve Vesper.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="flex h-full flex-col"
              >
                <div className="flex items-center justify-between gap-2 px-5 pt-4">
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        ariaLabel="Feedback type"
                        value={field.value}
                        onChange={(v) => field.onChange(v as FeedbackType)}
                        options={TYPE_OPTIONS}
                      />
                    )}
                  />
                </div>
                <span
                  ref={shakeRef}
                  className={cn('t-input flex flex-1 flex-col', shownError && 'is-error')}
                >
                  <textarea
                    autoFocus
                    {...register('message')}
                    onKeyDown={onKey}
                    placeholder="What's on your mind?"
                    className="scroll-hide flex-1 resize-none bg-transparent px-5 pt-3 pb-4 text-[14px] leading-5 font-medium text-text outline-none placeholder:text-text-tertiary"
                  />
                </span>
                <AnimatePresence>
                  {serverError ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                      className="px-5 pb-2"
                    >
                      <p className="line-clamp-2 text-[12px] leading-4 font-medium text-[#f08c8c]">
                        {serverError}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className="flex items-center justify-between gap-3 border-t border-white/[0.04] px-4 py-3">
                  <span
                    className={cn(
                      'text-[11px] leading-4 font-medium',
                      fieldError && isSubmitted ? 'text-red-400' : 'text-text-muted'
                    )}
                  >
                    {fieldError && isSubmitted
                      ? fieldError
                      : `${message.trim().length} / ${MAX_MSG}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => void onSubmit()}
                    disabled={!canSend}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] leading-4 font-semibold text-black outline-none transition-opacity disabled:opacity-40'
                    )}
                  >
                    <span className="leading-none whitespace-nowrap">
                      {state === 'sending' ? 'Sending…' : 'Send to the Vesper team'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-black/45" aria-hidden>
                      {isMac ? (
                        <CmdIcon className="size-3.5" />
                      ) : (
                        <span className="text-[11px] font-semibold">Ctrl</span>
                      )}
                      <ReturnIcon className="size-3.5" />
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
