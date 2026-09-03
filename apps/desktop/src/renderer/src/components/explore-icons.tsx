import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  'aria-hidden': true
} as const

export const SwordIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M8.25 11.0543L13.3886 4.51436C13.7677 4.03178 14.3475 3.75 14.9612 3.75H20.25V9.0388C20.25 9.65252 19.9682 10.2323 19.4856 10.6114L12.9457 15.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M5.70531 10.1224L5.22988 10.7167C4.6858 11.3968 4.6444 12.3508 5.12752 13.0755L6.40326 14.9891L3.55629 17.8352C2.83548 18.5557 2.83539 19.7243 3.55609 20.445C4.27679 21.1656 5.4453 21.1656 6.16588 20.4447L9.01196 17.5978L10.9256 18.8735C11.6503 19.3566 12.6043 19.3152 13.2844 18.7712L13.8787 18.2957C14.3441 17.9234 14.3825 17.2292 13.9611 16.8078L7.19329 10.04C6.77184 9.61853 6.07764 9.65698 5.70531 10.1224Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const CompassRoundIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M14.6558 8.73023L10.5513 9.84965C10.2097 9.94281 9.94281 10.2097 9.84965 10.5513L8.73023 14.6558C8.62843 15.0291 8.97092 15.3716 9.34417 15.2698L13.4487 14.1504C13.7903 14.0572 14.0572 13.7903 14.1504 13.4487L15.2698 9.34417C15.3716 8.97092 15.0291 8.62843 14.6558 8.73023Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const SparkleIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.25 12C14.8264 12 12 14.8264 12 21.25C12 14.8264 9.17361 12 2.75 12C9.17361 12 12 9.17361 12 2.75C12 9.17361 14.8264 12 21.25 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const LolIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M16.5687 12.8237C16.8806 12.7186 17.2127 12.9342 17.2025 13.2632C17.0396 18.4991 9.48901 19.8481 7.54405 14.9661C7.42227 14.6604 7.66061 14.3443 7.98957 14.3364C10.9665 14.2652 13.747 13.7749 16.5687 12.8237Z"
      fill="currentColor"
    />
    <path
      d="M7.44042 10.4685C7.6026 10.6205 7.64505 10.8612 7.54461 11.0594L7.12222 11.8931C6.92196 12.2883 7.2914 12.7117 7.69436 12.5274C8.70056 12.0674 9.6548 11.4206 10.357 10.6023C10.5383 10.391 10.4822 10.0728 10.2396 9.93621C9.29982 9.4074 8.18191 9.126 7.07905 9.03783C6.63738 9.00252 6.43502 9.5267 6.75837 9.82961L7.44042 10.4685Z"
      fill="currentColor"
    />
    <path
      d="M15.7611 9.00122C15.6606 9.19945 15.7031 9.44018 15.8653 9.5921L16.5473 10.231C16.8707 10.5339 16.6683 11.0581 16.2266 11.0228C15.1238 10.9346 14.0059 10.6532 13.0661 10.1244C12.8235 9.98788 12.7674 9.66966 12.9487 9.45837C13.6509 8.64003 14.6051 7.99326 15.6113 7.5332C16.0143 7.34896 16.3837 7.77231 16.1835 8.16755L15.7611 9.00122Z"
      fill="currentColor"
    />
    <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const MagnifierIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M20.25 20.25L16.1265 16.1265M16.1265 16.1265C17.4385 14.8145 18.25 13.002 18.25 11C18.25 6.99594 15.0041 3.75 11 3.75C6.99594 3.75 3.75 6.99594 3.75 11C3.75 15.0041 6.99594 18.25 11 18.25C13.002 18.25 14.8145 17.4385 16.1265 16.1265Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const VideoIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M2.75 6.75C2.75 5.64543 3.64543 4.75 4.75 4.75H13.25C14.3546 4.75 15.25 5.64543 15.25 6.75V17.25C15.25 18.3546 14.3546 19.25 13.25 19.25H4.75C3.64543 19.25 2.75 18.3546 2.75 17.25V6.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M15.25 10L19.8028 7.72361C20.4677 7.39116 21.25 7.87465 21.25 8.61803V15.382C21.25 16.1253 20.4677 16.6088 19.8028 16.2764L15.25 14V10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const CurtainIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M21.2509 17.2499V14.0713C18.0009 14.0713 15.6969 16.2587 15.7509 19.2499H19.2509C20.3555 19.2499 21.2509 18.3544 21.2509 17.2499Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.75 14.071V17.2496C2.75 18.3541 3.64543 19.2496 4.75 19.2496H8.25C8.30402 16.2584 6 13.9996 2.75 14.071Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.75 14.0714V6.75C2.75 5.64543 3.64543 4.75 4.75 4.75H19.25C20.3546 4.75 21.25 5.64543 21.25 6.75V14.0714C15.5 13 14.5 10 14.75 4.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.75 14.0714C7.5 13 9.5 10 9.25 4.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 18.25H15.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="round"
    />
  </svg>
)

