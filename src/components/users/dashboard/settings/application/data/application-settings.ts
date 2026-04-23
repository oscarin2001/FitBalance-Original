import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Calculator,
  ChevronRight,
  ChefHat,
  Clock3,
  Flame,
  Globe,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

export type ApplicationSwitchSetting = {
  kind: "switch";
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultChecked: boolean;
};

export type ApplicationLinkSetting = {
  kind: "link";
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  rightLabel?: string;
  premium?: boolean;
};

export type ApplicationActionSetting = {
  kind: "action";
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  rightLabel: string;
};

export type ApplicationSettingItem = ApplicationSwitchSetting | ApplicationLinkSetting | ApplicationActionSetting;

export type ApplicationSettingSection = {
  id: string;
  title: string;
  items: ApplicationSettingItem[];
};

export const applicationToggleDefaults = {
  deductCaloriesBurned: true,
  deductMacrosBurned: true,
  mealHoursTracking: true,
  decimalValues: false,
  ketoRatings: true,
  dailyHealth: true,
  goalRecommendations: true,
  incomingFriendRequests: true,
} as const;

export const applicationSettingsSections: ApplicationSettingSection[] = [
  {
    id: "macros",
    title: "Configuración de macros",
    items: [
      {
        kind: "link",
        id: "carbsCounter",
        title: "Carbos a contar",
        description:
          "Los tipos de carbohidratos que quieres contar: carbos totales o carbos netos (carbos totales menos fibras, alcoholes de azúcar y alulosa). La mayoría de las personas que hacen la dieta Keto cuentan los carbos netos. Si tienes diabetes, consulta con tu médico antes de seleccionar una opción.",
        icon: Flame,
        rightLabel: "Carbos netos",
      },
      {
        kind: "switch",
        id: "deductCaloriesBurned",
        title: "Habilitar deducir Calorías quemadas",
        description:
          "Resta las Calorías quemadas cuando te ejercitas de tus totales diarios. Para obtener mejores resultados cuando esté habilitada esta opción, asegúrate de que tu nivel de actividad en tu perfil excluya los entrenamientos registrados y vuelve a calcular tus macros.",
        icon: Sparkles,
        defaultChecked: true,
      },
      {
        kind: "switch",
        id: "deductMacrosBurned",
        title: "Habilitar deducir macros quemados",
        description:
          "Resta los macros quemados cuando te ejercitas de tus totales diarios. Calculamos estos macros en función de las Calorías quemadas y tus metas de macros.",
        icon: Flame,
        defaultChecked: true,
      },
    ],
  },
  {
    id: "additional",
    title: "Ajustes adicionales",
    items: [
      {
        kind: "link",
        id: "language",
        title: "Idioma de la aplicación",
        icon: Globe,
        rightLabel: "Español",
      },
      {
        kind: "switch",
        id: "mealHoursTracking",
        title: "Habilitar monitoreo de horas de comidas",
        description:
          "Registra automáticamente la hora de cada comida. Esto es útil si deseas monitorear tus horas de ayuno intermitente o si deseas llevar registros minuciosos de tu dieta.",
        icon: Clock3,
        defaultChecked: true,
      },
      {
        kind: "switch",
        id: "decimalValues",
        title: "Habilitar valores decimales",
        description:
          "Mostrar tus macros totales redondeados a un punto decimal para una mayor precisión al monitorear alimentos.",
        icon: Calculator,
        defaultChecked: false,
      },
      {
        kind: "switch",
        id: "ketoRatings",
        title: "Habilitar calificaciones keto",
        description:
          "Calcular y mostrar una calificación keto para cada alimento, que es una estimación de qué tan bien encaja un alimento en una dieta keto. Si no estás haciendo la dieta keto, puedes deshabilitar esta función.",
        icon: ShieldCheck,
        defaultChecked: true,
      },
      {
        kind: "switch",
        id: "dailyHealth",
        title: "Habilitar salud en el registro diario",
        description: "Mostrar el saludo y las rachas en el registro diario.",
        icon: HeartPulse,
        defaultChecked: true,
      },
      {
        kind: "switch",
        id: "goalRecommendations",
        title: "Habilitar recomendaciones de metas de comida",
        description:
          "Mostrar los carbohidratos recomendados y las metas calóricas para cada comida en el registro diario.",
        icon: ChefHat,
        defaultChecked: true,
      },
    ],
  },
  {
    id: "social",
    title: "Ajustes sociales",
    items: [
      {
        kind: "switch",
        id: "incomingFriendRequests",
        title: "Permitir solicitudes de amistad entrantes",
        description: "Permitir solicitudes de amistad de otros usuarios que no tengan tu correo electrónico.",
        icon: Bell,
        defaultChecked: true,
      },
    ],
  },
  {
    id: "meals",
    title: "Preferencias de comidas",
    items: [
      {
        kind: "link",
        id: "customMeals",
        title: "Personalizar comidas",
        icon: ChefHat,
        premium: true,
      },
      {
        kind: "link",
        id: "mealHours",
        title: "Horario de las comidas",
        icon: Clock3,
        premium: true,
      },
    ],
  },
  {
    id: "advanced",
    title: "Avanzado",
    items: [
      {
        kind: "action",
        id: "clearPlannedFoods",
        title: "Eliminar todos los alimentos planificados",
        icon: Trash2,
        rightLabel: "Eliminar",
      },
      {
        kind: "link",
        id: "experimentalFeatures",
        title: "Funciones experimentales",
        icon: Sparkles,
      },
    ],
  },
];
