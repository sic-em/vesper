import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  'aria-hidden': true
} as const

export const ChevronLeftIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M15.00 20L8.41 13.41C7.63 12.63 7.63 11.36 8.41 10.58L15.00 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChevronRightIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M9 4L15.58 10.58C16.36 11.36 16.36 12.63 15.58 13.41L9 20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const SearchIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M20.25 20.25L16.5 16.5M16.5 16.5C18 15 18.75 13 18.75 11C18.75 6.71 15.29 3.25 11 3.25C6.71 3.25 3.25 6.71 3.25 11C3.25 15.29 6.71 18.75 11 18.75C13 18.75 15 18 16.5 16.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const BellIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M12 2C7.79 2 4.19 5.17 3.75 9.35L2.98 14.33C2.73 15.99 4.01 17.5 5.70 17.5H18.29C19.98 17.5 21.26 15.99 21.01 14.33L20.25 9.35C19.80 5.17 16.20 2 12 2Z"
      fill="currentColor"
    />
    <path
      d="M16.58 19H7.41C8.18 20.76 9.94 22 12 22C14.05 22 15.81 20.76 16.58 19Z"
      fill="currentColor"
    />
  </svg>
)

export const PlusIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M11.25 18.75V12.75H5.25C4.83 12.75 4.5 12.41 4.5 12C4.5 11.58 4.83 11.25 5.25 11.25H11.25V5.25C11.25 4.83 11.58 4.5 12 4.5C12.41 4.5 12.75 4.83 12.75 5.25V11.25H18.75C19.16 11.25 19.5 11.58 19.5 12C19.5 12.41 19.16 12.75 18.75 12.75H12.75V18.75C12.75 19.16 12.41 19.5 12 19.5C11.58 19.5 11.25 19.16 11.25 18.75Z"
      fill="currentColor"
    />
  </svg>
)

export const ArrowRotateSparkleIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M3.90 10.22C4.31 10.27 4.60 10.65 4.55 11.06C4.51 11.36 4.5 11.68 4.5 12C4.50 16.14 7.85 19.5 12 19.5C14.22 19.5 16.26 18.53 17.65 17H15.26C14.84 17 14.51 16.66 14.51 16.25C14.51 15.83 14.84 15.5 15.26 15.5H19.26C19.67 15.5 20.01 15.83 20.01 16.25V20.25C20.01 20.66 19.67 21 19.26 21C18.84 21 18.51 20.66 18.51 20.25V18.27C16.85 19.95 14.52 21 12 21C7.02 21 3.00 16.97 3 12C3 11.61 3.02 11.24 3.06 10.87C3.12 10.46 3.49 10.17 3.90 10.22Z"
      fill="currentColor"
    />
    <path
      d="M18 4C18.24 4 18.45 4.14 18.54 4.37L19.24 6.18C19.34 6.44 19.55 6.65 19.81 6.75L21.62 7.45C21.85 7.54 22 7.75 22 8C22 8.24 21.85 8.45 21.62 8.54L19.81 9.24C19.55 9.34 19.34 9.55 19.24 9.81L18.54 11.62C18.45 11.85 18.24 12 18 12C17.75 12 17.54 11.85 17.45 11.62L16.75 9.81C16.65 9.55 16.44 9.34 16.18 9.24L14.37 8.54C14.14 8.45 14 8.24 14 8C14 7.75 14.14 7.54 14.37 7.45L16.18 6.75C16.44 6.65 16.65 6.44 16.75 6.18L17.45 4.37C17.54 4.14 17.75 4 18 4Z"
      fill="currentColor"
    />
    <path
      d="M11.99 3C12.41 3 12.74 3.33 12.74 3.75C12.74 4.16 12.41 4.5 11.99 4.5C9.77 4.50 7.74 5.46 6.34 7H8.75C9.16 7 9.5 7.33 9.5 7.75C9.5 8.16 9.16 8.5 8.75 8.5H4.75C4.33 8.5 4 8.16 4 7.75V3.75C4 3.33 4.33 3 4.75 3C5.16 3 5.5 3.33 5.5 3.75V5.71C7.15 4.03 9.47 3.00 11.99 3Z"
      fill="currentColor"
    />
  </svg>
)

