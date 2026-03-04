import { z } from "zod";

export const patchProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().pipe(z.email()).optional()
  })
  .refine((value) => typeof value.name !== "undefined" || typeof value.email !== "undefined", {
    message: "at least one field must be provided"
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export const passwordBodySchema = z.object({
  password: z.string().min(1)
});

export type PatchProfileBody = z.infer<typeof patchProfileSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
export type PasswordBody = z.infer<typeof passwordBodySchema>;
