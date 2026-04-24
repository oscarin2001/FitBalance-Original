"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"

import {
  Copy,
  AlertTriangle,
  BadgeCheck,
  Coffee,
  CircleX,
  Droplets,
  Flame,
  Loader2,
  MoreVertical,
  Plus,
  PencilLine,
  Scale,
  Sparkles,
  UtensilsCrossed,
  ListPlus,
  Clock3,
  ChefHat,
  Move,
  Trash2,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"
import Confetti from "react-confetti"

import {
  deleteDashboardMealIngredientAction,
  addDashboardMealFoodAction,
  updateDailyComplianceAction,
  updateDailyHydrationAction,
  updateDashboardMealIngredientAction,
} from "@/actions/server/users/dashboard/daily-log"
import type { DailyLogFoodOption } from "@/actions/server/users/dashboard/daily-log/types"
import type { UserDashboardWeeklyRecipeDay } from "@/actions/server/users/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import { IngredientActionsMenu } from "./daily-log/actions/ingredient-actions-menu"
import { FoodAddDialog, type FoodAddValues } from "./daily-log/dialogs/food-add-dialog"
import { IngredientEditDialog, type IngredientEditValues } from "./daily-log/dialogs/ingredient-edit-dialog"

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
  grams: number
  quantityLabel: string
  timeLabel?: string
  registeredAt?: string | Date
  thumbnailUrl?: string | null
  thumbnailAlt?: string
  category?: string | null
  role?: string | null
  isBeverage?: boolean
  nutrition?: Partial<DailyLogTotals>
}

export type DailyLogMeal = {
  id: string | number
  title: string
  recipeName?: string
  instructionsSource?: "database" | "generated"
  ingredients: DailyLogIngredient[]
  targets?: Partial<DailyLogTotals>
  summaryLabel?: string
}

export type DailyLogViewProps = {
  meals: DailyLogMeal[]
  weeklyRecipes?: UserDashboardWeeklyRecipeDay[]
  dietProfile?: DailyLogProfile
  targets?: Partial<DailyLogTotals>
  sessionUserId: number
  initialFoods: DailyLogFoodOption[]
  selectedDateIso: string
  dailyWaterLiters?: number
  waterConsumedLiters?: number
  dayCompleted?: boolean
  title?: string
  subtitle?: string
  showHeader?: boolean
  className?: string
  onAddMeal?: (meal: DailyLogMeal) => void
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

type MealDialogMode = "food" | "recipe" | "quick-entry" | "recipe-create"

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

async function copyTextToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.readOnly = true
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
}

function buildMealCopyValue(meal: DailyLogMeal, summaryLabel: string, totals: DailyLogTotals) {
  return `${meal.title} · ${summaryLabel} · ${formatMacroRow(totals)}`
}

type MealActionsMenuProps = {
  meal: DailyLogMeal
  summaryLabel: string
  totals: DailyLogTotals
  onAddMeal?: (meal: DailyLogMeal) => void
  onQuickEntry?: (meal: DailyLogMeal) => void
  onViewAiRecipe?: (meal: DailyLogMeal) => void
  onCreateRecipe?: (meal: DailyLogMeal) => void
  onCopyMeal?: (value: string) => void
  onClearMeal?: (meal: DailyLogMeal) => void
}