export const SidebarLeftIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 5.5V18.5H19.25C19.94 18.5 20.5 17.94 20.5 17.25V6.75C20.5 6.05 19.94 5.5 19.25 5.5H9ZM2 6.75C2 5.23 3.23 4 4.75 4H19.25C20.76 4 22 5.23 22 6.75V17.25C22 18.76 20.76 20 19.25 20H4.75C3.23 20 2 18.76 2 17.25V6.75Z"
      fill="currentColor"
    />
  </svg>
)

export const SidebarRightIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15 5.5V18.5H4.75C4.05 18.5 3.5 17.94 3.5 17.25V6.75C3.5 6.05 4.05 5.5 4.75 5.5H15ZM22 6.75C22 5.23 20.76 4 19.25 4H4.75C3.23 4 2 5.23 2 6.75V17.25C2 18.76 3.23 20 4.75 20H19.25C20.76 20 22 18.76 22 17.25V6.75Z"
      fill="currentColor"
    />
  </svg>
)

export const PlayIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M9.24 2.36C7.41 1.18 5 2.49 5 4.67V19.32C5 21.50 7.41 22.81 9.24 21.63L20.56 14.30C22.23 13.22 22.23 10.77 20.56 9.69L9.24 2.36Z"
      fill="currentColor"
    />
  </svg>
)

export const UserGroupIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M15.39 12.17C16.67 13.17 17.5 14.74 17.5 16.5V16.64C17.49 17.94 16.44 18.99 15.14 19H8.85C7.55 18.99 6.50 17.94 6.5 16.64V16.5C6.5 14.74 7.32 13.17 8.60 12.17C9.49 12.99 10.69 13.5 12 13.5C13.30 13.5 14.50 12.99 15.39 12.17Z"
      fill="currentColor"
    />
    <path
      d="M1.17 12.67C1.92 13.34 2.91 13.75 4 13.75C4.61 13.75 5.20 13.61 5.73 13.37C5.26 14.31 5 15.37 5 16.5V16.64C5.00 17.12 5.08 17.57 5.24 18H2.01C0.90 18 0 17.09 0 15.98V15.5C0 14.39 0.44 13.39 1.17 12.67Z"
      fill="currentColor"
    />
    <path
      d="M22.82 12.67C23.55 13.39 24 14.39 24 15.5V15.98C24 17.09 23.09 18 21.98 18H18.75C18.91 17.57 18.99 17.12 19 16.64V16.5C19 15.37 18.73 14.31 18.26 13.37C18.79 13.61 19.38 13.75 20 13.75C21.08 13.75 22.07 13.34 22.82 12.67Z"
      fill="currentColor"
    />
    <path
      d="M4 6.75C5.51 6.75 6.75 7.98 6.75 9.5C6.75 11.01 5.51 12.25 4 12.25C2.48 12.25 1.25 11.01 1.25 9.5C1.25 7.98 2.48 6.75 4 6.75Z"
      fill="currentColor"
    />
    <path
      d="M20 6.75C21.51 6.75 22.75 7.98 22.75 9.5C22.75 11.01 21.51 12.25 20 12.25C18.48 12.25 17.25 11.01 17.25 9.5C17.25 7.98 18.48 6.75 20 6.75Z"
      fill="currentColor"
    />
    <path
      d="M12 5C13.93 5 15.5 6.56 15.5 8.5C15.5 10.43 13.93 12 12 12C10.06 12 8.5 10.43 8.5 8.5C8.5 6.56 10.06 5 12 5Z"
      fill="currentColor"
    />
  </svg>
)

