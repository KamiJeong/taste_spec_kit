type ErrorMeta = {
  title: string
  description: string
}

const AUTH_ERROR_CODES = [
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_EMAIL_NOT_VERIFIED",
  "AUTH_ACCOUNT_LOCKED",
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_INVALID",
  "AUTH_SESSION_REQUIRED",
  "AUTH_CSRF_INVALID",
  "USER_EMAIL_ALREADY_EXISTS",
  "USER_ACCOUNT_DEACTIVATED",
  "AUTH_REQUEST_COOLDOWN",
  "RATE_LIMIT_EXCEEDED",
  "VALIDATION_ERROR",
  "INTERNAL_SERVER_ERROR",
] as const

type ErrorCode = (typeof AUTH_ERROR_CODES)[number]

const DEFAULT_ERROR: ErrorMeta = {
  title: "Request failed",
  description: "Please try again in a moment.",
}

const ERROR_MAP: Partial<Record<ErrorCode, ErrorMeta>> = {
  AUTH_INVALID_CREDENTIALS: {
    title: "Invalid credentials",
    description: "Email or password is incorrect.",
  },
  AUTH_EMAIL_NOT_VERIFIED: {
    title: "Email not verified",
    description: "Please verify your email before logging in.",
  },
  AUTH_ACCOUNT_LOCKED: {
    title: "Account locked",
    description: "Too many failed attempts. Wait and try again.",
  },
  AUTH_TOKEN_EXPIRED: {
    title: "Token expired",
    description: "Request a new link and try again.",
  },
  AUTH_TOKEN_INVALID: {
    title: "Invalid token",
    description: "This link is not valid. Request a new link.",
  },
  AUTH_REQUEST_COOLDOWN: {
    title: "Please wait",
    description: "You requested too recently. Try again after cooldown.",
  },
  RATE_LIMIT_EXCEEDED: {
    title: "Rate limited",
    description: "Too many requests. Please slow down.",
  },
  USER_EMAIL_ALREADY_EXISTS: {
    title: "Email already exists",
    description: "Try logging in or use another email.",
  },
  USER_ACCOUNT_DEACTIVATED: {
    title: "Account deactivated",
    description: "Contact support if you need recovery.",
  },
  VALIDATION_ERROR: {
    title: "Validation failed",
    description: "Check your input fields and try again.",
  },
}

export function getAuthErrorMeta(code?: string): ErrorMeta {
  if (!code) {
    return DEFAULT_ERROR
  }
  return (ERROR_MAP[code as ErrorCode] ?? DEFAULT_ERROR) as ErrorMeta
}
