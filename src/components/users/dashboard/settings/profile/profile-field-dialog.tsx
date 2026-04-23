"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  updateDashboardProfileAction,
  type DashboardProfileField,
  type DashboardProfileUpdateInput,
} from "@/actions/server/users/dashboard/settings/profile";
import type { UserDashboardProfile } from "@/actions/server/users/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const namePattern = /[^A-Za-zÀ-ÿ' -]/g;
const trainingTypes = ["Musculacion", "Cardio", "Mixto", "No_entrena"] as const;

function sanitizeName(value: string) {
  return value.replace(namePattern, "");
}

function kgToLb(value: number) {
  return Number((value * 2.20462).toFixed(1));
}

function lbToKg(value: number) {
  return Number((value / 2.20462).toFixed(1));
}

function cmToFeetInches(value: number) {
  const totalInches = value / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches };
}

function feetInchesToCm(feet: string, inches: string) {
  const totalInches = Number(feet || 0) * 12 + Number(inches || 0);
  return Number((totalInches * 2.54).toFixed(1));
}

function getFieldTitle(field: DashboardProfileField) {
  return {
    nombre: "Nombre",
    apellido: "Apellido(s)",
    sexo: "Sexo",
    fechaNacimiento: "Cumpleaños",
    alturaCm: "Altura",
    pesoKg: "Peso",
    tipoEntrenamiento: "Tipo de entrenamiento",
    frecuenciaEntreno: "Frecuencia",
    anosEntrenando: "Años entrenando",
  }[field];
}

