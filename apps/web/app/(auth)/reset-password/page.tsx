import { AuthShell } from "@/features/auth/ui/auth-shell"
import { ResetPasswordFormView } from "@/features/auth/ui/reset-password-form"

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams

  return (
    <AuthShell title="Set a new password" subtitle="Use the token from your reset email.">
      <ResetPasswordFormView token={params.token} />
    </AuthShell>
  )
}
