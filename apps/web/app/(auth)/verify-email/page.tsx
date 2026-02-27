import { AuthShell } from "@/features/auth/ui/auth-shell"
import { VerifyEmailView } from "@/features/auth/ui/verify-email-view"

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams

  return (
    <AuthShell title="Verify your email" subtitle="Confirm your account to unlock login.">
      <VerifyEmailView token={params.token} />
    </AuthShell>
  )
}