export const PeopleGroupIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M12.75 8.5C12.75 10.5711 11.0711 12.25 9 12.25C6.92893 12.25 5.25 10.5711 5.25 8.5C5.25 6.42893 6.92893 4.75 9 4.75C11.0711 4.75 12.75 6.42893 12.75 8.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.9997 4.75C17.0708 4.75 18.7497 6.42893 18.7497 8.5C18.7497 10.5711 17.0708 12.25 14.9997 12.25C14.975 12.25 14.9504 12.2498 14.9258 12.2493"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.75 19.25V17.765C2.75 16.0999 4.09315 14.75 5.75 14.75H12C13.6569 14.75 15 16.0999 15 17.765V19.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21.25 19.25V17.765C21.25 16.0999 19.9069 14.75 18.25 14.75H17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const WizardHatIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M2.75 20.25L21.25 20.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.75 19.7499L10.7628 3.99207C11.3122 2.55237 13.2148 2.24862 14.1851 3.44572L18.2143 8.41655H14.2786L19.25 19.7499"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="round"
    />
    <path
      d="M12.8594 15.1523C12.9598 15.3674 13.1326 15.5402 13.3477 15.6406L13.582 15.75L13.3477 15.8594C13.1326 15.9598 12.9598 16.1326 12.8594 16.3477L12.75 16.582L12.6406 16.3477L12.5996 16.2695C12.4963 16.0909 12.3406 15.9473 12.1523 15.8594L11.917 15.75L12.1523 15.6406C12.3674 15.5402 12.5402 15.3674 12.6406 15.1523L12.75 14.917L12.8594 15.1523Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M9.85938 11.1523C9.95975 11.3674 10.1326 11.5402 10.3477 11.6406L10.582 11.75L10.3477 11.8594C10.1326 11.9598 9.95975 12.1326 9.85938 12.3477L9.75 12.582L9.64062 12.3477L9.59961 12.2695C9.49634 12.0909 9.34062 11.9473 9.15234 11.8594L8.91699 11.75L9.15234 11.6406C9.36738 11.5402 9.54025 11.3674 9.64062 11.1523L9.75 10.917L9.85938 11.1523Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
)

export const BookIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M19.25 12V14.75C19.25 15.8546 18.3546 16.75 17.25 16.75H7C5.75736 16.75 4.75 17.7574 4.75 19C4.75 20.2426 5.75736 21.25 7 21.25H10M8.75 7H15.25M8.75 11H12.25M6.75 2.75H17.25C18.3546 2.75 19.25 3.64543 19.25 4.75V19.25C19.25 20.3546 18.3546 21.25 17.25 21.25H6.75C5.64543 21.25 4.75 20.3546 4.75 19.25V4.75C4.75 3.64543 5.64543 2.75 6.75 2.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const GhostIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M4.75 9.94444V20.2023C4.75 20.9864 5.61121 21.4655 6.27736 21.052L7.44088 20.3298C8.02258 19.9687 8.74854 19.9303 9.3651 20.228L11.1305 21.0802C11.6798 21.3454 12.3202 21.3454 12.8695 21.0802L14.6349 20.228C15.2515 19.9303 15.9774 19.9687 16.5591 20.3298L17.7226 21.052C18.3888 21.4655 19.25 20.9864 19.25 20.2023V9.94444C19.25 5.97106 16.0041 2.75 12 2.75C7.99594 2.75 4.75 5.97106 4.75 9.94444Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M10.25 10.5C10.25 10.9142 9.91421 11.25 9.5 11.25C9.08579 11.25 8.75 10.9142 8.75 10.5C8.75 10.0858 9.08579 9.75 9.5 9.75C9.91421 9.75 10.25 10.0858 10.25 10.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M15.25 10.5C15.25 10.9142 14.9142 11.25 14.5 11.25C14.0858 11.25 13.75 10.9142 13.75 10.5C13.75 10.0858 14.0858 9.75 14.5 9.75C14.9142 9.75 15.25 10.0858 15.25 10.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
)

