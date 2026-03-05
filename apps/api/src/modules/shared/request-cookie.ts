import type { Request } from "express";

export function cookieOf(req: Request, key: string): string | undefined {
  const raw = req.headers.cookie || "";
  let value: string | undefined;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const k = trimmed.slice(0, index);
    const v = trimmed.slice(index + 1);
    if (k === key) value = decodeURIComponent(v);
  }
  return value;
}
