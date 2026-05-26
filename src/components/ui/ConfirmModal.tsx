'use client';

import { useWickUILib } from '@/components/ui/useWickUILib';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'action' | 'critical';
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'action',
  onConfirm,
}: ConfirmModalProps) {
  const wick = useWickUILib();

  function handleConfirm() {
    onConfirm();
    onOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal open onOpenChange={onOpenChange} variant={variant} size="sm">
      <WuModalHeader>{title}</WuModalHeader>
      <WuModalContent>
        <p className="text-sm text-gray-600">{description}</p>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton color={variant === 'critical' ? 'error' : 'primary'} onClick={handleConfirm}>
          {confirmLabel}
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
