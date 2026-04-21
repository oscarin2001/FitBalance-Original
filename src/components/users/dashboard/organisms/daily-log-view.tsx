"use client"

import type { CSSProperties } from "react"

import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  Coffee,
  CircleX,
  Flame,
  MoreVertical,
  Plus,
  Scale,
  Sparkles,
  UtensilsCrossed,
  Zap,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type DailyLogProfile = "deficit" | "superavit" | "mantenimiento" | string

export type DailyLogTotals = {
  calories: number
  proteins: number
  carbs: number
  fats: number
}

export type DailyLogIngredient = {
  id: string | number
  name: string
  quantityLabel: string
  timeLabel?: string
  registeredAt?: string | Date
  thumbnailUrl?: string | null
  thumbnailAlt?: string
  nutrition?: Partial<DailyLogTotals>
}

export type DailyLogMeal = {
  id: string | number
  title: string
  ingredients: DailyLogIngredient[]
  targets?: Partial<DailyLogTotals>
  summaryLabel?: string
}

export type DailyLogViewProps = {
  meals: DailyLogMeal[]
  dietProfile?: DailyLogProfile
  targets?: Partial<DailyLogTotals>
  title?: string
  subtitle?: string
  className?: string
  onAddMeal?: (meal: DailyLogMeal) => void
  onAdvanced?: (meal: DailyLogMeal) => void
  onMorePress?: (meal: DailyLogMeal) => void
}

type ProfileTheme = {
  accent: string
  soft: string
  warning: string
  warningSoft: string
  danger: string
  dangerSoft: string
}

type MealStatus = "apto" | "precaucion" | "fuera"

type ThemeVariables = CSSProperties & {
  "--dailylog-accent"?: string
  "--dailylog-soft"?: string
  "--dailylog-warning"?: string
  "--dailylog-warning-soft"?: string
  "--dailylog-danger"?: string
  "--dailylog-danger-soft"?: string
}

const PROFILE_THEMES: Record<string, ProfileTheme> = {
  deficit: {
    accent: "13 148 136",
    soft: "236 253 245",
    warning: "245 158 11",
    warningSoft: "255 251 235",
    danger: "225 29 72",
    dangerSoft: "255 228 230",
  },
  superavit: {
    accent: "37 99 235",
    soft: "239 246 255",
    warning: "14 165 233",
    warningSoft: "224 242 254",
    danger: "190 24 93",
    dangerSoft: "253 242 248",
  },
  mantenimiento: {
    accent: "20 184 166",
    soft: "236 253 245",
    warning: "245 158 11",
    warningSoft: "255 251 235",
    danger: "225 29 72",
    dangerSoft: "255 228 230",
  },
  default: {
    accent: "13 148 136",
    soft: "236 253 245",
    warning: "245 158 11",
    warningSoft: "255 251 235",
    danger: "225 29 72",
    dangerSoft: "255 228 230",
  },
}

const MEAL_SHARE: Record<string, number> = {
  desayuno: 0.25,
  almuerzo: 0.35,
  cena: 0.25,
  snack: 0.15,
}

function round(value: number) {
  return Math.round(value)
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function capitalizeLabel(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return "Flexible"
  }

  return normalized[0].toUpperCase() + normalized.slice(1)
}

function getProfileLabel(profile?: DailyLogProfile) {
  const profileKey = resolveProfile(profile)

  if (profileKey === "default") {
    return "Flexible"
  }

  if (profileKey === "deficit") {
    return "Déficit"
  }

  if (profileKey === "superavit") {
    return "Superávit"
  }

  return capitalizeLabel(profileKey)
}

function resolveProfile(profile?: DailyLogProfile) {
  const normalized = normalizeText(profile ?? "default")

  if (normalized in PROFILE_THEMES) {
    return normalized
  }

  return "default"
}

function getThemeVariables(profile?: DailyLogProfile): ThemeVariables {
  const theme = PROFILE_THEMES[resolveProfile(profile)]

  return {
    "--dailylog-accent": theme.accent,
    "--dailylog-soft": theme.soft,
    "--dailylog-warning": theme.warning,
    "--dailylog-warning-soft": theme.warningSoft,
    "--dailylog-danger": theme.danger,
    "--dailylog-danger-soft": theme.dangerSoft,
  }
}

