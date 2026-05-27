import { z } from "zod"

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
})

export type LoginValues = z.infer<typeof loginSchema>
