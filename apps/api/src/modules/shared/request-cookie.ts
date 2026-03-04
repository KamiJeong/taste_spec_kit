import type { Request } from "express";

export function cookieOf(req: Request, key: string): string | undefined {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === key) return decodeURIComponent(v || "");
  }
  return undefined;
}
