// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SignInFn = (
  this: void,
  provider: string,
  params?: any
) => Promise<{
  signingIn: boolean
  redirect?: URL
}>

const NAVIGATOR_PRODUCT = 'product'

function suppressInWindowNavigation(): () => void {
  const desc = Object.getOwnPropertyDescriptor(Navigator.prototype, NAVIGATOR_PRODUCT)
  Object.defineProperty(navigator, NAVIGATOR_PRODUCT, {
    value: 'ReactNative',
    configurable: true
  })
  return () => {
    if (desc) Object.defineProperty(navigator, NAVIGATOR_PRODUCT, desc)
    else delete (navigator as unknown as Record<string, unknown>)[NAVIGATOR_PRODUCT]
  }
}

export async function signInWithDiscord(signIn: SignInFn): Promise<void> {
  const restore = suppressInWindowNavigation()
  try {
    const result = await signIn('discord', { redirectTo: 'vesper://auth' })
    if (result.redirect) {
      window.open(result.redirect.toString(), '_blank', 'noopener,noreferrer')
    }
  } finally {
    restore()
  }
}