export const HomeIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M13.81 2.34C12.77 1.43 11.22 1.43 10.18 2.34L3.93 7.83C3.34 8.36 3 9.11 3 9.90V18.25C3 19.76 4.23 21.00 5.75 21.00H8.16C9.12 21.00 9.91 20.21 9.91 19.25V17.00C9.91 15.89 10.80 15.00 11.91 15.00H12C13.10 15.00 14 15.89 14 17.00V19.25C14 20.21 14.78 21.00 15.75 21.00H18.25C19.76 21.00 21 19.76 21 18.25V9.90C21 9.11 20.65 8.36 20.06 7.83L13.81 2.34Z"
      fill="currentColor"
    />
  </svg>
)

export const CompassIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM14.5892 8.48917C15.1491 8.33648 15.6628 8.85021 15.5101 9.41008L14.3907 13.5146C14.2742 13.9416 13.9407 14.2752 13.5136 14.3917L9.4091 15.5111C8.84923 15.6638 8.3355 15.1501 8.48819 14.5902L9.60761 10.4856C9.72407 10.0586 10.0577 9.72505 10.4847 9.60859L14.5892 8.48917Z"
      fill="currentColor"
    />
  </svg>
)

export const HeartIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M12 4.32C12.19 4.18 12.43 4.02 12.73 3.86C13.52 3.43 14.67 3 16.11 3C17.59 3 19.08 3.59 20.19 4.78C21.30 5.97 22 7.71 22 9.93C22 13.25 19.64 16.02 17.39 17.89C16.24 18.84 15.07 19.60 14.13 20.12C13.66 20.38 13.24 20.59 12.91 20.73C12.74 20.81 12.59 20.87 12.46 20.91C12.35 20.94 12.17 21 12 21C11.82 21 11.64 20.94 11.53 20.91C11.40 20.87 11.25 20.81 11.08 20.73C10.75 20.59 10.33 20.38 9.86 20.12C8.92 19.60 7.75 18.84 6.60 17.89C4.35 16.02 2 13.25 2 9.93C2 7.71 2.69 5.97 3.80 4.78C4.91 3.59 6.40 3 7.88 3C9.32 3 10.47 3.43 11.26 3.86C11.56 4.02 11.80 4.18 12 4.32Z"
      fill="currentColor"
    />
  </svg>
)

export const StarSolidIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M13.36 1.85C12.81 0.71 11.18 0.71 10.63 1.85L8.26 6.78C8.26 6.78 8.26 6.78 8.26 6.78L2.81 7.50C1.55 7.66 1.04 9.21 1.97 10.09L5.95 13.84C5.95 13.84 5.95 13.85 5.95 13.85L4.95 19.21C4.72 20.46 6.04 21.41 7.15 20.81L11.99 18.21C11.99 18.20 12.00 18.20 12.00 18.21L16.83 20.81C17.94 21.41 19.27 20.46 19.04 19.21L18.04 13.85C18.04 13.85 18.03 13.84 18.04 13.84L22.02 10.09C22.95 9.21 22.44 7.66 21.18 7.50L15.73 6.78C15.73 6.78 15.72 6.78 15.72 6.78L13.36 1.85Z"
      fill="currentColor"
    />
  </svg>
)

export const EyeSolidIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 4C15.87 4.00 19.65 6.31 22.18 10.74C22.62 11.52 22.62 12.47 22.18 13.25C19.65 17.68 15.87 20 12 19.99C8.12 19.99 4.34 17.68 1.81 13.25C1.37 12.47 1.37 11.52 1.81 10.74C4.34 6.31 8.12 3.99 12 4ZM8.37 12C8.37 9.99 9.99 8.37 12 8.37C14.00 8.37 15.62 9.99 15.62 12C15.62 14.00 14.00 15.62 12 15.62C9.99 15.62 8.37 14.00 8.37 12Z"
      fill="currentColor"
    />
  </svg>
)

export const EyeIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
  </svg>
)

