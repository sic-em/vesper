import { AnimatePresence, m as motion } from 'motion/react'

interface Props {
  message: string | null
}

export function PlayerToast({ message }: Props): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-40 flex justify-center">
      <AnimatePresence>
        {message ? (
          <motion.div
            key={message}
            className="rounded-full bg-black/72 px-4 py-2 text-[13px] leading-4 font-semibold text-white backdrop-blur-md"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
