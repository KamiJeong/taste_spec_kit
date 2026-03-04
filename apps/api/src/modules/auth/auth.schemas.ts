import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(100).nullable().optional()
});

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1)
});

export const emailBodySchema = z.object({
  email: z.string().trim().pipe(z.email())
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1)
});

export type SignupBody = z.infer<typeof signupSchema>;
export type EmailBody = z.infer<typeof emailBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
