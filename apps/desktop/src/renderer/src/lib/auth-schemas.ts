import { z } from 'zod'

export const signInSchema = z.object({
  email: z.email({ message: 'Enter a valid email' }),
  password: z.string().min(1, { message: 'Password is required' })
})

export const signUpSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.email({ message: 'Enter a valid email' }),
  password: z
    .string()
    .min(8, { message: 'At least 8 characters' })
    .regex(/[0-9]/, { message: 'Must contain a number' })
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