function MealActionsMenu({
  meal,
  summaryLabel,
  totals,
  onAddMeal,
  onQuickEntry,
  onViewAiRecipe,
  onCreateRecipe,
  onCopyMeal,
  onClearMeal,
}: MealActionsMenuProps) {
  const mealCopyValue = buildMealCopyValue(meal, summaryLabel, totals)

  async function handleCopyMeal() {
    await copyTextToClipboard(mealCopyValue)
    onCopyMeal?.(mealCopyValue)
  }

  function handleClearMeal() {
    onClearMeal?.(meal)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`Mas acciones de ${meal.title}`}
        className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 shadow-sm transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[18rem] rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-[0_16px_32px_-16px_rgba(15,23,42,0.45)]"
      >
        <DropdownMenuItem
          disabled={!onAddMeal}
          onClick={() => onAddMeal?.(meal)}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900 data-[disabled]:text-slate-400 data-[disabled]:opacity-100"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <Plus className="size-4" />
          </span>
          Añadir alimento
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!onQuickEntry}
          onClick={() => onQuickEntry?.(meal)}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900 data-[disabled]:text-slate-400 data-[disabled]:opacity-100"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <Zap className="size-4" />
          </span>
          Entrada rápida
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={!onViewAiRecipe}
          onClick={() => onViewAiRecipe?.(meal)}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900 data-[disabled]:text-slate-400 data-[disabled]:opacity-100"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <Sparkles className="size-4" />
          </span>
          Ver receta recomendada por IA
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100"
        >
          <span className="flex size-4 items-center justify-center text-slate-400">
            <Scale className="size-4" />
          </span>
          Detalles de comida
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-slate-200" />

        <DropdownMenuItem disabled className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100">
          <span className="flex size-4 items-center justify-center text-slate-400">
            <Droplets className="size-4" />
          </span>
          Añadir nivel de glucosa
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100">
          <span className="flex size-4 items-center justify-center text-slate-400">
            <Flame className="size-4" />
          </span>
          Añadir nivel de cetonas
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100">
          <span className="flex size-4 items-center justify-center text-slate-400">
            <Zap className="size-4" />
          </span>
          Añadir insulina
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100">
          <span className="flex size-4 items-center justify-center text-slate-400">
            <PencilLine className="size-4" />
          </span>
          Añadir nota
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100">
          <span className="flex size-4 items-center justify-center text-slate-400">
            <Sparkles className="size-4" />
          </span>
          Añadir foto
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100">
          <span className="flex size-4 items-center justify-center text-slate-400">
            <Clock3 className="size-4" />
          </span>
          Establecer hora de la comida
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-slate-200" />

        <DropdownMenuItem
          disabled={!onCreateRecipe}
          onClick={() => onCreateRecipe?.(meal)}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900 data-[disabled]:text-slate-400 data-[disabled]:opacity-100"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <ChefHat className="size-4" />
          </span>
          Crear receta
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onAddMeal?.(meal)}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900 data-[disabled]:text-slate-400 data-[disabled]:opacity-100"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <ListPlus className="size-4" />
          </span>
          Añadir alimentos a comida
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100">
          <span className="flex size-4 items-center justify-center text-slate-400">
            <Sparkles className="size-4" />
          </span>
          Entrada rápida de alimentos
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-slate-200" />

        <DropdownMenuItem
          onClick={handleCopyMeal}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <Copy className="size-4" />
          </span>
          Copiar a...
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 data-[disabled]:text-slate-400 data-[disabled]:opacity-100">
          <span className="flex size-4 items-center justify-center text-slate-400">
            <Move className="size-4" />
          </span>
          Reordenar/mover
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleClearMeal}
          variant="destructive"
          className="gap-2 rounded-xl px-2.5 py-2 text-sm outline-none transition-colors focus:!bg-rose-50 focus:!text-rose-700"
        >
          <span className="flex size-4 items-center justify-center text-rose-500">
            <Trash2 className="size-4" />
          </span>
          Eliminar todo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-BO").format(round(value))
}

const WATER_GLASS_MILLILITERS = 250
const WATER_GLASS_LITERS = WATER_GLASS_MILLILITERS / 1000

function formatWaterAmount(liters: number) {
  const milliliters = Math.round(liters * 1000)

  if (milliliters <= 0) {
    return "0 ml"
  }

  if (milliliters < 1000) {
    return `${milliliters} ml`
  }

  const formattedLiters = milliliters / 1000
  return Number.isInteger(formattedLiters) ? `${formattedLiters} L` : `${formattedLiters.toFixed(2)} L`
}

function formatWaterGlassCount(glassCount: number) {
  return `${glassCount} vaso${glassCount === 1 ? "" : "s"}`
}

function getWaterTargetGlassCount(liters: number) {
  return Math.max(Math.ceil(liters / WATER_GLASS_LITERS), 0)
}

function getWaterConsumedGlassCount(liters: number) {
  return Math.max(Math.round(liters / WATER_GLASS_LITERS), 0)
}

