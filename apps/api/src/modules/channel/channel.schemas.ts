import { z } from "zod";

export const createChannelSchema = z.object({
  name: z.string().trim().min(1).max(100)
});

export const addManagerSchema = z.object({
  userId: z.string().min(1)
});

export const kickMemberSchema = z.object({
  userId: z.string().min(1)
});

export const transferOwnershipSchema = z.object({
  targetUserId: z.string().min(1),
  previousOwnerRole: z.enum(["manager", "member"]).default("manager")
});

const nonEmptyStringArray = z.array(z.string().min(1)).min(1);

export const reorderChannelsSchema = z.object({
  channelIds: nonEmptyStringArray.refine((value) => new Set(value).size === value.length, {
    message: "duplicate channelIds are not allowed"
  })
});

export type CreateChannelBody = z.infer<typeof createChannelSchema>;
export type AddManagerBody = z.infer<typeof addManagerSchema>;
export type KickMemberBody = z.infer<typeof kickMemberSchema>;
export type TransferOwnershipBody = z.infer<typeof transferOwnershipSchema>;
export type ReorderChannelsBody = z.infer<typeof reorderChannelsSchema>;
