import { cn } from '@renderer/lib/cn'

export function Ring({
  className,
  style,
  ...props
}: React.ComponentProps<'svg'>): React.JSX.Element {
  return (
    <>
      <style>{`
        @keyframes loading-ui-ring-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(className)}
        style={{
          animationName: 'loading-ui-ring-spin',
          animationDuration: 'var(--duration, 1s)',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          ...style
        }}
        {...props}
      >
        <path
          d="M21 12.00C20.99 13.90 20.39 15.75 19.28 17.29C18.16 18.82 16.58 19.97 14.78 20.55C12.97 21.14 11.02 21.14 9.21 20.55C7.41 19.97 5.83 18.82 4.71 17.29C3.60 15.75 2.99 13.90 3 11.99C3.00 10.09 3.60 8.24 4.71 6.70C5.83 5.17 7.41 4.02 9.21 3.44C11.02 2.85 12.97 2.85 14.78 3.44"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  )
}
