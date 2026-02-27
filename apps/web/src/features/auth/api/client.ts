import { z } from "zod"

export type ApiSuccess<T> = {
  success: true
  data: T
  meta?: {
    serverTime?: string
    cooldownUntil?: string
  }
}

export type ApiError = {
  success: false
  code: string
  message: string
  details?: unknown
  meta?: {
    serverTime?: string
    cooldownUntil?: string
  }
}

export type ApiResult<T> = ApiSuccess<T> | ApiError

const ApiMetaSchema = z.object({
  serverTime: z.iso.datetime().optional(),
  cooldownUntil: z.iso.datetime().optional(),
})

const ApiSuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: ApiMetaSchema.optional(),
})

const ApiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  code: z.string(),
  message: z.string(),
  details: z.unknown().nullable().optional(),
  meta: ApiMetaSchema.optional(),
})

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!base) {
    return ""
  }
  return base.replace(/\/$/, "")
}

function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") {
    return undefined
  }
  return localStorage.getItem("csrf-token") ?? undefined
}

export async function authRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")

  if ((init?.method ?? "GET") !== "GET") {
    const csrf = getCsrfToken()
    if (csrf) {
      headers.set("x-csrf-token", csrf)
    }
  }

  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      headers,
    })
  } catch {
    return {
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Cannot reach API server. Check backend status and API URL.",
    }
  }

  const contentType = response.headers.get("content-type") ?? ""
  const isJson = contentType.includes("application/json")
  const payload = isJson ? ((await response.json()) as unknown) : null

  if (response.ok) {
    const parsed = ApiSuccessEnvelopeSchema.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected success response shape or non-JSON response",
      }
    }
    return parsed.data as ApiSuccess<T>
  }

  const parsed = ApiErrorEnvelopeSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error response shape or non-JSON response",
    }
  }
  return parsed.data
}
