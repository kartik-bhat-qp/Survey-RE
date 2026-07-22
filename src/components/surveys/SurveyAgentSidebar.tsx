'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  buildResearchAgentUserContent,
  createResearchAgentFileAttachment,
  createResearchAgentMessageId,
  createResearchAgentPastedImageAttachment,
  createResearchAgentSessionId,
  estimateResearchAgentContextUsage,
  formatResearchAgentAttachmentSize,
  generateSurveyChangesFromAiPrompt,
  getResearchAgentHistorySeed,
  RESEARCH_AGENT_CONTEXT_MAX_TOKENS,
  RESEARCH_AGENT_BASE_CONTEXT_TOKENS,
  RESEARCH_AGENT_DISTRIBUTE_BASE_CONTEXT_TOKENS,
  RESEARCH_AGENT_FILE_ACCEPT,
  revokeResearchAgentAttachmentPreview,
  SURVEY_AI_CAPABILITY_PILLS,
  SURVEY_AI_EXAMPLE_PROMPTS,
  SURVEY_AI_GREETING,
  validateResearchAgentAttachment,
  type ResearchAgentAttachment,
  type ResearchAgentChatMessage,
  type ResearchAgentChatSession,
  type ResearchAgentContext,
  type SurveyAiGenerationResult,
} from '@/data/mock-survey-ai-agent';
import { formatRelativeDate, truncate } from '@/data/mock-utils';
import { ResearchAgentContextUsage } from '@/components/surveys/ResearchAgentContextUsage';
import { SurveyAgentThinkingOverlay } from '@/components/surveys/SurveyAgentThinkingOverlay';
import styles from './SurveyAgentSidebar.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface SurveyAgentSidebarProps {
  open: boolean;
  surveyId?: number;
  agentContext?: ResearchAgentContext;
  placement?: 'left' | 'right';
  /** Viewport/parent = overlay; inline = in-flow flex sibling that compresses content. */
  layout?: 'viewport' | 'parent' | 'inline';
  onClose: () => void;
  onGenerated?: (result: SurveyAiGenerationResult) => void;
  onSubmit?: (prompt: string) => Promise<SurveyAiGenerationResult>;
  greeting?: string;
  examplePrompts?: ReadonlyArray<{ id: string; text: string }>;
  capabilityPills?: typeof SURVEY_AI_CAPABILITY_PILLS;
  aboutMessage?: string;
  baseContextTokens?: number;
}

function getSidebarShellLayoutClass(
  layout: 'viewport' | 'parent' | 'inline'
): string {
  switch (layout) {
    case 'inline':
      return styles.sidebarShellInline;
    case 'parent':
      return styles.sidebarShellParent;
    default:
      return styles.sidebarShellViewport;
  }
}

function cloneHistorySessions(sessions: ResearchAgentChatSession[]): ResearchAgentChatSession[] {
  return sessions.map((session) => ({
    ...session,
    messages: session.messages.map((message) => ({ ...message })),
  }));
}