export const AudioIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M9.75 18.7501C9.75 20.1308 8.40685 21.2501 6.75 21.2501C5.09315 21.2501 3.75 20.1308 3.75 18.7501C3.75 17.3693 5.09315 16.2501 6.75 16.2501C8.40685 16.2501 9.75 17.3693 9.75 18.7501ZM9.75 18.7501V7.25874C9.75 6.36574 10.342 5.58095 11.2007 5.33567L17.7029 3.47828C18.9805 3.11333 20.2522 4.07265 20.2522 5.40136V15.7501M20.2522 15.7501C20.2522 17.1308 18.9091 18.2501 17.2522 18.2501C15.5953 18.2501 14.2522 17.1308 14.2522 15.7501C14.2522 14.3693 15.5953 13.2501 17.2522 13.2501C18.9091 13.2501 20.2522 14.3693 20.2522 15.7501Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const QuestionIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 13.25C12 11.0682 14.2499 11.3344 14.25 9.3158C14.2501 6.64348 10.2339 6.6432 9.75 8.85662"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="16.5" r="1" fill="currentColor" />
  </svg>
)

export const HeartOutlineIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M21.25 9.9375C21.25 15.8672 12.7708 20.25 12 20.25C11.2292 20.25 2.75 15.8672 2.75 9.9375C2.75 5.8125 5.31944 3.75 7.88889 3.75C10.4583 3.75 12 5.29688 12 5.29688C12 5.29688 13.5417 3.75 16.1111 3.75C18.6806 3.75 21.25 5.8125 21.25 9.9375Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const RocketIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M2.75 20.25C2.75 20.8023 3.19771 21.25 3.75 21.25H4.80556C5.94081 21.25 6.86111 20.3297 6.86111 19.1945C6.86111 18.0592 5.94081 17.1389 4.80556 17.1389C3.6703 17.1389 2.75 18.0592 2.75 19.1945V20.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M6.4469 13.25H4.93454C4.17548 13.25 3.69317 12.4375 4.05665 11.7711L5.68148 8.7923C6.03194 8.14977 6.70538 7.75 7.43727 7.75H10.7893C11.0696 7.75 11.3364 7.63145 11.5293 7.42807C14.039 4.78199 16.7697 3.06408 20.2504 2.78892C20.801 2.7454 21.2546 3.199 21.2111 3.74957C20.9359 7.23025 19.218 9.961 16.5719 12.4707C16.3685 12.6636 16.25 12.9304 16.25 13.2107V16.5627C16.25 17.2946 15.8502 17.9681 15.2077 18.3185L12.2289 19.9434C11.5625 20.3068 10.75 19.8245 10.75 19.0655V17.5531C10.75 17.2879 10.6446 17.0335 10.4571 16.846L7.154 13.5429C6.96647 13.3554 6.71211 13.25 6.4469 13.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M6.85938 13.25L11.2274 7.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M16.25 12.7709L10.75 17.1389"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const EyeOpenIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M21.5298 11.1188C16.6909 2.62714 7.30917 2.62704 2.47032 11.1187C2.15898 11.665 2.15898 12.3348 2.47032 12.8811C7.30917 21.3728 16.6909 21.3729 21.5298 12.8812C21.8411 12.3349 21.8411 11.6652 21.5298 11.1188Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.25 12C15.25 13.7949 13.7949 15.25 12 15.25C10.2051 15.25 8.75 13.7949 8.75 12C8.75 10.2051 10.2051 8.75 12 8.75C13.7949 8.75 15.25 10.2051 15.25 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ParachuteIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M9.75 18.75C9.75 17.6454 10.6454 16.75 11.75 16.75H12.25C13.3546 16.75 14.25 17.6454 14.25 18.75V19.25C14.25 20.3546 13.3546 21.25 12.25 21.25H11.75C10.6454 21.25 9.75 20.3546 9.75 19.25V18.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12.75C2 7.22715 6.47715 2.75 12 2.75C17.5228 2.75 22 7.22715 22 12.75C18.5666 10.3797 15.2833 9.19449 12 9.19449C8.7167 9.19449 5.4334 10.3797 2 12.75ZM2 12.75L9.30322 18.1057"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21.9985 12.75L14.6953 18.1057"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 9.19458V16.7501"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const SunHighIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.7123 8.28769C17.7626 10.3379 17.7626 13.6621 15.7123 15.7123C13.6621 17.7626 10.3379 17.7626 8.28769 15.7123C6.23744 13.6621 6.23744 10.3379 8.28769 8.28769C10.3379 6.23744 13.6621 6.23744 15.7123 8.28769Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 3.25V0.75M12 23.25V20.75M20.75 12H23.25M0.75 12H3.25M5.81282 5.81282L4.04505 4.04505M19.955 19.955L18.1872 18.1872M18.1872 5.81282L19.955 4.04506M4.04506 19.955L5.81282 18.1872"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const RockingHorseIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M2.75 12.25C2.75 10.5931 4.09315 9.25 5.75 9.25H11.9932C13.9021 4.25604 14.8022 2.88144 18.4214 2.75924C18.778 2.7472 19.1101 2.94015 19.2889 3.24896L21.3597 6.82589C21.5892 7.22227 21.5201 7.72388 21.1919 8.0434L20.713 8.50975C20.4109 8.8039 19.9567 8.87696 19.5776 8.69239L18.1554 8L17 10L19.5 19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 9.5L4.5 19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 20L9.72854 15.3201C9.89437 14.9718 10.2457 14.75 10.6314 14.75H13.3686C13.7543 14.75 14.1056 14.9718 14.2715 15.3201L16.5 20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.75 18C8.88423 22.3333 15.1158 22.3333 21.25 18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const TelevisionIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M2.75 5.75C2.75 4.64543 3.64543 3.75 4.75 3.75H19.25C20.3546 3.75 21.25 4.64543 21.25 5.75V14.25C21.25 15.3546 20.3546 16.25 19.25 16.25H4.75C3.64543 16.25 2.75 15.3546 2.75 14.25V5.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 20.25C16.114 19.6013 14.0967 19.25 12 19.25C9.90334 19.25 7.88601 19.6013 6 20.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const CourtIcon = (props: IconProps): React.JSX.Element => (
  <svg {...base} {...props}>
    <path
      d="M19.25 9.24998H4.75C4.19772 9.24998 3.75 8.80227 3.75 8.24998V6.22074C3.75 5.79031 4.02543 5.40817 4.43377 5.27206L11.6838 2.85539C11.889 2.78697 12.111 2.78697 12.3162 2.85539L19.5662 5.27206C19.9746 5.40817 20.25 5.79031 20.25 6.22074V8.24998C20.25 8.80227 19.8023 9.24998 19.25 9.24998Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
    <path d="M3.75 20.25H20.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M6 17.75L6 9.25M10 17.75L10 9.25M14 17.75L14 9.25M18 17.75V9.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

type IconCmp = (props: IconProps) => React.JSX.Element

const GENRE_ICONS: Record<number, IconCmp> = {
  28: SwordIcon,
  12: CompassRoundIcon,
  16: SparkleIcon,
  35: LolIcon,
  80: MagnifierIcon,
  99: VideoIcon,
  18: CurtainIcon,
  10751: PeopleGroupIcon,
  14: WizardHatIcon,
  36: BookIcon,
  27: GhostIcon,
  10402: AudioIcon,
  9648: QuestionIcon,
  10749: HeartOutlineIcon,
  878: RocketIcon,
  53: EyeOpenIcon,
  10752: ParachuteIcon,
  37: SunHighIcon,
  10759: SwordIcon,
  10762: RockingHorseIcon,
  10764: TelevisionIcon,
  10765: WizardHatIcon,
  10768: CourtIcon
}

export function genreIcon(id: number): IconCmp | undefined {
  return GENRE_ICONS[id]
}
