import { AuthShell } from "@/features/auth/ui/auth-shell"
import { SignupFormView } from "@/features/auth/ui/signup-form"

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start with email auth and verify in one flow.">
      <SignupFormView />
    </AuthShell>
  )
}
