import type { Metadata } from "next";

import { ensureLoginPageAccess } from "@/actions/server/users/pages";
import { AuthShell } from "@/components/users/auth";
import { LoginForm } from "@/components/users/login";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitBalance",
  },
};

export default async function LoginPage() {
  await ensureLoginPageAccess();

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
