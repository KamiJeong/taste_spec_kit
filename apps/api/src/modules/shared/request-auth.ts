import type { Request } from "express";

export interface RequestAuth {
  sid?: string;
  userId?: string;
}

type RequestWithAuth = Request & {
  auth?: RequestAuth;
};

export function setRequestAuth(req: Request, auth: RequestAuth): void {
  (req as RequestWithAuth).auth = auth;
}

export function requestAuthOf(req: Request): RequestAuth {
  return (req as RequestWithAuth).auth ?? {};
}
