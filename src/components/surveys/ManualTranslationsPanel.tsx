'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyLanguageVersion } from '@/data/mock-survey-languages';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  GENERAL_TEXT_TRANSLATION_GROUPS,
  MANUAL_TRANSLATION_TABS,
  countTranslationProgress,
  flattenTranslationGroups,
  getQuestionTranslationBlocks,
  isRtlLanguageId,
  seedArabicTranslations,
  type ManualTranslationField,
  type ManualTranslationTab,
} from '@/data/mock-manual-translations';
import styles from './ManualTranslationsPanel.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

interface ManualTranslationsPanelProps {
  questions: SurveyQuestion[];
  languages: SurveyLanguageVersion[];
  onBack: () => void;
  onProgressChange: (languageId: string, percent: number) => void;
}

function TranslationPair({
  field,
  value,
  rtl,
  onChange,
}: {
  field: ManualTranslationField;
  value: string;
  rtl: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.pair}>
      <div className={styles.sourceField}>{field.source}</div>
      <WuInput
        variant="outlined"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`Translation for ${field.source}`}
        className={rtl ? styles.rtlInput : styles.ltrInput}
        dir={rtl ? 'rtl' : 'ltr'}
      />
    </div>
  );
}

export function ManualTranslationsPanel({
  questions,
  languages,
  onBack,
  onProgressChange,
}: ManualTranslationsPanelProps) {
  const [activeTab, setActiveTab] = useState<ManualTranslationTab>('question-answer');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [valuesByLanguage, setValuesByLanguage] = useState<Record<string, Record<string, string>>>(
    {}
  );

  const defaultLanguage = languages.find((language) => language.isDefault);
  const targetLanguage = languages.find((language) => !language.isDefault);
  const targetLanguageId = targetLanguage?.id;
  const rtl = targetLanguage ? isRtlLanguageId(targetLanguage.id) : false;
  const seededLanguageRef = useRef<string | null>(null);

  const questionBlocks = useMemo(
    () => getQuestionTranslationBlocks(questions),
    [questions]
  );

  const allFields = useMemo(() => {
    const questionFields = questionBlocks.flatMap((block) =>
      flattenTranslationGroups(block.groups)
    );
    return [...flattenTranslationGroups(GENERAL_TEXT_TRANSLATION_GROUPS), ...questionFields];
  }, [questionBlocks]);

  const currentValues = targetLanguage
    ? (valuesByLanguage[targetLanguage.id] ?? {})
    : {};

  useEffect(() => {
    if (!targetLanguageId) return;
    if (seededLanguageRef.current === targetLanguageId) return;
    seededLanguageRef.current = targetLanguageId;
    const seeded =
      targetLanguageId === 'ar' || targetLanguageId === 'ar-sa'
        ? seedArabicTranslations(allFields)
        : {};
    setValuesByLanguage((prev) => ({ ...prev, [targetLanguageId]: seeded }));
    onProgressChange(targetLanguageId, countTranslationProgress(allFields, seeded));
  }, [allFields, onProgressChange, targetLanguageId]);

  const progressPercent = useMemo(
    () => countTranslationProgress(allFields, currentValues),
    [allFields, currentValues]
  );

  function updateField(fieldId: string, value: string): void {
    if (!targetLanguage) return;
    setValuesByLanguage((prev) => {
      const base = prev[targetLanguage.id] ?? currentValues;
      const nextForLanguage = { ...base, [fieldId]: value };
      const next = { ...prev, [targetLanguage.id]: nextForLanguage };
      onProgressChange(
        targetLanguage.id,
        countTranslationProgress(allFields, nextForLanguage)
      );
      return next;
    });
  }

  function toggleQuestion(id: string): void {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!targetLanguage || !defaultLanguage) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Add a language version to start translating</p>
        <p className={styles.emptyCopy}>
          Manual Translations compare English with another language version of this survey.
        </p>
        <WuButton variant="secondary" onClick={onBack}>
          Back to Languages
        </WuButton>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.tabs} role="tablist" aria-label="Manual translation sections">
        {MANUAL_TRANSLATION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.header}>
        <p className={styles.sourceLang}>
          {defaultLanguage.name} (Default Language)
        </p>
        <div className={styles.targetMeta}>
          <p className={styles.targetLang}>{targetLanguage.name}</p>
          <div className={styles.progressBlock}>
            <span className={styles.progressLabel}>{progressPercent}%</span>
            <span
              className={styles.progressRing}
              style={{
                background: `conic-gradient(#22c55e ${progressPercent * 3.6}deg, #e2e8f0 0deg)`,
              }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-label={`${progressPercent}% translated`}
            />
          </div>
        </div>
      </div>

      {activeTab === 'general-text' ? (
        <div className={styles.groups}>
          {GENERAL_TEXT_TRANSLATION_GROUPS.map((group) => (
            <section key={group.id} className={styles.group} aria-label={group.label}>
              {group.fields.map((field) => (
                <TranslationPair
                  key={field.id}
                  field={field}
                  value={currentValues[field.id] ?? ''}
                  rtl={rtl}
                  onChange={(value) => updateField(field.id, value)}
                />
              ))}
            </section>
          ))}
        </div>
      ) : questionBlocks.length === 0 ? (
        <p className={styles.emptyCopy}>No questions are available to translate.</p>
      ) : (
        <ul className={styles.questionList}>
          {questionBlocks.map((block) => {
            const expanded = expandedIds.has(block.id);
            return (
              <li key={block.id} className={styles.questionItem}>
                <button
                  type="button"
                  className={styles.questionToggle}
                  aria-expanded={expanded}
                  onClick={() => toggleQuestion(block.id)}
                >
                  <span className={styles.questionTitle}>{block.title}</span>
                  <span
                    className={`${expanded ? 'wm-arrow-drop-up' : 'wm-arrow-drop-down'} ${styles.chevron}`}
                    aria-hidden
                  />
                </button>
                {expanded ? (
                  <div className={styles.questionBody}>
                    {block.groups.map((group) => (
                      <div key={group.id} className={styles.questionGroup}>
                        <p className={styles.groupLabel}>{group.label}</p>
                        {group.fields.map((field) => (
                          <TranslationPair
                            key={field.id}
                            field={field}
                            value={currentValues[field.id] ?? ''}
                            rtl={rtl}
                            onChange={(value) => updateField(field.id, value)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
