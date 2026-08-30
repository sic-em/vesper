import { z } from 'zod'

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name required')
  .max(40, 'Max 40 characters')

export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9_]{3,24}$/, '3–24 chars: lowercase, digits, underscore')

export const bioSchema = z.string().trim().max(180, 'Max 180 characters')

export type DisplayNameValue = z.infer<typeof displayNameSchema>
export type UsernameValue = z.infer<typeof usernameSchema>
export type BioValue = z.infer<typeof bioSchema>

export const BIO_MAX = 180
