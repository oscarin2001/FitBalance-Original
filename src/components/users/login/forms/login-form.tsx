"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState, useTransition } from "react"
import { FcGoogle } from "react-icons/fc"

import { registerWithEmailAction } from "@/actions/server/users/auth/actions/email-auth-actions"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

type FormMode = "login" | "register"
type LoginField = "nombre" | "apellido" | "email" | "password"
type LoginFieldErrors = Partial<Record<LoginField, string>>
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/

type FeedbackState =
  | {
      tone: "success" | "error"
      message: string
      devVerificationUrl?: string
    }
  | undefined

export function LoginForm({
  initialMode = "login",
  className,
  ...props
}: React.ComponentProps<"form"> & { initialMode?: FormMode }) {
  const router = useRouter()
  const mode = initialMode
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [feedback, setFeedback] = useState<FeedbackState>()
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [isPending, startTransition] = useTransition()

  function sanitizeNameValue(value: string) {
    return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]/g, "")
  }

  function handleGoogleSignIn() {
    console.log("[Auth][Google] click sign-in", {
      callbackUrl: "/users/onboarding",
      mode,
      email,
    })
    setFeedback(undefined)

    startTransition(async () => {
      console.log("[Auth][Google] calling next-auth signIn")
      const result = await signIn("google", { callbackUrl: "/users/onboarding" })
      console.log("[Auth][Google] signIn resolved", result)
    })
  }

  function clearFieldError(field: LoginField) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleEmailSubmit() {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedNombre = nombre.trim()
    const normalizedApellido = apellido.trim()
    const nextErrors: LoginFieldErrors = {}

    if (mode === "register" && !normalizedNombre) {
      nextErrors.nombre = "Ingresa tu nombre."
    } else if (mode === "register" && !NAME_PATTERN.test(normalizedNombre)) {
      nextErrors.nombre = "Solo se permiten letras."
    }

    if (mode === "register" && !normalizedApellido) {
      nextErrors.apellido = "Ingresa tu apellido."
    } else if (mode === "register" && !NAME_PATTERN.test(normalizedApellido)) {
      nextErrors.apellido = "Solo se permiten letras."
    }

    if (!normalizedEmail) {
      nextErrors.email = "Ingresa tu email."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Ingresa un email valido."
    }

    if (!password) {
      nextErrors.password = "Ingresa tu contrasena."
    } else if (password.length < 8) {
      nextErrors.password = "Debe tener minimo 8 caracteres."
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    setFeedback(undefined)

    startTransition(async () => {
      if (mode === "login") {
        const signInResult = await signIn("credentials", {
          email: normalizedEmail,
          password,
          callbackUrl: "/users/onboarding",
          redirect: false,
        })

        if (signInResult?.error) {
          setFeedback({
            tone: "error",
            message: "Credenciales invalidas o correo no verificado.",
          })
          return
        }

        router.push("/users/onboarding")
        router.refresh()
        return
      }

      const registerResult = await registerWithEmailAction({
        nombre: normalizedNombre,
        apellido: normalizedApellido,
        email: normalizedEmail,
        password,
      })

      if (!registerResult.ok) {
        setFeedback({
          tone: "error",
          message: registerResult.error ?? "No se pudo completar el registro.",
        })
        return
      }

      setPassword("")
      setFeedback({
        tone: "success",
        message:
          registerResult.message ?? "Registro exitoso. Revisa tu correo para verificar la cuenta.",
        devVerificationUrl: registerResult.devVerificationUrl,
      })
    })
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup className="gap-6">
        <div className="flex flex-col gap-2 pb-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {mode === "login" ? "Ingresar" : "Crear cuenta"}
          </h1>
        </div>

        {mode === "register" ? (
          <Field className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
              <FieldError>{fieldErrors.nombre}</FieldError>
              <Input
                id="nombre"
                placeholder="Oscar"
                value={nombre}
                onChange={(event) => {
                  setNombre(sanitizeNameValue(event.target.value))
                  clearFieldError("nombre")
                }}
                disabled={isPending}
                aria-invalid={!!fieldErrors.nombre}
                autoComplete="given-name"
                inputMode="text"
              />
            </div>
            <div>
              <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
              <FieldError>{fieldErrors.apellido}</FieldError>
              <Input
                id="apellido"
                placeholder="Perez"
                value={apellido}
                onChange={(event) => {
                  setApellido(sanitizeNameValue(event.target.value))
                  clearFieldError("apellido")
                }}
                disabled={isPending}
                aria-invalid={!!fieldErrors.apellido}
                autoComplete="family-name"
                inputMode="text"
              />
            </div>
          </Field>
        ) : null}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <FieldError>{fieldErrors.email}</FieldError>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              clearFieldError("email")
            }}
            disabled={isPending}
            aria-invalid={!!fieldErrors.email}
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Contrasena</FieldLabel>
            <span className="ml-auto text-xs text-muted-foreground">Minimo 8 caracteres</span>
          </div>
          <FieldError>{fieldErrors.password}</FieldError>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              clearFieldError("password")
            }}
            disabled={isPending}
            aria-invalid={!!fieldErrors.password}
          />
        </Field>

        <Field>
          <Button
            type="button"
            onClick={handleEmailSubmit}
            disabled={isPending}
            className="h-11 rounded-2xl bg-emerald-500 text-white shadow-[0_18px_30px_-20px_rgba(16,185,129,0.95)] hover:bg-emerald-600"
          >
            {mode === "login"
              ? isPending
                ? "Ingresando..."
                : "Ingresar"
              : isPending
                ? "Creando cuenta..."
                : "Crear cuenta"}
          </Button>
          <FieldDescription>
            {mode === "login"
              ? "Usa tu correo y contrasena para entrar a tu cuenta."
              : "Te enviaremos un correo para activar la cuenta antes del primer login."}
          </FieldDescription>
        </Field>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            o con Google
          </span>
          <Separator className="flex-1" />
        </div>

        <Field className="gap-3 pt-6">
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isPending}
            className="h-11 w-full rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
          >
            <FcGoogle className="size-5" />
            {isPending ? "Conectando con Google..." : "Ingresar con Google"}
          </Button>
        </Field>

        <p className="text-center text-sm leading-6 text-muted-foreground">
          {mode === "login" ? "Si no tienes cuenta, " : "Si ya tienes cuenta, "}
          <Link
            href={mode === "login" ? "/users/register" : "/users/login"}
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-emerald-600"
            onClick={() => {
              setFeedback(undefined)
              setFieldErrors({})
            }}
          >
            {mode === "login" ? "registrate aqui" : "entra aqui"}
          </Link>
        </p>

        {feedback ? (
          <Alert variant={feedback.tone === "error" ? "destructive" : "default"}>
            {feedback.tone === "success" ? <AlertTitle>Listo</AlertTitle> : null}
            <AlertDescription>
              {feedback.message}
              {feedback.devVerificationUrl ? (
                <span className="mt-2 block">
                  Link temporal: <a href={feedback.devVerificationUrl}>verificar ahora</a>
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

      </FieldGroup>
    </form>
  )
}
