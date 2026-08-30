import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { score?: number }

export function RtLogo({ score, ...props }: Props): React.JSX.Element {
  // single tomato glyph; meaning conveyed by score number alongside
  return (
    <svg
      viewBox="0 0 138.75 141.25"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={score !== undefined ? `Rotten Tomatoes ${score}%` : 'Rotten Tomatoes'}
      {...props}
    >
      <g fill="#F93208">
        <path d="m20.15 40.82c-28.14 27.62-13.65 61.01-5.73 71.93 35.25 41.95 92.79 25.33 111.89-5.90 4.76-8.20 22.55-53.46-23.97-78.00z" />
        <path d="m39.61 39.26 4.77-8.86 28.40-5.03 11.11 9.20z" />
      </g>
      <path
        d="m39.43 8.56 8.96-5.28 6.75 15.47c3.79-6.32 13.79-16.31 24.93-4.66-4.72 1.26-7.51 3.85-7.73 8.47 15.14-4.16 31.34 3.21 33.53 9.09-10.95-4.31-27.69 10.37-41.77 2.33 0.00 15.04-12.61 16.63-19.90 17.07 2.07-4.99 5.59-9.99 1.47-14.98-7.61 8.17-13.87 10.66-33.17 4.66 4.87-1.67 14.84-11.39 24.44-11.42-6.77-2.46-12.29-2.08-17.81-1.47 2.91-3.96 12.14-15.19 28.62-8.47z"
        fill="#02902E"
      />
    </svg>
  )
}
