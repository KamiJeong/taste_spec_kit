import { AuthShell } from "@/features/auth/ui/auth-shell"
import { ForgotPasswordFormView } from "@/features/auth/ui/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recover access"
      subtitle="We will send a reset link if your account exists."
    >
      <ForgotPasswordFormView />
    </AuthShell>
  )
}
