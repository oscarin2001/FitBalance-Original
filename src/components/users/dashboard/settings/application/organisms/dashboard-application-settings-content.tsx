"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";

import {
  applicationSettingsSections,
  applicationToggleDefaults,
  type ApplicationSettingSection,
} from "../data/application-settings";
import { ApplicationSettingRow } from "../molecules/application-setting-row";
import { ApplicationSettingsSectionCard } from "../molecules/application-settings-section-card";

function isAdvancedSection(section: ApplicationSettingSection) {
  return section.id === "advanced";
}

export function DashboardApplicationSettingsContent() {
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [toggleState, setToggleState] = useState<Record<string, boolean>>(() => ({ ...applicationToggleDefaults }));

  const visibleSections = applicationSettingsSections.filter((section) => !isAdvancedSection(section));
  const advancedSection = applicationSettingsSections.find(isAdvancedSection);

  return (
    <div className="space-y-4 px-3 py-3">
      {visibleSections.map((section) => (
        <ApplicationSettingsSectionCard key={section.id} title={section.title}>
          <div className="divide-y divide-slate-100">
            {section.items.map((item) => (
              <ApplicationSettingRow
                key={item.id}
                item={item}
                checked={toggleState[item.id]}
                onCheckedChange={(checked) => setToggleState((previous) => ({ ...previous, [item.id]: checked }))}
              />
            ))}
          </div>
        </ApplicationSettingsSectionCard>
      ))}

      <button
        type="button"
        onClick={() => setShowAdvanced((previous) => !previous)}
        className="mx-auto flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
      >
        {showAdvanced ? "Ocultar campos avanzados" : "Mostrar campos avanzados"}
        <ChevronUp className={`size-4 transition-transform ${showAdvanced ? "" : "rotate-180"}`} />
      </button>

      {showAdvanced && advancedSection ? (
        <ApplicationSettingsSectionCard title={advancedSection.title}>
          <div className="divide-y divide-slate-100">
            {advancedSection.items.map((item) =>
              item.kind === "switch" ? (
                <ApplicationSettingRow
                  key={item.id}
                  item={item}
                  checked={toggleState[item.id]}
                  onCheckedChange={(checked) => setToggleState((previous) => ({ ...previous, [item.id]: checked }))}
                />
              ) : (
                <ApplicationSettingRow key={item.id} item={item} />
              )
            )}
          </div>
        </ApplicationSettingsSectionCard>
      ) : null}
    </div>
  );
}