export function SurveyAgentSidebar({
  open,
  surveyId = 0,
  agentContext = 'workspace',
  placement = 'right',
  layout = 'viewport',
  onClose,
  onGenerated,
  onSubmit,
  greeting = SURVEY_AI_GREETING,
  examplePrompts = SURVEY_AI_EXAMPLE_PROMPTS,
  capabilityPills = SURVEY_AI_CAPABILITY_PILLS,
  aboutMessage = 'Research agent helps you build, edit, and improve your survey with AI',
  baseContextTokens = RESEARCH_AGENT_BASE_CONTEXT_TOKENS,
}: SurveyAgentSidebarProps) {
  const { showToast } = useWuShowToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ResearchAgentChatSession[]>(() =>
    cloneHistorySessions(getResearchAgentHistorySeed(agentContext))
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ResearchAgentAttachment[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef<ResearchAgentAttachment[]>(attachments);
  attachmentsRef.current = attachments;

  const contextUsageTokens = useMemo(
    () => estimateResearchAgentContextUsage(prompt, baseContextTokens, attachments.length),
    [attachments.length, baseContextTokens, prompt]
  );

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions]
  );

  const activeMessages = activeSession?.messages ?? [];

  const imageAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.kind === 'image'),
    [attachments]
  );

  const fileAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.kind === 'file'),
    [attachments]
  );

  const resetPrompt = useCallback((): void => {
    setPrompt('');
  }, []);

  const clearAttachments = useCallback((): void => {
    setAttachments((current) => {
      current.forEach((attachment) => revokeResearchAgentAttachmentPreview(attachment));
      return [];
    });
  }, []);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) =>
        revokeResearchAgentAttachmentPreview(attachment)
      );
    };
  }, []);

  const appendMessagesToHistory = useCallback(
    (userContent: string, assistantContent: string): void => {
      const createdAt = new Date().toISOString();
      const userMessage: ResearchAgentChatMessage = {
        id: createResearchAgentMessageId(),
        role: 'user',
        content: userContent,
        createdAt,
      };
      const assistantMessage: ResearchAgentChatMessage = {
        id: createResearchAgentMessageId(),
        role: 'assistant',
        content: assistantContent,
        createdAt,
      };

      if (activeSessionId) {
        setSessions((current) =>
          current.map((session) =>
            session.id === activeSessionId
              ? {
                  ...session,
                  title: session.title || truncate(userContent, 52),
                  preview: userContent,
                  updatedAt: assistantMessage.createdAt,
                  messages: [...session.messages, userMessage, assistantMessage],
                }
              : session
          )
        );
        return;
      }

      const newSession: ResearchAgentChatSession = {
        id: createResearchAgentSessionId(),
        title: truncate(userContent, 52),
        preview: userContent,
        updatedAt: assistantMessage.createdAt,
        messages: [userMessage, assistantMessage],
      };

      setSessions((current) => [newSession, ...current]);
      setActiveSessionId(newSession.id);
    },
    [activeSessionId]
  );

  function handleClose(): void {
    if (isGenerating) return;
    resetPrompt();
    clearAttachments();
    setHistoryOpen(false);
    onClose();
  }

  function handleNewChat(): void {
    if (isGenerating) return;
    setActiveSessionId(null);
    resetPrompt();
    clearAttachments();
    setHistoryOpen(false);
    showToast({ message: 'Started a new research agent chat', variant: 'info' });
  }

  function handleToggleHistory(): void {
    if (isGenerating) return;
    setHistoryOpen((current) => !current);
  }

  function handleSelectSession(sessionId: string): void {
    if (isGenerating) return;
    setActiveSessionId(sessionId);
    resetPrompt();
    setHistoryOpen(false);
  }

  async function handleSubmit(): Promise<void> {
    if (isGenerating || (!prompt.trim() && attachments.length === 0)) return;

    const submittedPrompt = prompt.trim();
    const userContent = buildResearchAgentUserContent(submittedPrompt, attachments);
    setIsGenerating(true);
    try {
      const result = onSubmit
        ? await onSubmit(submittedPrompt || userContent)
        : await generateSurveyChangesFromAiPrompt(submittedPrompt || userContent, surveyId);
      onGenerated?.(result);
      appendMessagesToHistory(userContent, result.summary);
      showToast({ message: result.summary, variant: 'success' });
      resetPrompt();
      clearAttachments();
      window.requestAnimationFrame(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Unable to update survey',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleClearAllAttachments(): void {
    if (attachments.length === 0) return;
    clearAttachments();
    showToast({ message: 'All attachments removed', variant: 'info' });
  }

  function handleAttachClick(): void {
    fileInputRef.current?.click();
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>): void {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selectedFiles.length === 0) return;

    const nextAttachments: ResearchAgentAttachment[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      const validationError = validateResearchAgentAttachment(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }
      if (
        attachments.some(
          (attachment) => attachment.name === file.name && attachment.size === file.size
        )
      ) {
        errors.push(`${file.name} is already attached.`);
        continue;
      }
      nextAttachments.push(createResearchAgentFileAttachment(file));
    }

    if (nextAttachments.length > 0) {
      setAttachments((current) => [...current, ...nextAttachments]);
      showToast({
        message:
          nextAttachments.length === 1
            ? `"${nextAttachments[0].name}" attached`
            : `${nextAttachments.length} files attached`,
        variant: 'success',
      });
    }

    if (errors.length > 0) {
      showToast({ message: errors[0], variant: 'error' });
    }
  }

  function handleRemoveAttachment(attachmentId: string): void {
    setAttachments((current) => {
      const attachment = current.find((entry) => entry.id === attachmentId);
      if (attachment) {
        revokeResearchAgentAttachmentPreview(attachment);
      }
      return current.filter((entry) => entry.id !== attachmentId);
    });
  }

  function handlePromptPaste(event: React.ClipboardEvent<HTMLTextAreaElement>): void {
    const clipboardItems = Array.from(event.clipboardData?.items ?? []);
    const imageItem = clipboardItems.find((item) => item.type.startsWith('image/'));
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    event.preventDefault();

    const validationError = validateResearchAgentAttachment(file);
    if (validationError) {
      showToast({ message: validationError, variant: 'error' });
      return;
    }

    const imageCount = attachments.filter((attachment) => attachment.kind === 'image').length;
    const pastedAttachment = createResearchAgentPastedImageAttachment(file, imageCount);

    setAttachments((current) => [...current, pastedAttachment]);
    showToast({ message: 'Pasted image attached', variant: 'success' });
  }

  function handlePromptKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function applyPrompt(text: string): void {
    setPrompt(text);
    inputRef.current?.focus();
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <SurveyAgentThinkingOverlay open={isGenerating} />
      <div
        className={`${styles.sidebarShell} ${getSidebarShellLayoutClass(layout)} ${
          layout === 'inline' && agentContext === 'workspace'
            ? styles.sidebarShellWorkspace
            : ''
        } ${
          placement === 'left' ? styles.sidebarShellLeft : styles.sidebarShellRight
        }`}
      >
        {historyOpen ? (
          <aside className={styles.historyPanel} aria-label="Chat history">
            {sessions.length === 0 ? (
              <p className={styles.historyEmpty}>No past conversations yet</p>
            ) : (
              <ul className={styles.historyList}>
                {sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      type="button"
                      className={`${styles.historyItem} ${
                        activeSessionId === session.id ? styles.historyItemActive : ''
                      }`}
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <span className={styles.historyItemTitle}>{session.title}</span>
                      <span className={styles.historyItemMeta}>
                        {formatRelativeDate(session.updatedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        ) : null}

        <aside className={styles.sidebar} aria-label="Research agent">
          <header className={styles.header}>
            <div className={styles.headerLeading}>
              <WuTooltip content="Chat history" position="bottom">
                <button
                  type="button"
                  className={`${styles.headerIconBtn} ${styles.headerHistoryBtn} ${
                    historyOpen ? styles.headerHistoryBtnActive : ''
                  }`}
                  aria-label="Chat history"
                  aria-pressed={historyOpen}
                  title="Chat history"
                  onClick={handleToggleHistory}
                >
                  <span className="wm-history" aria-hidden />
                </button>
              </WuTooltip>
              <div className={styles.headerTitleRow}>
                <h2 className={styles.headerTitle}>Research Agent</h2>
                <span className={styles.headerAvatar} aria-hidden>
                  <span className={`wc-ai ${styles.headerAvatarIcon}`} />
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.headerIconBtn} ${styles.headerHelpBtn}`}
                aria-label="About research agent"
                title="About research agent"
                onClick={() =>
                  showToast({
                    message: aboutMessage,
                    variant: 'info',
                  })
                }
              >
                <span className={`wm-help-outline ${styles.headerHelpIcon}`} aria-hidden />
              </button>
              <button
                type="button"
                className={styles.headerIconBtn}
                aria-label="New chat"
                title="New chat"
                onClick={handleNewChat}
              >
                <span className="wm-add" aria-hidden />
              </button>
              <button
                type="button"
                className={styles.headerIconBtn}
                aria-label="Close research agent"
                title="Close"
                onClick={handleClose}
              >
                <span className="wm-close" aria-hidden />
              </button>
            </div>
          </header>

          <div ref={bodyRef} className={styles.body}>
            {activeMessages.length > 0 ? (
              <div className={styles.messageList}>
                {activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === 'user' ? styles.userMessage : styles.assistantMessage
                    }
                  >
                    <p className={styles.messageText}>{message.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className={styles.greeting}>{greeting}</p>

                <div className={styles.exampleList}>
                  {examplePrompts.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      className={styles.exampleCard}
                      onClick={() => applyPrompt(example.text)}
                    >
                      {example.text}
                    </button>
                  ))}
                </div>

                <div className={styles.capabilities}>
                  <p className={styles.capabilitiesLabel}>I can also:</p>
                  <div className={styles.capabilityPills}>
                    {capabilityPills.map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        className={styles.capabilityPill}
                        onClick={() => applyPrompt(pill.prompt ?? pill.label)}
                      >
                        {pill.icon ? (
                          <span
                            className={`${pill.icon} ${styles.capabilityPillIcon} ${
                              pill.id === 'import-word'
                                ? styles.capabilityPillIconWord
                                : pill.id === 'import-pdf'
                                  ? styles.capabilityPillIconPdf
                                  : ''
                            }`}
                            aria-hidden
                          />
                        ) : null}
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <footer className={styles.footer}>
            {attachments.length > 0 ? (
              <div className={styles.attachmentTray}>
                <div className={styles.attachmentTrayHeader}>
                  <span className={styles.attachmentCount}>
                    {attachments.length} attachment{attachments.length === 1 ? '' : 's'}
                  </span>
                  {attachments.length > 1 ? (
                    <button
                      type="button"
                      className={styles.clearAttachmentsBtn}
                      onClick={handleClearAllAttachments}
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>

                {imageAttachments.length > 0 ? (
                  <ul className={styles.imageAttachmentStrip} aria-label="Attached images">
                    {imageAttachments.map((attachment) => (
                      <li key={attachment.id} className={styles.imageAttachmentItem}>
                        {attachment.previewUrl ? (
                          <img
                            src={attachment.previewUrl}
                            alt=""
                            className={styles.imageAttachmentThumb}
                            title={attachment.name}
                          />
                        ) : null}
                        <button
                          type="button"
                          className={styles.imageAttachmentRemove}
                          aria-label={`Remove ${attachment.name}`}
                          onClick={() => handleRemoveAttachment(attachment.id)}
                        >
                          <span className="wm-close" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {fileAttachments.length > 0 ? (
                  <ul className={styles.fileAttachmentList} aria-label="Attached files">
                    {fileAttachments.map((attachment) => (
                      <li key={attachment.id} className={styles.fileAttachmentItem}>
                        <span className="wm-insert-drive-file" aria-hidden />
                        <span className={styles.fileAttachmentName} title={attachment.name}>
                          {attachment.name}
                        </span>
                        <span className={styles.fileAttachmentSize}>
                          {formatResearchAgentAttachmentSize(attachment.size)}
                        </span>
                        <button
                          type="button"
                          className={styles.fileAttachmentRemove}
                          aria-label={`Remove ${attachment.name}`}
                          onClick={() => handleRemoveAttachment(attachment.id)}
                        >
                          <span className="wm-close" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept={RESEARCH_AGENT_FILE_ACCEPT}
              className={styles.hiddenFileInput}
              aria-hidden
              tabIndex={-1}
              multiple
              onChange={handleFilesSelected}
            />
            <div className={styles.inputWrap}>
              <button
                type="button"
                className={styles.attachBtn}
                aria-label="Attach file"
                title="Attach file"
                onClick={handleAttachClick}
                onMouseDown={(event) => event.preventDefault()}
              >
                <span className="wm-attach-file" aria-hidden />
              </button>
              <textarea
                ref={inputRef}
                className={styles.input}
                rows={2}
                value={prompt}
                placeholder="Describe what you'd like to do..."
                aria-label="Describe what you'd like to do"
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handlePromptKeyDown}
                onPaste={handlePromptPaste}
              />
              <ResearchAgentContextUsage
                usedTokens={contextUsageTokens}
                maxTokens={RESEARCH_AGENT_CONTEXT_MAX_TOKENS}
              />
              <button
                type="button"
                className={styles.sendBtn}
                aria-label="Send"
                title="Send"
                disabled={isGenerating || (!prompt.trim() && attachments.length === 0)}
                onClick={() => void handleSubmit()}
              >
                <span className="wm-send" aria-hidden />
              </button>
            </div>
          </footer>
        </aside>
      </div>
    </>
  );
}
