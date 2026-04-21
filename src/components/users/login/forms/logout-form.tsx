"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutForm({ redirectTo = "/users/login" }: { redirectTo?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut({ callbackUrl: redirectTo });
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={handleSignOut}
      disabled={isPending}
    >
      Cerrar sesion
    </Button>
  );
}

