export interface ApiMeta {
  serverTime: string;
  [key: string]: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  details: unknown | null;
  meta: ApiMeta;
}

export function success<T>(data: T, meta: Record<string, unknown> = {}): ApiSuccess<T> {
  return {
    success: true,
    data,
    meta: {
      serverTime: new Date().toISOString(),
      ...meta
    }
  };
}

export function failure(
  code: string,
  message: string,
  details: unknown = null,
  meta: Record<string, unknown> = {}
): ApiError {
  return {
    success: false,
    code,
    message,
    details,
    meta: {
      serverTime: new Date().toISOString(),
      ...meta
    }
  };
}
