import type { LucideIcon } from "lucide-react";
import { Headphones, LifeBuoy } from "lucide-react";

export type SupportCardTone = "emerald" | "slate";

export type SupportContentCard = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTone: SupportCardTone;
};

export const supportContentCards: SupportContentCard[] = [
  {
    id: "knowledge-base",
    icon: LifeBuoy,
    title: "¿Tienes alguna pregunta?",
    description:
      "¿Tienes alguna pregunta sobre nuestras funciones o necesitas ayuda con facturación? Consulta nuestra base de conocimiento.",
    ctaLabel: "Visitar base de conocimiento",
    ctaTone: "emerald",
  },
  {
    id: "support-team",
    icon: Headphones,
    title: "¿Todavía tienes preguntas?",
    description: "Estamos aquí para ayudarte. ¡Comunícate con nuestro equipo de soporte!",
    ctaLabel: "Comunicarse con soporte",
    ctaTone: "slate",
  },
];