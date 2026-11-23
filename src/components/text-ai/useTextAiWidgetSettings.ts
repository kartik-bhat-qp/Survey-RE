"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultTextAiWidgetSettings,
  normalizeTextAiWidgetSettings,
  saveTextAiWidgetSettings,
  type TextAiSettingsKind,
  type TextAiWidgetSettings,
} from "@/data/text-ai-widget-settings";

/** Write first, then publish the saved state. The ref serializes rapid control events. */
export function useTextAiWidgetSettings(
  key: string,
  kind: TextAiSettingsKind,
  title: string,
  readOnly: boolean,
  persist = true,
) {
  const [settings, setSettings] = useState(() =>
    defaultTextAiWidgetSettings(kind, title),
  );
  const saved = useRef(settings);
  const ready = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let next = defaultTextAiWidgetSettings(kind, title);
    try {
      if (persist) next = normalizeTextAiWidgetSettings(
        JSON.parse(localStorage.getItem(key) ?? "null"),
        kind,
        title,
      );
    } catch {
      /* Missing or corrupt records retain defaults. */
    }
    saved.current = next;
    ready.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(next);
  }, [key, kind, title, persist]);
  const update = useCallback(
    (patch: Partial<TextAiWidgetSettings>) => {
      if (readOnly || !ready.current) return;
      if (patch.name !== undefined && !patch.name.trim()) {
        setError("Enter a widget name.");
        return;
      }
      const candidate = { ...saved.current, ...patch };
      if (candidate.customAxis && candidate.minimum >= candidate.maximum) {
        setError("Axis maximum must be greater than minimum.");
        return;
      }
      if (
        candidate.responseFilter.start &&
        candidate.responseFilter.end &&
        candidate.responseFilter.start > candidate.responseFilter.end
      ) {
        setError("From must be on or before To.");
        return;
      }
      const next = normalizeTextAiWidgetSettings(candidate, kind, title);
      try {
        if (persist && !saveTextAiWidgetSettings(localStorage, key, next))
          throw Error("Storage write failed");
        saved.current = next;
        setSettings(next);
        setError("");
      } catch {
        setError(
          "Settings could not be saved. Your last saved settings are unchanged.",
        );
      }
    },
    [key, kind, title, readOnly, persist],
  );
  return { settings, error, setError, update };
}
