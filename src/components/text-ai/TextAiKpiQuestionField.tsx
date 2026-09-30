"use client";

import { useId } from "react";
import dynamic from "next/dynamic";
import { TEXT_AI_KPI_DEFINITIONS, type TextAiKpiId } from "@/data/mock-text-ai-kpi-by-theme";
import styles from "./TextAiConfiguredWidget.module.css";

const WuSelect = dynamic(() => import("@npm-questionpro/wick-ui-lib").then(m => ({ default: m.WuSelect })), { ssr: false });

/** The prototype catalogue stands in for eligible outcome fields from the selected source. */
export function TextAiKpiQuestionField({ value, onChange, showDetails = true }: {
  value?: TextAiKpiId;
  onChange: (id: TextAiKpiId) => void;
  showDetails?: boolean;
}) {
  const id = useId();
  const options = TEXT_AI_KPI_DEFINITIONS.map(d => ({ value: d.id, label: `${d.code} · ${d.label}` }));
  const definition = TEXT_AI_KPI_DEFINITIONS.find(d => d.id === value);
  return <>
    <div className={styles.field}>
      <span id={id}>KPI question</span>
      <WuSelect aria-labelledby={id} placeholder="Select a KPI question" variant="outlined"
        data={options} accessorKey={{ value: "value", label: "label" }} value={options.find(o => o.value === value) ?? null}
        onSelect={option => {
          if (!option || Array.isArray(option)) return;
          const match = TEXT_AI_KPI_DEFINITIONS.find(d => d.id === (option as { value: string }).value);
          if (match) onChange(match.id);
        }} />
    </div>
    {showDetails && definition && <p className={styles.note}><strong>{definition.question}</strong><br />
      {definition.kind === "nps" ? "NPS = % promoters (9–10) − % detractors (0–6)." : definition.kind === "top-box" ? "CSAT = % of valid answers scoring 4 or 5 out of 5." : "Mean rating = average of valid answers on the 1–5 scale."}
    </p>}
    {showDetails && <p className={styles.note}>Match text and KPI answers by response ID in the same survey or dataset. Only responses with analyzed text and a valid selected KPI answer are included.</p>}
  </>;
}
