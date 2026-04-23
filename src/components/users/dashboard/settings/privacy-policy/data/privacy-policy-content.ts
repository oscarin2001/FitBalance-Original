import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Building2, CalendarDays, Globe2, LockKeyhole, ShieldCheck, Users } from "lucide-react";

export type PrivacySectionTone = "emerald" | "teal" | "slate" | "amber";

export type PrivacySection = {
  id: string;
  title: string;
  icon: LucideIcon;
  tone: PrivacySectionTone;
  paragraphs: string[];
  bullets?: string[];
};

export const privacySummaryLines = [
  "Usamos tus datos para crear planes, registrar progreso y personalizar la experiencia.",
  "Solo compartimos informacion cuando es necesario para operar el servicio o cumplir la ley.",
  "Puedes revisar, corregir o eliminar parte de tu informacion desde los ajustes de cuenta.",
];

export const privacySections: PrivacySection[] = [
  {
    id: "controller",
    title: "Responsable del tratamiento",
    icon: Building2,
    tone: "emerald",
    paragraphs: [
      "Fitbalance es operado por el equipo de producto responsable de procesar tu informacion dentro de la aplicacion.",
      "Usamos datos de contacto, perfil y salud para ofrecerte funciones relevantes, soporte y mejoras del servicio.",
    ],
    bullets: [
      "Nombre y correo de la cuenta.",
      "Datos de perfil, objetivos y configuracion.",
      "Registros asociados a tu plan, progreso y actividad dentro de la app.",
    ],
  },
  {
    id: "collection",
    title: "Datos que recopilamos",
    icon: ShieldCheck,
    tone: "teal",
    paragraphs: [
      "Recopilamos la informacion que tu mismo nos das al crear tu cuenta, completar el onboarding o modificar tu perfil.",
      "Tambien generamos datos derivados para calcular metas, mostrar resumenes y mantener la experiencia sincronizada entre pantallas.",
    ],
    bullets: [
      "Datos de cuenta y autenticacion.",
      "Medidas corporales y preferencias de entrenamiento.",
      "Metas, ajustes de dieta y contenido que guardas dentro de la app.",
    ],
  },
  {
    id: "use",
    title: "Como usamos tu informacion",
    icon: BadgeCheck,
    tone: "slate",
    paragraphs: [
      "Usamos tu informacion para mostrar tu dashboard, calcular objetivos nutricionales, enviar verificacion de cuenta y mejorar la navegacion.",
      "Tambien podemos usarla para responder solicitudes de soporte, mantener seguridad y prevenir usos indebidos del servicio.",
    ],
  },
  {
    id: "sharing",
    title: "Comparticion y terceros",
    icon: Users,
    tone: "amber",
    paragraphs: [
      "No vendemos tus datos personales. Solo los compartimos con proveedores necesarios para operar la app, por ejemplo autenticacion, correo o almacenamiento.",
      "Si una ley aplicable lo exige, podriamos divulgar informacion relevante para cumplir con un requerimiento legal o proteger la seguridad del servicio.",
    ],
  },
  {
    id: "retention",
    title: "Retencion y seguridad",
    icon: LockKeyhole,
    tone: "slate",
    paragraphs: [
      "Conservamos tus datos mientras tu cuenta exista o mientras sea necesario para prestar el servicio y cumplir obligaciones legales.",
      "Aplicamos medidas tecnicas y de acceso razonables para proteger tu informacion, aunque ningun sistema es totalmente infalible.",
    ],
  },
  {
    id: "rights",
    title: "Tus derechos y contacto",
    icon: Globe2,
    tone: "emerald",
    paragraphs: [
      "Puedes solicitar acceso, correccion o eliminacion de tus datos desde la cuenta o escribiendonos si necesitas ayuda adicional.",
      "Si tienes dudas sobre privacidad o sobre este aviso, contacta al equipo de soporte y revisaremos tu caso.",
    ],
    bullets: [
      "Actualiza tus datos desde Mi perfil.",
      "Restablece o elimina tu cuenta desde Ajustes de cuenta.",
      "Usa soporte si quieres ejercer un derecho adicional.",
    ],
  },
  {
    id: "updates",
    title: "Actualizaciones de este aviso",
    icon: CalendarDays,
    tone: "teal",
    paragraphs: [
      "Podemos actualizar esta politica cuando mejore la app, cambie la ley o agreguemos nuevas funciones que requieran aclaraciones de privacidad.",
      "Cuando el cambio sea relevante, mostraremos la actualizacion dentro de la experiencia para que puedas revisarla a tiempo.",
    ],
  },
];