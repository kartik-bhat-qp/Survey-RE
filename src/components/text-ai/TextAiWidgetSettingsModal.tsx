'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  DEFAULT_TEXT_AI_WIDGET_TOP_N,
  getTextAiWidgetTopNSelectOption,
  parseTextAiWidgetTopN,
  TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS,
  type TextAiWidgetTopN,
  type TextAiWidgetTopNSelectOption,
} from '@/data/mock-text-ai-widget-settings';
import styles from './TextAiWidgetSettingsModal.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLabel })),
  { ssr: false }
);

interface TextAiWidgetSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topN?: TextAiWidgetTopN;
  onSave: (topN: TextAiWidgetTopN) => void;
}

export function TextAiWidgetSettingsModal({
  open,
  onOpenChange,
  topN = DEFAULT_TEXT_AI_WIDGET_TOP_N,
  onSave,
}: TextAiWidgetSettingsModalProps) {
  const wick = useWickUILib();
  const [draftTopN, setDraftTopN] = useState<TextAiWidgetTopN>(topN);

  useEffect(() => {
    if (!open) return;
    setDraftTopN(topN);
  }, [open, topN]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;
  const selectedOption = getTextAiWidgetTopNSelectOption(draftTopN);

  function handleSave(): void {
    onSave(draftTopN);
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} size="sm">
      <WuModalHeader>Widget settings</WuModalHeader>
      <WuModalContent>
        <div className={styles.content}>
          <p className={styles.description}>
            Choose how many themes or topics to show in this widget.
          </p>
          <div className={styles.field}>
            <WuLabel className={styles.label}>Display</WuLabel>
            <WuSelect
              data={[...TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS]}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedOption}
              onSelect={(option) => {
                if (!option) return;
                const next = option as TextAiWidgetTopNSelectOption;
                setDraftTopN(parseTextAiWidgetTopN(next.value));
              }}
              variant="outlined"
            />
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSave}>Save</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