type ProfileFieldDialogProps = {
  profile: UserDashboardProfile;
  field: DashboardProfileField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileFieldDialog({ profile, field, open, onOpenChange }: ProfileFieldDialogProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [unit, setUnit] = useState<"cm" | "ft" | "kg" | "lb">("cm");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !field) {
      return;
    }

    setError("");

    switch (field) {
      case "nombre":
        setText(profile.nombre);
        break;
      case "apellido":
        setText(profile.apellido);
        break;
      case "sexo":
        setText(profile.sexo);
        break;
      case "fechaNacimiento":
        setText(profile.birthDateIso.slice(0, 10));
        break;
      case "alturaCm": {
        const height = profile.alturaCm ?? 0;
        const nextHeight = cmToFeetInches(height);
        setUnit("cm");
        setText(height ? String(Math.round(height)) : "");
        setFeet(String(nextHeight.feet));
        setInches(String(nextHeight.inches));
        break;
      }
      case "pesoKg":
        setUnit("lb");
        setText(profile.pesoKg ? String(kgToLb(profile.pesoKg)) : "");
        break;
      case "tipoEntrenamiento":
        setText(profile.tipoEntrenamiento ?? "Musculacion");
        break;
      case "frecuenciaEntreno":
        setText(profile.frecuenciaEntreno ? String(profile.frecuenciaEntreno) : "0");
        break;
      case "anosEntrenando":
        setText(profile.anosEntrenando ? String(profile.anosEntrenando) : "0");
        break;
    }
  }, [field, open, profile]);

  function buildPayload(): DashboardProfileUpdateInput | null {
    if (!field) {
      return null;
    }

    if (field === "nombre" || field === "apellido") {
      const value = sanitizeName(text).trim();
      return value ? { field, value } : null;
    }

    if (field === "sexo") {
      return text === "Masculino" || text === "Femenino" ? { field, value: text } : null;
    }

    if (field === "fechaNacimiento") {
      return text ? { field, value: text } : null;
    }

    if (field === "alturaCm") {
      if (unit === "cm") {
        const value = Number(text);
        return Number.isFinite(value) ? { field, value: Number(value.toFixed(1)) } : null;
      }

      const value = feetInchesToCm(feet, inches);
      return Number.isFinite(value) ? { field, value } : null;
    }

    if (field === "pesoKg") {
      const parsed = Number(text);
      if (!Number.isFinite(parsed)) {
        return null;
      }

      return { field, value: unit === "kg" ? Number(parsed.toFixed(1)) : lbToKg(parsed) };
    }

    if (field === "tipoEntrenamiento") {
      return trainingTypes.includes(text as (typeof trainingTypes)[number])
        ? { field, value: text as (typeof trainingTypes)[number] }
        : null;
    }

    if (field === "frecuenciaEntreno" || field === "anosEntrenando") {
      const value = Number(text);
      return Number.isFinite(value) ? { field, value } : null;
    }

    return null;
  }

  function handleSave() {
    const payload = buildPayload();

    if (!payload) {
      setError("Revisa el valor ingresado.");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await updateDashboardProfileAction(payload);

      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open && !!field} onOpenChange={(nextOpen) => !nextOpen && onOpenChange(false)}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !z-[100] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-transparent !p-0 !shadow-none"
      >
        {field ? (
          <div className="relative flex h-full w-full items-center justify-center p-4">
            <button
              type="button"
              aria-label="Cerrar modal de perfil"
              className="absolute inset-0 cursor-default bg-slate-950/88 backdrop-blur-md"
              onClick={() => onOpenChange(false)}
            />

            <div className="relative z-[110] w-[calc(100vw-1rem)] max-w-sm rounded-[1.5rem] border border-white/70 bg-white p-4 shadow-2xl">
              <DialogHeader className="pr-10">
                <DialogTitle className="text-2xl text-slate-950">{getFieldTitle(field)}</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Ajusta este dato con valores limpios y coherentes.
                </DialogDescription>
              </DialogHeader>

              {field === "sexo" ? (
                <RadioGroup value={text} onValueChange={setText} className="grid grid-cols-2 gap-2">
                  {(["Masculino", "Femenino"] as const).map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "cursor-pointer rounded-2xl border px-4 py-3 text-sm font-medium transition",
                        text === option
                          ? "border-teal-300 bg-teal-50 text-slate-950"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={option} className="sr-only" />
                        {option}
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              ) : null}

              {field === "tipoEntrenamiento" ? (
                <Select value={text} onValueChange={(value) => setText(value ?? "")}>
                  <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50/70 px-4">
                    <SelectValue placeholder="Selecciona una opcion" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingTypes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {field === "alturaCm" || field === "pesoKg" ? (
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {(field === "alturaCm" ? ["cm", "ft"] : ["kg", "lb"]).map((nextUnit) => (
                      <button
                        key={nextUnit}
                        type="button"
                        onClick={() => setUnit(nextUnit as typeof unit)}
                        className={cn(
                          "rounded-xl py-2 transition",
                          unit === nextUnit ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                        )}
                      >
                        {nextUnit.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {field === "alturaCm" && unit === "ft" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={feet}
                        onChange={(event) => setFeet(event.target.value.replace(/[^\d]/g, ""))}
                        inputMode="numeric"
                        placeholder="5"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                      />
                      <Input
                        value={inches}
                        onChange={(event) => setInches(event.target.value.replace(/[^\d]/g, ""))}
                        inputMode="numeric"
                        placeholder="8"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                      />
                    </div>
                  ) : (
                    <Input
                      value={text}
                      onChange={(event) => setText(event.target.value.replace(/[^\d.]/g, ""))}
                      inputMode="decimal"
                      placeholder={field === "alturaCm" ? "169" : "202.9"}
                      min={field === "alturaCm" ? (unit === "cm" ? 120 : 80) : unit === "kg" ? 35 : 77}
                      max={field === "alturaCm" ? (unit === "cm" ? 230 : 94) : unit === "kg" ? 250 : 551}
                      step={field === "alturaCm" ? (unit === "cm" ? 0.1 : 1) : 0.1}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                    />
                  )}
                </div>
              ) : null}

              {field === "nombre" || field === "apellido" || field === "fechaNacimiento" || field === "frecuenciaEntreno" || field === "anosEntrenando" ? (
                <Input
                  type={field === "fechaNacimiento" ? "date" : field === "frecuenciaEntreno" || field === "anosEntrenando" ? "number" : "text"}
                  value={text}
                  onChange={(event) => {
                    const nextValue = field === "nombre" || field === "apellido" ? sanitizeName(event.target.value) : event.target.value;
                    setText(nextValue);
                  }}
                  min={field === "fechaNacimiento" ? "1900-01-01" : field === "frecuenciaEntreno" ? 0 : field === "anosEntrenando" ? 0 : undefined}
                  max={field === "fechaNacimiento" ? new Date().toISOString().slice(0, 10) : field === "frecuenciaEntreno" ? 7 : field === "anosEntrenando" ? 60 : undefined}
                  step={field === "frecuenciaEntreno" ? 1 : field === "anosEntrenando" ? 0.5 : undefined}
                  inputMode={field === "frecuenciaEntreno" || field === "anosEntrenando" ? "numeric" : "text"}
                  placeholder={field === "fechaNacimiento" ? "2001-06-29" : field === "frecuenciaEntreno" ? "5" : field === "anosEntrenando" ? "2.5" : undefined}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                />
              ) : null}

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

              <div className="mt-2 flex gap-2">
                <Button type="button" variant="outline" className="h-12 flex-1 rounded-2xl border-slate-200" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-2xl bg-teal-500 text-white hover:bg-teal-600"
                  onClick={handleSave}
                  disabled={isPending}
                >
                  {isPending ? "Guardando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
