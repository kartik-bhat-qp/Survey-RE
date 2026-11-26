'use client';

import { useEffect, useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './PhishingChatSupportModal.module.css';

interface PhishingChatSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MESSAGES = [
  { from: 'system' as const, text: 'Connecting you with priority support…' },
  { from: 'agent' as const, text: 'Hi — I’m Alex from Trust & Safety. I can see your account is under a High review.' },
  { from: 'agent' as const, text: 'You can keep editing. We’ll review publish and send access as quickly as we can.' },
];

export function PhishingChatSupportModal({ open, onOpenChange }: PhishingChatSupportModalProps) {
  const wick = useWickUILib();
  const [visibleCount, setVisibleCount] = useState(1);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<string[]>([]);

  function resetChat(): void {
    setVisibleCount(1);
    setDraft('');
    setSent([]);
  }

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen) resetChat();
    onOpenChange(nextOpen);
  }

  useEffect(() => {
    if (!open) return;
    const t1 = window.setTimeout(() => setVisibleCount(2), 800);
    const t2 = window.setTimeout(() => setVisibleCount(3), 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open]);

  if (!open || !wick) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton, WuInput } = wick;

  function handleSend(): void {
    const text = draft.trim();
    if (!text) return;
    setSent((prev) => [...prev, text]);
    setDraft('');
  }

  return (
    <WuModal open onOpenChange={handleOpenChange} variant="action" size="md">
      <WuModalHeader>Chat with support</WuModalHeader>
      <WuModalContent>
        <div className={styles.thread} role="log" aria-live="polite">
          {MESSAGES.slice(0, visibleCount).map((msg, index) => (
            <div
              key={`${msg.from}-${index}`}
              className={msg.from === 'agent' ? styles.agentBubble : styles.systemBubble}
            >
              {msg.from === 'agent' ? <span className={styles.agentName}>Alex</span> : null}
              <p className={styles.bubbleText}>{msg.text}</p>
            </div>
          ))}
          {sent.map((text, index) => (
            <div key={`you-${index}`} className={styles.youBubble}>
              <span className={styles.agentName}>You</span>
              <p className={styles.bubbleText}>{text}</p>
            </div>
          ))}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.compose}>
          <WuInput
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message…"
            aria-label="Chat message"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <WuButton color="primary" onClick={handleSend}>
            Send
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
