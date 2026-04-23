"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { KeyRound, Mail, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";

import {
  deleteAccountAction,
  resetAccountAction,
  updateAccountEmailAction,
  updateAccountPasswordAction,
  type DashboardAccountActionMode,
} from "@/actions/server/users/dashboard/settings/account";
import type { UserDashboardProfile } from "@/actions/server/users/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { SettingsScreenHeader } from "../shared/settings-screen-header";

type DashboardAccountDialogProps = {
  open: boolean;
  profile: UserDashboardProfile | null;
  email?: string;
  onOpenChange: (open: boolean) => void;
};

type AccountActionDialogProps = {
  open: boolean;
  mode: DashboardAccountActionMode | null;
  targetEmail: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: (mode: DashboardAccountActionMode) => void;
};

function getDisplayName(profile: UserDashboardProfile | null) {
  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(" ").trim();

  return fullName || profile?.nombre || "Usuario";
}

function buildUsernameLabel(displayName: string, email: string) {
  const shortName = displayName.trim();

  if (shortName) {
    return shortName;
  }

  return email.split("@")[0] || "usuario";
}

function normalizeEmail(value?: string | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function ActionIcon({ mode }: { mode: DashboardAccountActionMode }) {
  if (mode === "email") {
    return <Mail className="size-5" />;
  }

  if (mode === "password") {
    return <KeyRound className="size-5" />;
  }

  if (mode === "reset") {
    return <RefreshCcw className="size-5" />;
  }

  return <Trash2 className="size-5" />;
}

function actionTheme(mode: DashboardAccountActionMode) {
  if (mode === "email") {
    return {
      accent: "from-teal-500 via-emerald-500 to-cyan-500",
      panel: "bg-teal-50 text-teal-700",
      title: "Actualizar correo",
      description: "Te pediremos tu contrasena actual y luego te enviaremos una verificacion al nuevo correo.",
    };
  }

  if (mode === "password") {
    return {
      accent: "from-sky-500 via-cyan-500 to-teal-500",
      panel: "bg-sky-50 text-sky-700",
      title: "Cambiar contrasena",
      description: "Usa una contrasena fuerte que no repitas en otros servicios.",
    };
  }

  if (mode === "reset") {
    return {
      accent: "from-amber-500 via-orange-500 to-red-500",
      panel: "bg-amber-50 text-amber-700",
      title: "Restablecer cuenta",
      description: "Esto limpiara tu progreso, planes y datos de onboarding para empezar de nuevo.",
    };
  }

  return {
    accent: "from-rose-500 via-red-500 to-orange-500",
    panel: "bg-rose-50 text-rose-700",
    title: "Eliminar cuenta",
    description: "Se borrara tu cuenta y todo tu historial vinculado. Esta accion no se puede deshacer.",
  };
}

function AccountActionDialog({ open, mode, targetEmail, onOpenChange, onSuccess }: AccountActionDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !mode) {
      return;
    }

    setError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setConfirmation("");
  }, [mode, open, targetEmail]);

  useEffect(() => {
    if (!open || !mode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, onOpenChange, open]);

  if (!mode) {
    return null;
  }

  const theme = actionTheme(mode);
  const confirmButtonClassName =
    mode === "delete"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "bg-teal-500 text-white hover:bg-teal-600";

  function handleSave() {
    if (!mode) {
      return;
    }

    setError("");

    startTransition(async () => {
      let result;

      if (mode === "email") {
        result = await updateAccountEmailAction({ email: targetEmail, currentPassword });
      } else if (mode === "password") {
        result = await updateAccountPasswordAction({ currentPassword, newPassword, confirmPassword });
      } else if (mode === "reset") {
        result = await resetAccountAction({ confirmation });
      } else {
        result = await deleteAccountAction({ currentPassword, confirmation });
      }

      if (!result.ok) {
        setError(result.error ?? "No se pudo completar la accion.");
        return;
      }

      onOpenChange(false);
      onSuccess(mode);
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal de cuenta"
        className="absolute inset-0 cursor-default bg-slate-950/88 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-[100] w-[calc(100vw-1rem)] max-w-sm rounded-[1.5rem] border border-white/70 bg-white p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Ajustes de cuenta</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">{theme.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{theme.description}</p>
          </div>

          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", theme.panel)}>
            <ActionIcon mode={mode} />
          </div>
        </div>

        {mode === "email" ? (
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Nuevo correo</p>
              <p className="mt-1 text-sm font-medium text-slate-950">{targetEmail}</p>
            </div>

            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Contraseña actual"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
            />
          </div>
        ) : null}

        {mode === "password" ? (
          <div className="mt-4 grid gap-3">
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Contraseña actual"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
            />

            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Nueva contraseña"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
            />

            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Repite la nueva contraseña"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
            />
          </div>
        ) : null}

        {mode === "reset" ? (
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Eliminara tus planes y volveras al onboarding. Tu correo y acceso se conservan.
            </div>

            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder='Escribe "RESTABLECER"'
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
            />
          </div>
        ) : null}

        {mode === "delete" ? (
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Esta accion borra por completo tu cuenta y tu historial.
            </div>

            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Contraseña actual"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
            />

            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder='Escribe "ELIMINAR"'
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
            />
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-2xl border-slate-200"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={cn("h-12 flex-1 rounded-2xl", confirmButtonClassName)}
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending
              ? "Guardando..."
              : mode === "email"
                ? "Actualizar"
                : mode === "password"
                  ? "Confirmar"
                  : mode === "reset"
                    ? "Restablecer"
                    : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DashboardAccountDialog({ open, profile, email, onOpenChange }: DashboardAccountDialogProps) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<DashboardAccountActionMode | null>(null);
  const safeEmail = normalizeEmail(email);
  const [emailDraft, setEmailDraft] = useState(safeEmail);

  const displayName = useMemo(() => getDisplayName(profile), [profile]);
  const usernameLabel = useMemo(() => buildUsernameLabel(displayName, safeEmail), [displayName, safeEmail]);
  const normalizedEmail = safeEmail;
  const normalizedDraft = normalizeEmail(emailDraft);

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmailDraft(safeEmail);
  }, [open, safeEmail]);

  function handleActionSuccess(mode: DashboardAccountActionMode) {
    setActiveAction(null);

    if (mode === "email" || mode === "delete") {
      void signOut({ callbackUrl: "/users/login" });
      return;
    }

    if (mode === "reset") {
      router.replace("/users/onboarding");
      return;
    }

    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[100dvh] w-screen max-w-none rounded-none border-0 bg-slate-50 p-0 shadow-none sm:h-[calc(100dvh-2rem)] sm:w-[min(100vw-2rem,36rem)] sm:rounded-[2rem] sm:border sm:border-slate-200/80 sm:shadow-2xl"
      >
        <div className="flex h-full flex-col">
          <SettingsScreenHeader title="Ajustes de cuenta" name={displayName} onBack={() => onOpenChange(false)} />

          <div className="no-scrollbar flex-1 overflow-y-auto p-4">
            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Acceso</p>
                  <p className="text-sm text-slate-500">Gestiona el correo, la contrasena y tu identificador visible.</p>
                </div>
              </div>

              <div className="px-4 py-4">
                <label className="text-sm font-semibold text-slate-950">Dirección de correo electrónico</label>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <Input
                    type="email"
                    value={emailDraft}
                    onChange={(event) => setEmailDraft(event.target.value)}
                    autoComplete="email"
                    className="h-11 flex-1 rounded-xl border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="button"
                    className="h-11 rounded-xl bg-teal-500 px-4 text-sm font-semibold text-white hover:bg-teal-600"
                    onClick={() => setActiveAction("email")}
                    disabled={normalizedDraft === normalizedEmail}
                  >
                    Actualizar
                  </Button>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Cambiar el correo cerrara tu sesion y requerira verificacion.
                </p>
              </div>

              <div className="border-t border-slate-100 px-4 py-4">
                <button
                  type="button"
                  onClick={() => setActiveAction("password")}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-teal-200 hover:bg-teal-50/70"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Contraseña</p>
                    <p className="mt-1 text-xs text-slate-500">Toca para cambiar tu clave de acceso.</p>
                  </div>
                  <span className="font-mono text-sm tracking-[0.2em] text-teal-500">••••••••</span>
                </button>
              </div>

              <div className="border-t border-slate-100 px-4 py-4">
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Nombre de usuario</p>
                    <p className="mt-1 text-xs text-slate-500">Este es el nombre que veras en la cuenta.</p>
                  </div>
                  <span className="max-w-[55%] text-right text-sm font-medium text-teal-600">{usernameLabel}</span>
                </div>
              </div>
            </section>

            <div className="mt-4 grid gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                onClick={() => setActiveAction("reset")}
              >
                Restablecer cuenta
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                onClick={() => setActiveAction("delete")}
              >
                Eliminar cuenta
              </Button>
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-dashed border-teal-200 bg-teal-50/60 px-4 py-3 text-sm leading-6 text-teal-700">
              Restablecer la cuenta te devuelve al onboarding; eliminarla borra todo el historial.
            </div>
          </div>

          <AccountActionDialog
            open={Boolean(activeAction)}
            mode={activeAction}
            targetEmail={emailDraft}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setActiveAction(null);
              }
            }}
            onSuccess={handleActionSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}