function WaterGlass({
  filled,
  disabled,
  label,
  onPress,
}: {
  filled: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative h-12 w-8 overflow-hidden rounded-b-[0.65rem] border border-slate-300/80 bg-white/85 shadow-[inset_0_-8px_14px_rgba(148,163,184,0.08)] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40",
        filled && "border-cyan-300/80 bg-cyan-50/90 shadow-[inset_0_-8px_14px_rgba(6,182,212,0.12)]",
        disabled && "cursor-not-allowed opacity-60 hover:translate-y-0"
      )}
      style={{ clipPath: "polygon(24% 0, 76% 0, 100% 100%, 0 100%)" }}
      aria-label={label}
      aria-pressed={filled}
      disabled={disabled}
      onClick={onPress}
    >
      <motion.span
        className={cn(
          "absolute inset-x-1 bottom-1 rounded-b-[0.45rem] rounded-t-[0.2rem] bg-transparent",
          filled && "bg-gradient-to-t from-cyan-400/60 via-cyan-300/70 to-cyan-100/80"
        )}
        initial={false}
        animate={{ height: filled ? "64%" : "0%", opacity: filled ? 1 : 0.15 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
      />
    </button>
  )
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

function scaleIngredientTotals(ingredient: DailyLogIngredient, nextQuantity: number): DailyLogTotals {
  const baseQuantity = ingredient.grams > 0 ? ingredient.grams : 1
  const ratio = nextQuantity > 0 ? nextQuantity / baseQuantity : 0

  return {
    calories: Number((((ingredient.nutrition?.calories ?? 0) * ratio)).toFixed(1)),
    proteins: Number((((ingredient.nutrition?.proteins ?? 0) * ratio)).toFixed(1)),
    carbs: Number((((ingredient.nutrition?.carbs ?? 0) * ratio)).toFixed(1)),
    fats: Number((((ingredient.nutrition?.fats ?? 0) * ratio)).toFixed(1)),
  }
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

  switch (profileKey) {
    case "superavit":
      return `${formatDelta(caloriesDelta, "calorías")} · ${formatDelta(proteinsDelta, "g de proteína")}`
    case "mantenimiento":
      return `${formatDelta(caloriesDelta, "calorías")} · balance de proteína ${formatDelta(
        proteinsDelta,
        "g"
      )}`
    case "deficit":
      return `${formatDelta(caloriesDelta, "calorías")} · ${formatDelta(proteinsDelta, "g de proteína")}`
    default:
      return `${formatDelta(caloriesDelta, "calorías")} · ${formatDelta(proteinsDelta, "g de proteína")}`
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
  return `Calorías ${formatNumber(totals.calories)} kcal · Proteínas ${formatNumber(totals.proteins)}g`
}

function MealMetricSummary({
  totals,
  className,
  emphasized = false,
}: {
  totals: DailyLogTotals
  className?: string
  emphasized?: boolean
}) {
  return (
    <div className={cn("grid w-full grid-cols-2 gap-x-4 gap-y-2 text-right md:grid-cols-4", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Calorías
        </span>
        <span
          className={cn(
            "font-semibold tracking-tight",
            emphasized ? "text-base text-slate-950" : "text-sm text-slate-900"
          )}
        >
          {formatNumber(totals.calories)} kcal
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Proteínas
        </span>
        <span
          className={cn(
            "font-semibold tracking-tight",
            emphasized ? "text-base text-teal-600" : "text-sm text-teal-600"
          )}
        >
          {formatNumber(totals.proteins)}g
        </span>
      </div>

      <div className="hidden min-w-0 flex-col gap-0.5 md:flex">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Carbos
        </span>
        <span className={cn("font-semibold tracking-tight", emphasized ? "text-base text-rose-600" : "text-sm text-rose-600")}>
          {formatNumber(totals.carbs)}g
        </span>
      </div>

      <div className="hidden min-w-0 flex-col gap-0.5 md:flex">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Grasas
        </span>
        <span className={cn("font-semibold tracking-tight", emphasized ? "text-base text-amber-600" : "text-sm text-amber-600")}>
          {formatNumber(totals.fats)}g
        </span>
      </div>
    </div>
  )
}

function HydrationProgressCard({
  dailyWaterLiters,
  waterConsumedLiters,
  selectedDateIso,
}: {
  dailyWaterLiters: number;
  waterConsumedLiters: number;
  selectedDateIso: string;
}) {
  const router = useRouter();
  const [selectedGlasses, setSelectedGlasses] = useState(getWaterConsumedGlassCount(waterConsumedLiters));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedGlasses(getWaterConsumedGlassCount(waterConsumedLiters));
    setError(null);
  }, [selectedDateIso, waterConsumedLiters]);

  if (dailyWaterLiters <= 0) {
    return null;
  }

  const targetGlasses = Math.max(getWaterTargetGlassCount(dailyWaterLiters), 1);
  const renderedGlasses = Math.max(targetGlasses, selectedGlasses + 1, 1);
  const consumedGlasses = Math.min(selectedGlasses, renderedGlasses);
  const consumedLiters = selectedGlasses * WATER_GLASS_LITERS;

  function handleGlassPress(glassCount: number) {
    if (isSaving) {
      return;
    }

    const clampedCount = Math.max(0, Math.min(glassCount, renderedGlasses));
    const nextCount = clampedCount === selectedGlasses ? Math.max(clampedCount - 1, 0) : clampedCount;

    if (nextCount === selectedGlasses) {
      return;
    }

    const previousCount = selectedGlasses;
    setSelectedGlasses(nextCount);
    setError(null);
    setIsSaving(true);

    void (async () => {
      const result = await updateDailyHydrationAction({
        dateIso: selectedDateIso,
        glassCount: nextCount,
        dailyWaterLiters,
      });

      if (!result.ok) {
        setSelectedGlasses(previousCount);
        setError(result.error ?? "No se pudo guardar el agua.");
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      router.refresh();
    })();
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/96 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">Agua</CardTitle>
            <p className="text-sm leading-6 text-slate-600">Toca un vaso para sumar 250 ml.</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
            <Droplets className="size-3.5" />
            {formatWaterAmount(consumedLiters)} / {formatWaterAmount(dailyWaterLiters)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 pt-0">
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {Array.from({ length: renderedGlasses }, (_, index) => {
            const glassCount = index + 1

            return (
              <WaterGlass
                key={glassCount}
                filled={index < consumedGlasses}
                disabled={isSaving}
                label={`Registrar ${formatWaterGlassCount(glassCount)}`}
                onPress={() => handleGlassPress(glassCount)}
              />
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
            <Droplets className="size-4 text-cyan-600" />
            <span>
              {formatWaterGlassCount(consumedGlasses)} · {formatWaterAmount(consumedLiters)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSaving ? <Loader2 className="size-3.5 animate-spin text-cyan-600" aria-hidden="true" /> : null}
            {consumedGlasses > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                onClick={() => handleGlassPress(0)}
                disabled={isSaving}
              >
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>

        {isSaving || error ? (
          <p className={cn("min-h-4 px-1 text-xs font-medium", error ? "text-rose-600" : "text-cyan-600")}>{error ?? "Guardando hidratación..."}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function DayCompletionCard({
  dayCompleted,
  selectedDateIso,
}: {
  dayCompleted: boolean;
  selectedDateIso: string;
}) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(dayCompleted);
  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const celebrationTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setIsCompleted(dayCompleted);
  }, [dayCompleted, selectedDateIso]);

  useEffect(() => {
    setShowCelebration(false)
  }, [selectedDateIso])

  useEffect(() => {
    function updateViewport() {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)

    return () => {
      window.removeEventListener("resize", updateViewport)

      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current)
      }
    }
  }, [])

  function handleCompletionChange(nextCompleted: boolean) {
    if (isSaving || nextCompleted === isCompleted) {
      return;
    }

    const previousCompleted = isCompleted;
    setIsCompleted(nextCompleted);
    setIsSaving(true);

    void (async () => {
      const result = await updateDailyComplianceAction({
        dateIso: selectedDateIso,
        completed: nextCompleted,
      });

      if (!result.ok) {
        setIsCompleted(previousCompleted);
        console.error(result.error ?? "No se pudo actualizar el estado del dia.");
        setIsSaving(false);
        return;
      }

      if (nextCompleted) {
        setShowCelebration(true)

        if (celebrationTimerRef.current) {
          window.clearTimeout(celebrationTimerRef.current)
        }

        celebrationTimerRef.current = window.setTimeout(() => {
          setShowCelebration(false)
        }, 4200)
      }

      setIsSaving(false);
      router.refresh();
    })();
  }

  return (
    <>
      {showCelebration && viewport.width > 0 && viewport.height > 0 ? (
        <div className="pointer-events-none fixed inset-0 z-[120]">
          <Confetti
            width={viewport.width}
            height={viewport.height}
            numberOfPieces={220}
            recycle={false}
            run={showCelebration}
            gravity={0.18}
            colors={["#06b6d4", "#14b8a6", "#10b981", "#f59e0b"]}
          />
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/96 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
        <CardContent className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold transition-colors", isCompleted ? "text-emerald-600" : "text-slate-900")}>
              Terminé registro de comida por hoy
            </p>
          </div>

          <Switch
            checked={isCompleted}
            disabled={isSaving}
            aria-label="Cambiar cierre del día"
            onCheckedChange={handleCompletionChange}
            className={cn(
              "transition-all",
              isCompleted
                ? "border-transparent bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 shadow-[0_8px_18px_-12px_rgba(6,182,212,0.85)]"
                : "border-slate-300/80 bg-slate-300/80"
            )}
          />
        </CardContent>
      </Card>
    </>
  )
}

export function DailyLogView({
  meals,
  weeklyRecipes,
  dietProfile,
  targets,
  sessionUserId,
  initialFoods,
  selectedDateIso,
  dailyWaterLiters = 0,
  waterConsumedLiters = 0,
  dayCompleted = false,
  title = "Registro Diario",
  subtitle = "Revisa las comidas del dia con cantidades, tiempos y lectura rapida de tu dieta.",
  showHeader = true,
  className,
  onAddMeal,
}: DailyLogViewProps) {
  const router = useRouter()
  const themeVariables = getThemeVariables(dietProfile)
  const profileLabel = getProfileLabel(dietProfile)
  const [visibleMeals, setVisibleMeals] = useState(meals)
  const [editingIngredient, setEditingIngredient] = useState<{
    mealId: string | number
    mealTitle: string
    ingredientId: string | number
    ingredient: DailyLogIngredient
  } | null>(null)
  const [activeMealDialog, setActiveMealDialog] = useState<{
    mealId: string | number
    mealTitle: string
    mode: MealDialogMode
  } | null>(null)

  useEffect(() => {
    setVisibleMeals(meals)
  }, [meals, selectedDateIso])

  function handleClearMeal(mealId: string | number) {
    setVisibleMeals((previousMeals) => {
      return previousMeals.map((meal) => {
        if (meal.id !== mealId) {
          return meal
        }

        return {
          ...meal,
          ingredients: [],
          summaryLabel: undefined,
        }
      })
    })
  }

  async function handleDeleteIngredient(mealToUpdate: DailyLogMeal, ingredientToRemove: DailyLogIngredient) {
    const result = await deleteDashboardMealIngredientAction({
      dateIso: selectedDateIso,
      mealId: Number(mealToUpdate.id),
      ingredientId: String(ingredientToRemove.id),
    })

    if (!result.ok) {
      console.error(result.error ?? "No se pudo eliminar el alimento.")
      return
    }

    setVisibleMeals((previousMeals) => {
      return previousMeals.map((meal) => {
        if (meal.id !== mealToUpdate.id) {
          return meal
        }

        return {
          ...meal,
          ingredients: meal.ingredients.filter((ingredient) => ingredient.id !== ingredientToRemove.id),
        }
      })
    })

    router.refresh()
  }

  function handleOpenIngredientEditor(meal: DailyLogMeal, ingredient: DailyLogIngredient) {
    setEditingIngredient({
      mealId: meal.id,
      mealTitle: meal.title,
      ingredientId: ingredient.id,
      ingredient,
    })
  }

  function handleOpenFoodAdder(meal: DailyLogMeal) {
    setActiveMealDialog({
      mealId: meal.id,
      mealTitle: meal.title,
      mode: "food",
    })

    onAddMeal?.(meal)
  }

  function handleOpenQuickEntry(meal: DailyLogMeal) {
    setActiveMealDialog({
      mealId: meal.id,
      mealTitle: meal.title,
      mode: "quick-entry",
    })
  }

  function handleOpenRecipeCreate(meal: DailyLogMeal) {
    setActiveMealDialog({
      mealId: meal.id,
      mealTitle: meal.title,
      mode: "recipe-create",
    })
  }

  function handleOpenRecipeGenerator(meal: DailyLogMeal) {
    setActiveMealDialog({
      mealId: meal.id,
      mealTitle: meal.title,
      mode: "recipe",
    })
  }

  function handleViewAiRecipe(meal: DailyLogMeal) {
    handleOpenRecipeGenerator(meal)
  }

  async function handleAddFood(values: FoodAddValues) {
    if (!activeMealDialog) {
      return { ok: false, error: "No encontramos la comida a editar." }
    }

    const result = await addDashboardMealFoodAction({
      dateIso: selectedDateIso,
      mealId: Number(activeMealDialog.mealId),
      foodId: values.food.id,
      quantity: values.quantity,
      unit: values.unit,
    })

    if (!result.ok) {
      return result
    }

    const quantity = values.quantity
    const ratio = quantity > 0 ? quantity / 100 : 0

    setVisibleMeals((previousMeals) => {
      return previousMeals.map((meal) => {
        if (meal.id !== activeMealDialog.mealId) {
          return meal
        }

        const nextIngredientIndex = meal.ingredients.length

        return {
          ...meal,
          ingredients: [
            ...meal.ingredients,
            {
              id: `${meal.id}-${nextIngredientIndex}`,
              name: values.food.name,
              grams: quantity,
              quantityLabel: `${Number.isInteger(quantity) ? String(Math.round(quantity)) : quantity.toFixed(1)} ${values.unit}`,
              nutrition: {
                calories: Number((values.food.calories * ratio).toFixed(1)),
                proteins: Number((values.food.proteins * ratio).toFixed(1)),
                carbs: Number((values.food.carbs * ratio).toFixed(1)),
                fats: Number((values.food.fats * ratio).toFixed(1)),
              },
              category: values.food.categoryLabel,
              isBeverage: values.food.isBeverage,
              role: values.food.categoryEnum ?? null,
            },
          ],
        }
      })
    })

    setActiveMealDialog(null)
    router.refresh()

    return result
  }

  async function handleSaveIngredient(values: IngredientEditValues) {
    if (!editingIngredient) {
      return { ok: false, error: "No encontramos el alimento a editar." }
    }

    const result = await updateDashboardMealIngredientAction({
      dateIso: selectedDateIso,
      mealId: Number(editingIngredient.mealId),
      ingredientId: String(editingIngredient.ingredientId),
      ingredient: {
        name: values.name,
        quantity: values.quantity,
        unit: values.unit,
      },
    })

    if (!result.ok) {
      return result
    }

    setVisibleMeals((previousMeals) => {
      return previousMeals.map((meal) => {
        if (meal.id !== editingIngredient.mealId) {
          return meal
        }

        return {
          ...meal,
          ingredients: meal.ingredients.map((ingredient) => {
            if (ingredient.id !== editingIngredient.ingredientId) {
              return ingredient
            }

            const updatedNutrition = scaleIngredientTotals(editingIngredient.ingredient, values.quantity)

            return {
              ...ingredient,
              name: values.name,
              grams: values.quantity,
              quantityLabel: values.quantityLabel,
              nutrition: {
                calories: updatedNutrition.calories,
                proteins: updatedNutrition.proteins,
                carbs: updatedNutrition.carbs,
                fats: updatedNutrition.fats,
              },
            }
          }),
        }
      })
    })

    setEditingIngredient(null)
    router.refresh()

    return result
  }

  return (
    <section
      className={cn(
        "flex w-full flex-col scroll-smooth",
        showHeader ? "gap-3" : "gap-2.5",
        className
      )}
      style={themeVariables}
    >
      {showHeader ? (
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
      ) : null}

      <div className="grid gap-3">
        {visibleMeals.length > 0 ? (
          visibleMeals.map((meal) => {
            const totals = sumTotals(meal.ingredients)
            const mealTargets = resolveMealTargets(meal, targets)
            const summaryLabel = meal.summaryLabel ?? buildMealSummary(dietProfile, mealTargets, totals)

            return (
              <Card
                key={meal.id}
                className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/70 shadow-[0_18px_54px_-34px_rgba(15,23,42,0.42)]"
              >
                <CardHeader className="space-y-2 pb-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
                        {meal.title}
                      </CardTitle>
                      <p className="text-sm leading-6 text-slate-600">{summaryLabel}</p>
                    </div>

                      <MealActionsMenu
                        meal={meal}
                        summaryLabel={summaryLabel}
                        totals={totals}
                        onAddMeal={handleOpenFoodAdder}
                        onQuickEntry={handleOpenQuickEntry}
                        onViewAiRecipe={handleViewAiRecipe}
                        onCreateRecipe={handleOpenRecipeCreate}
                        onClearMeal={(mealItem) => handleClearMeal(mealItem.id)}
                      />
                  </div>

                  {meal.instructionsSource !== "generated" ? (
                    <div className="flex">
                      <Button
                        type="button"
                        className="h-9 w-full justify-center rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 text-[12px] font-semibold text-white shadow-[0_12px_24px_-12px_rgba(6,182,212,0.75)] ring-1 ring-cyan-200 transition-transform hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-12px_rgba(6,182,212,0.82)] sm:w-fit whitespace-nowrap"
                        onClick={() => handleOpenRecipeGenerator(meal)}
                      >
                        <Sparkles className="size-3.5" />
                        Crear receta con IA
                      </Button>
                    </div>
                  ) : null}
                </CardHeader>

                <Separator className="bg-slate-200/80" />

                <CardContent className="grid gap-0 pt-2.5">
                  {meal.ingredients.length > 0 ? (
                    <div className="divide-y divide-slate-200/80">
                      {meal.ingredients.map((ingredient) => {
                        const IngredientIcon = getIngredientIcon(ingredient)
                        const ingredientTotals: DailyLogTotals = {
                          calories: ingredient.nutrition?.calories ?? 0,
                          proteins: ingredient.nutrition?.proteins ?? 0,
                          carbs: ingredient.nutrition?.carbs ?? 0,
                          fats: ingredient.nutrition?.fats ?? 0,
                        }

                        return (
                          <div key={ingredient.id} className="relative py-3">
                            <div className="absolute right-0 top-3">
                              <IngredientActionsMenu
                                meal={meal}
                                ingredient={ingredient}
                                onEdit={() => handleOpenIngredientEditor(meal, ingredient)}
                                onDelete={() => handleDeleteIngredient(meal, ingredient)}
                              />
                            </div>

                            <div className="flex flex-col gap-2.5 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-3">
                              <div className="flex min-w-0 items-start gap-3 pr-10 md:pr-0">
                                <Avatar className="size-10 border border-[rgb(var(--dailylog-soft)/0.65)] bg-[rgb(var(--dailylog-soft)/0.35)] shadow-inner shadow-white/60 sm:size-11">
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
                                  <p className="truncate text-sm font-semibold text-slate-950 sm:text-base">
                                    {ingredient.name}
                                  </p>
                                  <p className="text-xs text-slate-500 sm:text-sm">{ingredient.quantityLabel}</p>
                                </div>
                              </div>

                              <MealMetricSummary totals={ingredientTotals} className="w-full md:w-auto md:min-w-[15rem]" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-3 text-sm leading-6 text-slate-500">
                      No hay alimentos en {meal.title.toLowerCase()}.
                    </div>
                  )}

                  <Separator className="bg-slate-200/80" />

                  <div className="flex flex-col gap-3 py-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold tracking-tight text-slate-950">Total de {meal.title}</p>
                    </div>

                    <MealMetricSummary totals={totals} className="w-full md:w-auto md:min-w-[15rem]" emphasized />
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-white/80 p-5 text-sm text-muted-foreground shadow-sm">
            Todavia no hay comidas registradas para mostrar en el registro diario.
          </div>
        )}

        <HydrationProgressCard
          dailyWaterLiters={dailyWaterLiters}
          waterConsumedLiters={waterConsumedLiters}
          selectedDateIso={selectedDateIso}
        />

        <DayCompletionCard dayCompleted={dayCompleted} selectedDateIso={selectedDateIso} />
      </div>

      <IngredientEditDialog
        open={Boolean(editingIngredient)}
        mealTitle={editingIngredient?.mealTitle ?? ""}
        ingredient={editingIngredient?.ingredient ?? null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingIngredient(null)
          }
        }}
        onSave={handleSaveIngredient}
      />

      <FoodAddDialog
        open={Boolean(activeMealDialog)}
        mealTitle={activeMealDialog?.mealTitle ?? ""}
        mealId={activeMealDialog?.mealId ?? ""}
        currentUserId={sessionUserId}
        initialFoods={initialFoods}
        generatedRecipeDays={weeklyRecipes ?? []}
        selectedDateIso={selectedDateIso}
        initialCatalogTab={activeMealDialog?.mode === "recipe" || activeMealDialog?.mode === "recipe-create" ? "my-recipes" : "all"}
        initialAction={activeMealDialog?.mode === "quick-entry" ? "quick-entry" : activeMealDialog?.mode === "recipe-create" ? "recipe-create" : undefined}
        generatedRecipeDateIso={activeMealDialog?.mode === "recipe" || activeMealDialog?.mode === "recipe-create" ? selectedDateIso : null}
        generatedRecipeMealType={activeMealDialog?.mode === "recipe" || activeMealDialog?.mode === "recipe-create" ? activeMealDialog.mealTitle : null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setActiveMealDialog(null)
          }
        }}
        onAddFood={handleAddFood}
      />
    </section>
  )
}