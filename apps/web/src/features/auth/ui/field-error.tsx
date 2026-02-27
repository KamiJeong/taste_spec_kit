type FieldErrorProps = {
  id?: string
  message?: string
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null
  }

  return (
    <p id={id} role="alert" aria-live="polite" className="text-sm text-destructive">
      {message}
    </p>
  )
}
