import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function sanitizeTargetWeightInput(rawValue: string) {
  const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 3);
  return digitsOnly.replace(/^0+/, "");
}

type TargetWeightDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  weightUnit: string;
  manualTargetInput: string;
  weightLimits: {
    min: number;
    max: number;
    step: number;
  };
  suggestedTargetDisplay: number;
  errorMessage?: string;
  onManualTargetInputChange: (value: string) => void;
  onUseSuggestedTarget: () => void;
  onSaveManualTarget: () => Promise<void> | void;
};

export function TargetWeightDialog({
  isOpen,
  onOpenChange,
  weightUnit,
  manualTargetInput,
  weightLimits,
  suggestedTargetDisplay,
  errorMessage,
  onManualTargetInputChange,
  onUseSuggestedTarget,
  onSaveManualTarget,
}: TargetWeightDialogProps) {
  const targetMin = Math.round(weightLimits.min);
  const targetMax = Math.round(weightLimits.max);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/95 p-0 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pr-12">
          <DialogTitle className="text-xl text-slate-950">Editar peso objetivo</DialogTitle>
          <DialogDescription>
            Ajusta tu meta manualmente o vuelve a la sugerencia autom&aacute;tica.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 px-6 pb-5 pt-2">
          <div className="grid gap-2">
            <label htmlFor="manual-target" className="text-sm font-medium text-slate-900">
              Peso objetivo ({weightUnit})
            </label>
            <Input
              id="manual-target"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={3}
              value={manualTargetInput}
              placeholder={String(Math.round(suggestedTargetDisplay))}
              aria-invalid={Boolean(errorMessage)}
              className={cn(
                "h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-lg font-medium tracking-tight",
                errorMessage &&
                  "border-red-300 bg-red-50/60 focus-visible:border-red-400 focus-visible:ring-red-200"
              )}
              onChange={(event) => onManualTargetInputChange(sanitizeTargetWeightInput(event.target.value))}
            />
            {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}
            <p className="text-sm text-slate-500">
              Sugerencia actual: {Math.round(suggestedTargetDisplay)} {weightUnit}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-11 w-full rounded-2xl sm:w-auto" onClick={onUseSuggestedTarget}>
            Usar sugerencia
          </Button>
          <Button type="button" className="h-11 w-full rounded-2xl sm:w-auto" onClick={() => void onSaveManualTarget()}>
            Guardar objetivo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
