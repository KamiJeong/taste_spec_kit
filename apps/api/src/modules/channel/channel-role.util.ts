export type ChannelRole = "owner" | "manager" | "member";

export function canReviewJoinRequests(role: ChannelRole): boolean {
  return role === "owner" || role === "manager";
}

export function canManageManager(actorRole: ChannelRole, targetRole: ChannelRole): boolean {
  return actorRole === "owner" && targetRole !== "owner";
}

export function canKickTarget(actorRole: ChannelRole, targetRole: ChannelRole): boolean {
  if (targetRole === "owner") return false;
  if (actorRole === "owner") return targetRole === "manager" || targetRole === "member";
  if (actorRole === "manager") return targetRole === "member";
  return false;
}

export function canQuit(role: ChannelRole): boolean {
  return role !== "owner";
}

export function canTransferOwnership(actorRole: ChannelRole, targetRole: ChannelRole): boolean {
  return actorRole === "owner" && targetRole !== "owner";
}
