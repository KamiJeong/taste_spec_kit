import { failure } from "./http-contract";

export function fail(
  code: string,
  details: unknown = null,
  meta: Record<string, unknown> = {}
) {
  return failure(code, code, details, meta);
}