function isBeverageIngredient(ingredient: DailyLogIngredient) {
  const haystack = `${ingredient.name} ${ingredient.quantityLabel}`.toLowerCase()

  return (
    haystack.includes("coffee") ||
    haystack.includes("cafe") ||
    haystack.includes("té") ||
    haystack.includes("te ") ||
    haystack.includes("tea") ||
    haystack.includes("infus") ||
    haystack.includes("mate") ||
    haystack.includes("agua") ||
    haystack.includes("ml")
  )
}

function getIngredientIcon(ingredient: DailyLogIngredient) {
  return isBeverageIngredient(ingredient) ? Coffee : UtensilsCrossed
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-BO").format(round(value))
}

function formatIngredientTime(ingredient: DailyLogIngredient) {
  if (ingredient.timeLabel?.trim()) {
    return ingredient.timeLabel.trim()
  }

  if (!ingredient.registeredAt) {
    return ""
  }

  const date =
    ingredient.registeredAt instanceof Date
      ? ingredient.registeredAt
      : new Date(ingredient.registeredAt)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("es-BO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function sumTotals(ingredients: DailyLogIngredient[]): DailyLogTotals {
  return ingredients.reduce<DailyLogTotals>(
    (accumulator, ingredient) => ({
      calories: accumulator.calories + (ingredient.nutrition?.calories ?? 0),
      proteins: accumulator.proteins + (ingredient.nutrition?.proteins ?? 0),
      carbs: accumulator.carbs + (ingredient.nutrition?.carbs ?? 0),
      fats: accumulator.fats + (ingredient.nutrition?.fats ?? 0),
    }),
    {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
    }
  )
}

function getMealShare(mealTitle: string) {
  return MEAL_SHARE[normalizeText(mealTitle)] ?? 0.25
}

function scaleTargets(targets: Partial<DailyLogTotals> | undefined, share: number) {
  return {
    calories: (targets?.calories ?? 0) * share,
    proteins: (targets?.proteins ?? 0) * share,
    carbs: (targets?.carbs ?? 0) * share,
    fats: (targets?.fats ?? 0) * share,
  }
}

function resolveMealTargets(
  meal: DailyLogMeal,
  targets: Partial<DailyLogTotals> | undefined
) {
  const share = getMealShare(meal.title)
  const sharedTargets = scaleTargets(targets, share)

  return {
    calories: meal.targets?.calories ?? sharedTargets.calories,
    proteins: meal.targets?.proteins ?? sharedTargets.proteins,
    carbs: meal.targets?.carbs ?? sharedTargets.carbs,
    fats: meal.targets?.fats ?? sharedTargets.fats,
  }
}

function formatDelta(value: number, unit: string) {
  const rounded = round(value)

  if (rounded > 0) {
    return `Quedan ${formatNumber(rounded)} ${unit}`
  }

  if (rounded < 0) {
    return `Sobran ${formatNumber(Math.abs(rounded))} ${unit}`
  }

  return `En rango ${unit}`
}

function buildMealSummary(
  profile: DailyLogProfile | undefined,
  mealTargets: ReturnType<typeof resolveMealTargets>,
  totals: DailyLogTotals
) {
  const hasTargets =
    mealTargets.calories > 0 || mealTargets.proteins > 0 || mealTargets.carbs > 0 || mealTargets.fats > 0

  if (!hasTargets) {
    return formatMacroRow(totals)
  }

  const profileKey = resolveProfile(profile)
  const caloriesDelta = mealTargets.calories - totals.calories
  const proteinsDelta = mealTargets.proteins - totals.proteins
  const carbsDelta = mealTargets.carbs - totals.carbs

  switch (profileKey) {
    case "superavit":
      return `${formatDelta(caloriesDelta, "calorías")} · ${formatDelta(proteinsDelta, "g de proteína")}`
    case "mantenimiento":
      return `${formatDelta(caloriesDelta, "calorías")} · balance de proteína ${formatDelta(
        proteinsDelta,
        "g"
      )}`
    case "deficit":
      return `${formatDelta(caloriesDelta, "calorías")} · ${formatDelta(carbsDelta, "carbos netos")}`
    default:
      return `${formatDelta(caloriesDelta, "calorías")} · ${formatDelta(carbsDelta, "carbos netos")}`
  }
}

function buildMealStatus(
  profile: DailyLogProfile | undefined,
  mealTargets: ReturnType<typeof resolveMealTargets>,
  totals: DailyLogTotals
): MealStatus {
  const profileKey = resolveProfile(profile)

  if (!mealTargets.calories && !mealTargets.proteins && !mealTargets.carbs && !mealTargets.fats) {
    return "apto"
  }

  const caloriesRatio = mealTargets.calories > 0 ? totals.calories / mealTargets.calories : 1
  const proteinRatio = mealTargets.proteins > 0 ? totals.proteins / mealTargets.proteins : 1
  const carbsRatio = mealTargets.carbs > 0 ? totals.carbs / mealTargets.carbs : 0

  switch (profileKey) {
    case "superavit":
      if (caloriesRatio >= 1.05 && proteinRatio >= 0.95) {
        return "apto"
      }

      if (caloriesRatio >= 0.9 && proteinRatio >= 0.85) {
        return "precaucion"
      }

      return "fuera"
    case "mantenimiento":
      if (Math.abs(caloriesRatio - 1) <= 0.1 && Math.abs(proteinRatio - 1) <= 0.15) {
        return "apto"
      }

      if (Math.abs(caloriesRatio - 1) <= 0.2) {
        return "precaucion"
      }

      return "fuera"
    case "deficit":
      if (caloriesRatio <= 1 && proteinRatio >= 0.9) {
        return "apto"
      }

      if (caloriesRatio <= 1.1 && proteinRatio >= 0.8) {
        return "precaucion"
      }

      return "fuera"
    default:
      if (Math.abs(caloriesRatio - 1) <= 0.15) {
        return "apto"
      }

      if (Math.abs(caloriesRatio - 1) <= 0.25) {
        return "precaucion"
      }

      return "fuera"
  }
}

function buildStatusLabel(profile: DailyLogProfile | undefined, status: MealStatus) {
  const profileKey = resolveProfile(profile)
  const profileLabel = profileKey === "default" ? null : getProfileLabel(profile)

  if (status === "apto") {
    return profileLabel ? `${profileLabel}: Apto` : "Apto para tu meta"
  }

  if (status === "precaucion") {
    return profileLabel ? `${profileLabel}: Precaución` : "Precaución"
  }

  return profileLabel ? `${profileLabel}: Fuera de rango` : "Fuera de rango"
}

function getStatusIcon(status: MealStatus) {
  switch (status) {
    case "apto":
      return BadgeCheck
    case "precaucion":
      return AlertTriangle
    case "fuera":
      return CircleX
  }
}

function getStatusClassName(status: MealStatus) {
  switch (status) {
    case "apto":
      return "border-[rgb(var(--dailylog-accent)/0.18)] bg-[rgb(var(--dailylog-soft)/0.78)] text-[rgb(var(--dailylog-accent))]"
    case "precaucion":
      return "border-[rgb(var(--dailylog-warning)/0.18)] bg-[rgb(var(--dailylog-warning-soft)/0.8)] text-[rgb(var(--dailylog-warning))]"
    case "fuera":
      return "border-[rgb(var(--dailylog-danger)/0.18)] bg-[rgb(var(--dailylog-danger-soft)/0.8)] text-[rgb(var(--dailylog-danger))]"
  }
}

function formatMacroRow(totals: DailyLogTotals) {
  return `P ${formatNumber(totals.proteins)}g · G ${formatNumber(totals.fats)}g · C ${formatNumber(totals.carbs)}g · ${formatNumber(totals.calories)} kcal`
}

function MacroGrid({
  totals,
  className,
}: {
  totals: DailyLogTotals
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-2 gap-y-1 text-right sm:grid-cols-4", className)}>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Cal
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {formatNumber(totals.calories)} kcal
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Prot
        </span>
        <span className="text-sm font-semibold text-teal-600">
          {formatNumber(totals.proteins)}g
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Gras
        </span>
        <span className="text-sm font-semibold text-amber-600">
          {formatNumber(totals.fats)}g
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Carb
        </span>
        <span className="text-sm font-semibold text-rose-600">
          {formatNumber(totals.carbs)}g
        </span>
      </div>
    </div>
  )
}

export function DailyLogView({
  meals,
  dietProfile,
  targets,
  title = "Registro Diario",
  subtitle = "Revisa las comidas del dia con cantidades, tiempos y lectura rapida de tu dieta.",
  className,
  onAddMeal,
  onAdvanced,
  onMorePress,
}: DailyLogViewProps) {
  const themeVariables = getThemeVariables(dietProfile)
  const profileLabel = getProfileLabel(dietProfile)

  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-4 scroll-smooth sm:max-w-lg",
        className
      )}
      style={themeVariables}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Registro diario
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="max-w-[22rem] text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>

        <Badge
          variant="outline"
          className="rounded-full border-[rgb(var(--dailylog-accent)/0.2)] bg-[rgb(var(--dailylog-soft)/0.55)] text-[rgb(var(--dailylog-accent))]"
        >
          {profileLabel}
        </Badge>
      </header>

      {meals.length > 0 ? (
        <div className="grid gap-4">
          {meals.map((meal) => {
            const totals = sumTotals(meal.ingredients)
            const mealTargets = resolveMealTargets(meal, targets)
            const summaryLabel = meal.summaryLabel ?? buildMealSummary(dietProfile, mealTargets, totals)

            return (
              <Card
                key={meal.id}
                className="overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white/96 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)]"
              >
                <CardHeader className="space-y-1.5 pb-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-lg font-semibold text-slate-950">
                        {meal.title}
                      </CardTitle>
                      <p className="text-sm leading-6 text-muted-foreground">{summaryLabel}</p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      aria-label={`Mas acciones de ${meal.title}`}
                      onClick={() => onMorePress?.(meal)}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-2 pt-0">
                  <div className="grid gap-1 rounded-[1.35rem] bg-slate-50/80 p-2.5">
                    {meal.ingredients.map((ingredient) => {
                      const IngredientIcon = getIngredientIcon(ingredient)
                      const ingredientTime = formatIngredientTime(ingredient)
                      const ingredientTotals: DailyLogTotals = {
                        calories: ingredient.nutrition?.calories ?? 0,
                        proteins: ingredient.nutrition?.proteins ?? 0,
                        carbs: ingredient.nutrition?.carbs ?? 0,
                        fats: ingredient.nutrition?.fats ?? 0,
                      }

                      return (
                        <div
                          key={ingredient.id}
                          className="flex items-start justify-between gap-2 rounded-2xl border-b border-slate-100/90 py-2 last:border-b-0 last:pb-0"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <Avatar className="size-10 border border-[rgb(var(--dailylog-soft)/0.7)] bg-[rgb(var(--dailylog-soft)/0.38)]">
                              {ingredient.thumbnailUrl ? (
                                <AvatarImage
                                  src={ingredient.thumbnailUrl}
                                  alt={ingredient.thumbnailAlt ?? ingredient.name}
                                />
                              ) : null}
                              <AvatarFallback className="bg-transparent text-[rgb(var(--dailylog-accent))]">
                                <IngredientIcon className="size-5" />
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 space-y-1">
                              <p className="truncate text-sm font-semibold text-slate-950">
                                {ingredient.name}
                              </p>
                              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                                <span>{ingredient.quantityLabel}</span>
                                {ingredientTime ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock3 className="size-3.5" />
                                    {ingredientTime}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                            <MacroGrid
                              totals={ingredientTotals}
                              className="min-w-[8.75rem] sm:min-w-[12rem]"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Separator className="bg-slate-200/80" />

                  <div className="rounded-[1.35rem] bg-slate-50/80 p-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-slate-950">
                          Total de {meal.title}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          Suma de macros de esta seccion antes de cerrar el footer.
                        </p>
                      </div>

                      <MacroGrid totals={totals} className="min-w-[8.75rem] sm:min-w-[12rem]" />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center gap-2 border-t border-slate-200/70 bg-slate-50/60 px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 flex-1 rounded-full text-[rgb(var(--dailylog-accent))] hover:bg-[rgb(var(--dailylog-soft)/0.45)] hover:text-[rgb(var(--dailylog-accent))]"
                    onClick={() => onAdvanced?.(meal)}
                  >
                    <Zap className="size-4" />
                    Avanzado
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 rounded-full border-[rgb(var(--dailylog-accent)/0.18)] bg-white/90 hover:bg-[rgb(var(--dailylog-soft)/0.35)]"
                    onClick={() => onAddMeal?.(meal)}
                  >
                    <Plus className="size-4" />
                    Añadir {meal.title}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-white/80 p-5 text-sm text-muted-foreground shadow-sm">
          Todavia no hay comidas registradas para mostrar en el registro diario.
        </div>
      )}
    </section>
  )
}