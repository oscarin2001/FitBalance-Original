import type { LucideIcon } from "lucide-react";
import { BadgeCheck, FileText, Shield, Sparkles } from "lucide-react";

export type TermsSectionTone = "emerald" | "teal" | "slate" | "amber";

export type TermsSection = {
  id: string;
  title: string;
  icon: LucideIcon;
  tone: TermsSectionTone;
  paragraphs: string[];
  bullets?: string[];
};

export const termsSummaryBullets = [
  "Usa Fitbalance de forma responsable y con informacion veraz.",
  "Tus datos de salud se usan para calcular objetivos y mejorar tu experiencia.",
  "Las suscripciones y funciones premium pueden cambiar con aviso previo.",
];

export const termsSections: TermsSection[] = [
  {
    id: "acceptance",
    title: "Aceptacion de los terminos",
    icon: FileText,
    tone: "emerald",
    paragraphs: [
      "Al usar Fitbalance aceptas estas condiciones y reconoces que la aplicacion puede evolucionar con nuevas funciones, ajustes visuales y cambios de flujo.",
      "Si no estas de acuerdo con estos terminos, debes dejar de usar la aplicacion y sus servicios asociados.",
    ],
  },
  {
    id: "account",
    title: "Tu cuenta y tu informacion",
    icon: BadgeCheck,
    tone: "teal",
    paragraphs: [
      "Eres responsable de mantener tu cuenta segura y de ofrecer datos correctos al completar tu perfil, objetivos y seguimiento de salud.",
      "Podemos usar tu nombre, correo, metricas y preferencias para mostrarte una experiencia coherente dentro del dashboard y del onboarding.",
    ],
    bullets: [
      "No compartas tu acceso con terceros.",
      "Mantén actualizado tu correo si quieres recibir avisos importantes.",
      "Si detectas un acceso no autorizado, cambia tu contrasena cuanto antes.",
    ],
  },
  {
    id: "health-data",
    title: "Datos de salud y seguimiento",
    icon: Shield,
    tone: "slate",
    paragraphs: [
      "Fitbalance trabaja con datos de salud y rendimiento para calcular metas, resumenes y recomendaciones internas.",
      "La informacion mostrada es orientativa y no sustituye el criterio de un profesional de la salud, nutricion o entrenamiento.",
    ],
    bullets: [
      "Los calculos pueden variar segun tu actividad real y tus datos ingresados.",
      "Puedes actualizar tus metricas desde el perfil cuando cambien.",
      "No uses la app como sustituto de atencion medica o diagnostico.",
    ],
  },
  {
    id: "premium",
    title: "Funciones premium y pagos",
    icon: Sparkles,
    tone: "amber",
    paragraphs: [
      "Algunas funciones pueden marcarse como premium y quedar sujetas a disponibilidad, mejoras futuras o cambios de precio.",
      "Cuando una funcion premium cambie, intentaremos mostrarlo dentro de la aplicacion antes de que afecte tu flujo de uso.",
    ],
  },
  {
    id: "limits",
    title: "Limitacion de responsabilidad",
    icon: FileText,
    tone: "slate",
    paragraphs: [
      "Hacemos esfuerzos razonables para mantener la plataforma estable, pero no garantizamos que el servicio este libre de interrupciones o errores.",
      "Fitbalance no se hace responsable por decisiones tomadas exclusivamente a partir de estimaciones automatizadas, calculos o vistas previas.",
    ],
  },
  {
    id: "updates",
    title: "Cambios en estos terminos",
    icon: Sparkles,
    tone: "emerald",
    paragraphs: [
      "Podemos ajustar estos terminos para reflejar mejoras del producto, cambios legales o nuevas capacidades de la aplicacion.",
      "Si el cambio es importante, mostraremos un aviso dentro de la app para que puedas revisarlo antes de seguir usando el servicio.",
    ],
  },
];