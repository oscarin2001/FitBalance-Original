import { ensureLoginPageAccess } from "@/actions/server/users/pages"
import { AuthShell } from "@/components/users/auth"
import { LoginForm } from "@/components/users/login"

export default async function RegisterPage() {
  await ensureLoginPageAccess()

  return (
    <AuthShell>
      <LoginForm initialMode="register" />
    </AuthShell>
  )
}
