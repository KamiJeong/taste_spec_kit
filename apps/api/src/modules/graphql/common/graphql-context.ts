import type { Request } from "express";

export interface GraphqlContext {
  req: Request;
}
