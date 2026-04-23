import { ChevronRight, Crown, type LucideIcon } from "lucide-react";

import type {
  ApplicationActionSetting,
  ApplicationLinkSetting,
  ApplicationSettingItem,
  ApplicationSwitchSetting,
} from "../data/application-settings";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ApplicationSettingRowProps = {
  item: ApplicationSettingItem;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function SettingIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: "teal" | "rose" | "slate" }) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-2xl",
        tone === "rose" ? "bg-rose-50 text-rose-600" : tone === "slate" ? "bg-slate-100 text-slate-500" : "bg-teal-50 text-teal-600"
      )}
    >
      <Icon className="size-4" />
    </div>
  );
}

export function ApplicationSettingRow({ item, checked, onCheckedChange }: ApplicationSettingRowProps) {
  if (item.kind === "switch") {
    const switchItem = item as ApplicationSwitchSetting;

    return (
      <div className="flex items-start gap-3 px-4 py-4">
        <SettingIcon icon={switchItem.icon} tone="teal" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">{switchItem.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{switchItem.description}</p>
        </div>

        <Switch
          checked={checked ?? switchItem.defaultChecked}
          onCheckedChange={(nextChecked) => onCheckedChange?.(nextChecked)}
        />
      </div>
    );
  }

  if (item.kind === "action") {
    const actionItem = item as ApplicationActionSetting;

    return (
      <div className="flex items-start gap-3 px-4 py-4">
        <SettingIcon icon={actionItem.icon} tone="rose" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-rose-600">{actionItem.title}</p>
          {actionItem.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{actionItem.description}</p> : null}
        </div>

        <span className="shrink-0 pt-0.5 text-sm font-semibold text-rose-500">{actionItem.rightLabel}</span>
      </div>
    );
  }

  const linkItem = item as ApplicationLinkSetting;

  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <SettingIcon icon={linkItem.icon} tone="teal" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">{linkItem.title}</p>
        {linkItem.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{linkItem.description}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-2 pt-0.5">
        {linkItem.rightLabel ? <span className="text-sm font-medium text-emerald-600">{linkItem.rightLabel}</span> : null}

        {linkItem.premium ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
            <Crown className="size-3.5" />
            Premium
          </span>
        ) : null}

        <ChevronRight className="size-4 text-slate-400" />
      </div>
    </div>
  );
}
