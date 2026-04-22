import { useState } from "react";
import {
  Activity,
  Cake,
  CalendarDays,
  Dumbbell,
  Ruler,
  Scale,
  Target,
  UserRound,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function capitalizeWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toLocaleUpperCase("es-BO") +
        part.slice(1).toLocaleLowerCase("es-BO")
    )
    .join(" ");
}

type SummaryDetailRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function SummaryDetailRow({ icon: Icon, label, value }: SummaryDetailRowProps) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-200/70 py-2 last:border-b-0">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="truncate font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

type SummaryProfileCardProps = {
  fullName: string;
  age: number;
  sex: string;
  heightCm: number | null;
  objective: string;
  activity: string;
  speedTitle: string;
  trainingType: string;
  trainingFrequency: number;
  trainingYears: number;
  weightKg: number;
  targetWeightKg: number;
};

export function SummaryProfileCard({
  fullName,
  age,
  sex,
  heightCm,
  objective,
  activity,
  speedTitle,
  trainingType,
  trainingFrequency,
  trainingYears,
  weightKg,
  targetWeightKg,
}: SummaryProfileCardProps) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Tu perfil</p>
        <p className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
          Ritmo elegido: {speedTitle}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SummaryDetailRow icon={UserRound} label="Nombre completo" value={fullName} />
        </div>
        <SummaryDetailRow icon={Cake} label="Edad" value={`${age} años`} />
        <SummaryDetailRow icon={UserRound} label="Género" value={sex} />
        <SummaryDetailRow
          icon={Ruler}
          label="Altura"
          value={heightCm ? `${heightCm} cm` : "Sin dato"}
        />
        <SummaryDetailRow icon={Target} label="Objetivo" value={objective} />
        <SummaryDetailRow icon={CalendarDays} label="Días de dieta" value="Todos los días" />
      </div>

      <div className="grid gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 sm:grid-cols-2">
        <SummaryDetailRow icon={Activity} label="Movimiento diario" value={activity} />
        <SummaryDetailRow icon={Dumbbell} label="Tipo de entrenamiento" value={trainingType} />
        <SummaryDetailRow icon={Zap} label="Frecuencia" value={`${trainingFrequency} días por semana`} />
        <SummaryDetailRow icon={Scale} label="Años entrenando" value={`${trainingYears} años`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 pt-1">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            <Scale className="size-3.5 text-slate-400" />
            Peso actual
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{weightKg} kg</p>
          <p className="text-xs text-slate-500">Tu punto de partida</p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            <Target className="size-3.5 text-slate-400" />
            Peso objetivo
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{targetWeightKg} kg</p>
          <p className="text-xs text-slate-500">Meta sugerida por el plan</p>
        </div>
      </div>
    </section>
  );
}

type SummaryTermsDialogProps = {
  accepted: boolean;
  disabled?: boolean;
  onAcceptedChange: (accepted: boolean) => void;
};

export function SummaryTermsDialog({
  accepted,
  disabled,
  onAcceptedChange,
}: SummaryTermsDialogProps) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(accepted);

  function handleConfirm() {
    if (!checked) {
      return;
    }

    onAcceptedChange(true);
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setChecked(accepted);
    }

    setOpen(nextOpen);
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between rounded-xl"
        onClick={() => handleOpenChange(true)}
        disabled={disabled}
      >
        <span>Ver términos y condiciones</span>
        <span className="text-xs text-slate-500">{accepted ? "Aceptados" : "Pendientes"}</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Términos y condiciones</DialogTitle>
            <DialogDescription>
              Lee este resumen antes de generar tu plan inicial.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 text-sm text-slate-700">
            <p>
              FitBalance crea una propuesta nutricional personalizada con la información que
              compartiste. El resultado es orientativo y no sustituye una consulta médica,
              nutricional o clínica si necesitas un seguimiento específico.
            </p>
            <p>
              Si tienes una condición médica, embarazo, lactancia, tratamiento o alguna limitación
              de salud, usa el plan solo con supervisión profesional. El dashboard te permite
              ajustar comidas, cantidades y metas cuando cambie tu rutina.
            </p>
            <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <Checkbox
                checked={checked}
                onCheckedChange={(next) => setChecked(next === true)}
                disabled={disabled}
                className="mt-0.5"
              />
              <span className="text-sm">Acepto términos y condiciones</span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!checked}>
              Aceptar y continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
