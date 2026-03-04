import { z } from "zod";

export const createChannelPostSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(5000)
});

export const listChannelPostsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional()
});

export const updateChannelPostSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    ifUpdatedAt: z.string().datetime({ offset: true })
  })
  .refine((value) => typeof value.title === "string" || typeof value.content === "string", {
    message: "title or content is required",
    path: ["title"]
  });

export type CreateChannelPostBody = z.infer<typeof createChannelPostSchema>;
export type ListChannelPostsQuery = z.infer<typeof listChannelPostsQuerySchema>;
export type UpdateChannelPostBody = z.infer<typeof updateChannelPostSchema>;