export const EyeOffIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M3 3L21 21M9.88 5.08C10.56 4.94 11.27 4.86 12 4.86C19 4.86 22 11.86 22 11.86C22 11.86 21.06 14.04 19 16M6.32 6.32C3.5 8.5 2 12 2 12C2 12 5 19 12 19C13.7 19 15.18 18.62 16.45 18.05M9.9 9.9C9.36 10.44 9 11.18 9 12C9 13.66 10.34 15 12 15C12.82 15 13.56 14.64 14.1 14.1"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
)

export const UserIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M15.78 12.22C18.27 13.41 20 15.96 20 18.91C19.99 20.06 19.06 20.99 17.91 21H6.08C4.93 20.99 4.00 20.06 4 18.91C4 15.96 5.72 13.41 8.21 12.22C9.26 13.02 10.57 13.5 12 13.5C13.42 13.5 14.73 13.02 15.78 12.22Z"
      fill="currentColor"
    />
    <path
      d="M12 2.5C14.62 2.5 16.75 4.62 16.75 7.25C16.75 9.87 14.62 12 12 12C9.37 12 7.25 9.87 7.25 7.25C7.25 4.62 9.37 2.5 12 2.5Z"
      fill="currentColor"
    />
  </svg>
)

export const SettingsIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.93 3.10C10.39 2.41 11.17 2 12 2C12.82 2 13.60 2.41 14.06 3.10L14.63 3.95C14.92 4.39 15.44 4.60 15.95 4.48L16.65 4.32C17.50 4.12 18.39 4.38 19.00 4.99C19.61 5.60 19.87 6.49 19.67 7.34L19.51 8.04C19.39 8.55 19.60 9.07 20.04 9.36L20.89 9.93C21.58 10.39 22 11.17 22 12C22 12.82 21.58 13.60 20.89 14.06L20.04 14.63C19.60 14.92 19.39 15.44 19.51 15.95L19.67 16.65C19.87 17.50 19.61 18.39 19.00 19.00C18.39 19.61 17.50 19.87 16.65 19.67L15.95 19.51C15.44 19.39 14.92 19.60 14.63 20.04L14.06 20.89C13.60 21.58 12.82 22 12 22C11.17 22 10.39 21.58 9.93 20.89L9.36 20.04C9.07 19.60 8.55 19.39 8.04 19.51L7.34 19.67C6.49 19.87 5.60 19.61 4.99 19.00C4.38 18.39 4.12 17.50 4.32 16.65L4.48 15.95C4.60 15.44 4.39 14.92 3.95 14.63L3.10 14.06C2.41 13.60 2 12.82 2 12C2 11.17 2.41 10.39 3.10 9.93L3.95 9.36C4.39 9.07 4.60 8.55 4.48 8.04L4.32 7.34C4.12 6.49 4.38 5.60 4.99 4.99C5.60 4.38 6.49 4.12 7.34 4.32L8.04 4.48C8.55 4.60 9.07 4.39 9.36 3.95L9.93 3.10ZM8.87 12C8.87 10.27 10.27 8.87 12 8.87C13.72 8.87 15.12 10.27 15.12 12C15.12 13.72 13.72 15.12 12 15.12C10.27 15.12 8.87 13.72 8.87 12Z"
      fill="currentColor"
    />
  </svg>
)

export const HelpIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.47 2 2 6.47 2 12C2 17.52 6.47 22 12 22C17.52 22 22 17.52 22 12C22 6.47 17.52 2 12 2ZM11.25 8.5C10.83 8.5 10.5 8.83 10.5 9.25C10.5 9.66 10.16 10 9.75 10C9.33 10 9 9.66 9 9.25C9 8.00 10.00 7 11.25 7H12.45C13.86 7 15 8.13 15 9.54C15 10.39 14.57 11.18 13.86 11.65L13.30 12.03C12.95 12.26 12.75 12.65 12.75 13.07V13.25C12.75 13.66 12.41 14 12 14C11.58 14 11.25 13.66 11.25 13.25V13.07C11.25 12.15 11.70 11.29 12.47 10.78L13.03 10.40C13.32 10.21 13.5 9.88 13.5 9.54C13.5 8.96 13.03 8.5 12.45 8.5H11.25ZM12 15C11.44 15 11 15.44 11 16C11 16.55 11.44 17 12 17C12.55 17 13 16.55 13 16C13 15.44 12.55 15 12 15Z"
      fill="currentColor"
    />
  </svg>
)

