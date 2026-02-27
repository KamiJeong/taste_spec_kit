import { AuthShell } from "@/features/auth/ui/auth-shell"
import { LoginFormView } from "@/features/auth/ui/login-form"

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue working with secure session control."
    >
      <LoginFormView />
    </AuthShell>
  )
}
