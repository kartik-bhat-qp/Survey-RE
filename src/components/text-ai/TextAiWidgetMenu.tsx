'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TextAiWidgetSettingsModal } from '@/components/text-ai/TextAiWidgetSettingsModal';
import {
  DEFAULT_TEXT_AI_WIDGET_TOP_N,
  formatTextAiWidgetTopNToast,
  type TextAiWidgetTopN,
} from '@/data/mock-text-ai-widget-settings';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

interface TextAiWidgetMenuProps {
  widgetTitle?: string;
  topN?: TextAiWidgetTopN;
  onTopNChange?: (topN: TextAiWidgetTopN) => void;
  onDelete?: () => void;
}

const MENU_ITEM_CLASS =
  'flex w-full justify-start rounded-[4px] px-3 py-2 text-[13px] font-normal text-[#1f2a44] hover:bg-[#eef3f8]';

export function TextAiWidgetMenu({
  widgetTitle = 'this widget',
  topN = DEFAULT_TEXT_AI_WIDGET_TOP_N,
  onTopNChange,
  onDelete,
}: TextAiWidgetMenuProps) {
  const { showToast } = useWuShowToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  function handleSettings(): void {
    setMenuOpen(false);
    setSettingsOpen(true);
  }

  function handleSaveSettings(nextTopN: TextAiWidgetTopN): void {
    onTopNChange?.(nextTopN);
    showToast({ message: formatTextAiWidgetTopNToast(nextTopN), variant: 'success' });
  }

  function handleDeleteRequest(): void {
    setMenuOpen(false);
    setDeleteConfirmOpen(true);
  }

  function handleDeleteConfirm(): void {
    onDelete?.();
    showToast({ message: 'Widget deleted', variant: 'success' });
  }

  return (
    <>
      <WuMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        align="end"
        side="bottom"
        sideOffset={6}
        className="w-[160px] rounded-md border border-[#dbe3f0] bg-white p-1.5 shadow-lg"
        Trigger={
          <WuButton
            variant="iconOnly"
            size="sm"
            aria-label="Widget menu"
            Icon={<span className="wm-more-vert" />}
          />
        }
      >
        <WuMenuItem
          Icon={<span className="wm-settings text-[17px] text-[#536277]" aria-hidden />}
          onSelect={handleSettings}
          className={MENU_ITEM_CLASS}
        >
          Settings
        </WuMenuItem>
        <WuMenuItem
          Icon={<span className="wm-delete text-[17px] text-[#536277]" aria-hidden />}
          onSelect={handleDeleteRequest}
          className={MENU_ITEM_CLASS}
        >
          Delete
        </WuMenuItem>
      </WuMenu>

      <TextAiWidgetSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        topN={topN}
        onSave={handleSaveSettings}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete widget?"
        description={`Are you sure you want to delete ${widgetTitle}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