export const SignOutIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.75 4.5C5.05 4.5 4.5 5.05 4.5 5.75L4.5 18.25C4.5 18.94 5.05 19.5 5.75 19.5H11.25C11.66 19.5 12 19.83 12 20.25C12 20.66 11.66 21 11.25 21H5.75C4.23 21 3 19.76 3 18.25L3 5.75C3 4.23 4.23 3 5.75 3L11.25 3C11.66 3 12 3.33 12 3.75C12 4.16 11.66 4.5 11.25 4.5L5.75 4.5ZM15.21 6.96C15.51 6.67 15.98 6.67 16.28 6.96L20.78 11.46C21.07 11.76 21.07 12.23 20.78 12.53L16.28 17.03C15.98 17.32 15.51 17.32 15.21 17.03C14.92 16.73 14.92 16.26 15.21 15.96L18.43 12.75L9 12.75C8.58 12.75 8.25 12.41 8.25 12C8.25 11.58 8.58 11.25 9 11.25L18.43 11.25L15.21 8.03C14.92 7.73 14.92 7.26 15.21 6.96Z"
      fill="currentColor"
    />
  </svg>
)

export const VesperLogo = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 4C5.55 4 6 4.44 6 5V8C6 8.55 5.55 9 5 9C4.44 9 4 8.55 4 8V5C4 4.44 4.44 4 5 4ZM19 4C19.55 4 20 4.44 20 5V8C20 8.55 19.55 9 19 9C18.44 9 18 8.55 18 8V5C18 4.44 18.44 4 19 4ZM13 5C13.55 5 14 5.44 14 6V12.5C14 14.15 12.65 15.5 11 15.5C10.44 15.5 10 15.05 10 14.5C10 13.94 10.44 13.5 11 13.5C11.55 13.5 12 13.05 12 12.5V6C12 5.44 12.44 5 13 5ZM5.22 16.86C5.58 16.43 6.21 16.37 6.63 16.72C8.53 18.29 10.30 19 12 19C13.69 19 15.46 18.29 17.36 16.72C17.78 16.37 18.41 16.43 18.77 16.86C19.12 17.28 19.06 17.91 18.63 18.27C16.50 20.03 14.29 21 12 21C9.70 21 7.49 20.03 5.36 18.27C4.93 17.91 4.87 17.28 5.22 16.86Z"
      fill="currentColor"
    />
  </svg>
)

export const LockIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M6 10V8C6 4.68 8.68 2 12 2C15.31 2 18 4.68 18 8V10M5.75 21.25H18.25C19.35 21.25 20.25 20.35 20.25 19.25V12C20.25 10.89 19.35 10 18.25 10H5.75C4.64 10 3.75 10.89 3.75 12V19.25C3.75 20.35 4.64 21.25 5.75 21.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const CheckIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M4.5 12.75L9.75 18L19.5 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const CloseIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M6 6L18 18M6 18L18 6"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const AlertCircleIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 8V13M12 16.5V16.51"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
)

