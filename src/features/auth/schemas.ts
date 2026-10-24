import { z } from "zod"

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."))

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
})

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120, "Keep it under 120 characters."),
  email: emailSchema,
  password: z.string().min(8, "Use at least 8 characters.").max(72, "Use at most 72 characters."),
})

export type LoginInput = z.input<typeof loginSchema>
export type SignupInput = z.input<typeof signupSchema>