export const FullscreenIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M13.75 3.75H20.25V10.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.75 13.75V20.25H10.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.47 4.52L13.75 10.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.25 13.75L4.52 19.47"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const VolumeOnIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const VolumeOffIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const DiscordIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} viewBox="0 0 24 24" {...props}>
    <path
      fill="#5865F2"
      d="M20.31 4.37a19.79 19.79 0 0 0-4.88-1.51a.074.07 0 0 0-.079.03c-.21.37-.444.86-.608 1.25a18.27 18.27 0 0 0-5.48 0a12.64 12.64 0 0 0-.617-1.25a.077.07 0 0 0-.079-.037A19.7 19.7 0 0 0 3.67 4.37a.07.07 0 0 0-.032.02C.533 9.04-.32 13.58.09 18.05a.082.08 0 0 0 .031.05a19.9 19.9 0 0 0 5.99 3.03a.078.07 0 0 0 .084-.028a14.09 14.09 0 0 0 1.22-1.99a.076.07 0 0 0-.041-.106a13.10 13.10 0 0 1-1.87-.892a.077.07 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.07 0 0 1 .077-.01c3.92 1.79 8.18 1.79 12.06 0a.074.07 0 0 1 .078.01c.12.09.246.19.373.29a.077.07 0 0 1-.006.12a12.29 12.29 0 0 1-1.87.892a.077.07 0 0 0-.041.10c.36.69.772 1.36 1.22 1.99a.076.07 0 0 0 .084.02a19.84 19.84 0 0 0 6.00-3.03a.077.07 0 0 0 .032-.054c.5-5.17-.838-9.67-3.54-13.66a.061.06 0 0 0-.031-.03zM8.02 15.33c-1.18 0-2.15-1.08-2.15-2.41c0-1.33.956-2.41 2.15-2.41c1.21 0 2.17 1.09 2.15 2.42c0 1.33-.956 2.41-2.15 2.41m7.97 0c-1.18 0-2.15-1.08-2.15-2.41c0-1.33.955-2.41 2.15-2.41c1.21 0 2.17 1.09 2.15 2.42c0 1.33-.946 2.41-2.15 2.41"
    />
  </svg>
)

export const ImageEditIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.25 3C19.76 3 21 4.23 21 5.75V18.25C21 19.76 19.76 21 18.25 21H5.75C4.23 21 3 19.76 3 18.25V5.75C3 4.23 4.23 3 5.75 3H18.25ZM9.23 13.23C8.55 12.55 7.44 12.55 6.76 13.23L4.5 15.5V18.25C4.5 18.94 5.05 19.5 5.75 19.5H15.5L9.23 13.23ZM15 6.5C13.61 6.5 12.5 7.61 12.5 9C12.5 10.38 13.61 11.5 15 11.5C16.38 11.5 17.5 10.38 17.5 9C17.5 7.61 16.38 6.5 15 6.5Z"
      fill="currentColor"
    />
  </svg>
)

export const CheckCircleIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.47 2 2 6.47 2 12C2 17.52 6.47 22 12 22C17.52 22 22 17.52 22 12C22 6.47 17.52 2 12 2ZM15.58 9.97C15.84 9.65 15.79 9.18 15.47 8.91C15.15 8.65 14.68 8.70 14.41 9.02L10.44 13.88L9.03 12.46C8.73 12.17 8.26 12.17 7.96 12.46C7.67 12.76 7.67 13.23 7.96 13.53L9.96 15.53C10.11 15.68 10.32 15.75 10.53 15.74C10.74 15.73 10.94 15.63 11.08 15.47L15.58 9.97Z"
      fill="currentColor"
    />
  </svg>
)

export const MenuDotsIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <circle cx="3.75" cy="12" r="1" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="20.25" cy="12" r="1" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const WinMinimizeIcon = (props: IconProps): React.JSX.Element => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none" aria-hidden {...props}>
    <path d="M2 6H10" stroke="currentColor" strokeLinecap="square" />
  </svg>
)

export const WinMaximizeIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M20.25 17.05V6.95C20.25 5.82 20.25 5.26 20.03 4.84C19.84 4.46 19.53 4.15 19.15 3.96C18.73 3.75 18.17 3.75 17.05 3.75H6.95C5.82 3.75 5.26 3.75 4.84 3.96C4.46 4.15 4.15 4.46 3.96 4.84C3.75 5.26 3.75 5.82 3.75 6.95V17.05C3.75 18.17 3.75 18.73 3.96 19.15C4.15 19.53 4.46 19.84 4.84 20.03C5.26 20.25 5.82 20.25 6.95 20.25H17.05C18.17 20.25 18.73 20.25 19.15 20.03C19.53 19.84 19.84 19.53 20.03 19.15C20.25 18.73 20.25 18.17 20.25 17.05Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const PinSolidIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M4.01 12.32L7.31 15.62L3.21 19.71C2.92 20.01 2.92 20.48 3.21 20.78C3.51 21.07 3.98 21.07 4.28 20.78L8.37 16.68L11.67 19.98C13.27 21.58 15.99 20.68 16.34 18.46L17.08 13.65C17.14 13.24 17.40 12.89 17.77 12.71L20.52 11.39C22.23 10.57 22.62 8.31 21.28 6.97L17.02 2.71C15.68 1.37 13.42 1.76 12.60 3.47L11.28 6.22C11.10 6.59 10.75 6.85 10.34 6.91L5.53 7.65C3.31 8.00 2.41 10.72 4.01 12.32Z"
      fill="currentColor"
    />
  </svg>
)

export const WinCloseIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.11 4.11C4.60 3.62 5.39 3.62 5.88 4.11L12 10.23L18.11 4.11C18.60 3.62 19.39 3.62 19.88 4.11C20.37 4.60 20.37 5.39 19.88 5.88L13.76 12L19.88 18.11C20.37 18.60 20.37 19.39 19.88 19.88C19.39 20.37 18.60 20.37 18.11 19.88L12 13.76L5.88 19.88C5.39 20.37 4.60 20.37 4.11 19.88C3.62 19.39 3.62 18.60 4.11 18.11L10.23 12L4.11 5.88C3.62 5.39 3.62 4.60 4.11 4.11Z"
      fill="currentColor"
    />
  </svg>
)

export const CmdIcon = (props: IconProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 6.5C3 4.56 4.56 3 6.5 3C8.43 3 10 4.56 10 6.5V8.5H14V6.5C14 4.56 15.56 3 17.5 3C19.43 3 21 4.56 21 6.5C21 8.43 19.43 10 17.5 10H15.5V14H17.5C19.43 14 21 15.56 21 17.5C21 19.43 19.43 21 17.5 21C15.56 21 14 19.43 14 17.5V15.5H10V17.5C10 19.43 8.43 21 6.5 21C4.56 21 3 19.43 3 17.5C3 15.56 4.56 14 6.5 14H8.5V10H6.5C4.56 10 3 8.43 3 6.5ZM8.5 8.5V6.5C8.5 5.39 7.60 4.5 6.5 4.5C5.39 4.5 4.5 5.39 4.5 6.5C4.5 7.60 5.39 8.5 6.5 8.5H8.5ZM10 10V14H14V10H10ZM8.5 15.5H6.5C5.39 15.5 4.5 16.39 4.5 17.5C4.5 18.60 5.39 19.5 6.5 19.5C7.60 19.5 8.5 18.60 8.5 17.5V15.5ZM15.5 15.5V17.5C15.5 18.60 16.39 19.5 17.5 19.5C18.60 19.5 19.5 18.60 19.5 17.5C19.5 16.39 18.60 15.5 17.5 15.5H15.5ZM15.5 8.5H17.5C18.60 8.5 19.5 7.60 19.5 6.5C19.5 5.39 18.60 4.5 17.5 4.5C16.39 4.5 15.5 5.39 15.5 6.5V8.5Z"
      fill="currentColor"
    />
  </svg>
)

export const ReturnIcon = (props: IconProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
    <g transform="scale(-1 1) translate(-24 0)">
      <path
        d="M17.75 19L21.04 15.70C21.43 15.31 21.43 14.68 21.04 14.29L17.75 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 15L6.75 15C4.54 15 2.75 13.20 2.75 11L2.75 9.75C2.75 7.54 4.54 5.75 6.75 5.75L12.25 5.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
)
