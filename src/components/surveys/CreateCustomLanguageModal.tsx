'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  collectSurveyTranslationStrings,
  downloadSurveyTranslationTemplate,
  parseSurveyTranslationXlsx,
  type SurveyTranslationImportSummary,
} from '@/data/mock-survey-language-translations';
import {
  createCustomSurveyLanguage,
  getAddableSurveyLanguageById,
  getAddLanguagesCatalog,
  isSurveyLanguageNameTaken,
  type SurveyLanguageTextDirection,
  type SurveyLanguageVersion,
} from '@/data/mock-survey-languages';
import mappingStyles from './AddVariableMappingModal.module.css';
import styles from './CreateCustomLanguageModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const TEXT_DIRECTION_OPTIONS: {
  value: SurveyLanguageTextDirection;
  label: string;
}[] = [
  { value: 'ltr', label: 'Left to right' },
  { value: 'rtl', label: 'Right to left' },
];

interface CreateCustomLanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languages: SurveyLanguageVersion[];
  questions: SurveyQuestion[];
  onCreate: (language: SurveyLanguageVersion) => void;
}

export function CreateCustomLanguageModal({
  open,
  onOpenChange,
  languages,
  questions,
  onCreate,
}: CreateCustomLanguageModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultLanguage = useMemo(
    () => languages.find((language) => language.isDefault) ?? languages[0],
    [languages]
  );

  const translationRows = useMemo(
    () => collectSurveyTranslationStrings(questions),
    [questions]
  );

  /** Same featured + alphabetical catalog as the Add Languages dropdown. */
  const addLanguagesOptions = useMemo(
    () =>
      getAddLanguagesCatalog().map((language) => ({
        value: language.id,
        label: language.name,
      })),
    []
  );

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [baseId, setBaseId] = useState(defaultLanguage?.id ?? 'en');
  const [fallbackId, setFallbackId] = useState(defaultLanguage?.id ?? 'en');
  const [textDirection, setTextDirection] = useState<SurveyLanguageTextDirection>('ltr');
  const [importSummary, setImportSummary] = useState<SurveyTranslationImportSummary | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const defaultId = defaultLanguage?.id ?? 'en';
    setName('');
    setNameError(null);
    setBaseId(defaultId);
    setFallbackId(defaultId);
    setTextDirection('ltr');
    setImportSummary(null);
    setImportError(null);
    setIsParsing(false);
  }, [open, defaultLanguage?.id]);

  const selectedBase =
    getAddableSurveyLanguageById(baseId) ??
    getAddableSurveyLanguageById('en') ??
    getAddLanguagesCatalog()[0];
  const selectedFallback =
    getAddableSurveyLanguageById(fallbackId) ??
    getAddableSurveyLanguageById('en') ??
    getAddLanguagesCatalog()[0];
  const canCreate =
    name.trim().length > 0 && selectedBase != null && selectedFallback != null;

  async function handleDownloadTemplate(): Promise<void> {
    try {
      await downloadSurveyTranslationTemplate(translationRows);
      showToast({ message: 'Translation template downloaded', variant: 'success' });
    } catch {
      showToast({ message: 'Unable to download template', variant: 'error' });
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;

    setIsParsing(true);
    setImportError(null);
    const result = await parseSurveyTranslationXlsx(file, translationRows);
    setIsParsing(false);

    if (!result.ok) {
      setImportSummary(null);
      setImportError(result.message);
      return;
    }

    setImportSummary(result.summary);
    setImportError(null);
  }

  function handleCreate(): void {
    const trimmed = name.trim();
    if (!trimmed || !selectedBase || !selectedFallback) return;

    if (isSurveyLanguageNameTaken(trimmed, languages)) {
      setNameError('This language already exists.');
      return;
    }

    const language = createCustomSurveyLanguage({
      name: trimmed,
      baseLanguage: selectedBase,
      fallbackLanguage: selectedFallback,
      textDirection,
      translatedCount: importSummary?.translatedCount ?? 0,
      totalStrings: importSummary?.totalStrings ?? translationRows.length,
    });

    onCreate(language);
    onOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      variant="action"
      size="md"
      className={mappingStyles.modal}
    >
      <WuModalHeader className={mappingStyles.header}>
        <span className={mappingStyles.headerTitle}>Create custom language</span>
      </WuModalHeader>
      <WuModalContent className={mappingStyles.content}>
        <p className={mappingStyles.copySurveyCopy}>
          Add translations by importing a file. Missing text shows in the fallback language.
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-['Fira_Sans',sans-serif] text-sm font-semibold text-slate-700">
              Language name
            </span>
            <WuInput
              variant="outlined"
              placeholder="Shown to respondents"
              value={name}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'custom-language-name-error' : undefined}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setName(event.target.value);
                if (nameError) setNameError(null);
              }}
            />
            {nameError ? (
              <span
                id="custom-language-name-error"
                className="font-['Fira_Sans',sans-serif] text-xs text-red-600"
                role="alert"
              >
                {nameError}
              </span>
            ) : null}
          </label>

          <div className="flex w-full flex-col gap-1.5">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex w-full min-w-0 flex-col gap-1.5">
                <span
                  id="custom-language-base-label"
                  className="font-['Fira_Sans',sans-serif] text-sm font-semibold text-slate-700"
                >
                  Base language
                </span>
                <div className={styles.languageSelect}>
                  <WuSelect
                    className="w-full"
                    data={addLanguagesOptions}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={
                      addLanguagesOptions.find((option) => option.value === selectedBase.id) ??
                      addLanguagesOptions[0]
                    }
                    onSelect={(item) => {
                      const selected = item as { value: string; label: string } | null;
                      if (selected) setBaseId(selected.value);
                    }}
                    variant="outlined"
                    aria-labelledby="custom-language-base-label"
                    // Avoid Virtuoso inside WuModal — it collapses the list to a 2px blue line.
                    virtualizedThreshold={10_000}
                    maxHeight={280}
                  />
                </div>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-1.5">
                <span
                  id="custom-language-fallback-label"
                  className="font-['Fira_Sans',sans-serif] text-sm font-semibold text-slate-700"
                >
                  Fallback language
                </span>
                <div className={styles.languageSelect}>
                  <WuSelect
                    className="w-full"
                    data={addLanguagesOptions}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={
                      addLanguagesOptions.find(
                        (option) => option.value === selectedFallback.id
                      ) ?? addLanguagesOptions[0]
                    }
                    onSelect={(item) => {
                      const selected = item as { value: string; label: string } | null;
                      if (selected) setFallbackId(selected.value);
                    }}
                    variant="outlined"
                    aria-labelledby="custom-language-fallback-label"
                    virtualizedThreshold={10_000}
                    maxHeight={280}
                  />
                </div>
              </div>
            </div>
            <span className="font-['Fira_Sans',sans-serif] text-xs text-slate-500">
              Fallback is used for any untranslated text, including system messages.
            </span>
          </div>

          <fieldset className="flex flex-col gap-1.5 border-0 p-0">
            <legend className="font-['Fira_Sans',sans-serif] text-sm font-semibold text-slate-700">
              Text direction
            </legend>
            <div className="flex flex-wrap gap-4 pt-1">
              {TEXT_DIRECTION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex cursor-pointer items-center gap-2 font-['Fira_Sans',sans-serif] text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    name="custom-language-text-direction"
                    value={option.value}
                    checked={textDirection === option.value}
                    onChange={() => setTextDirection(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="relative z-0 flex w-full flex-col gap-2 rounded-md border border-slate-200 bg-[#f4f7fb] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-['Fira_Sans',sans-serif] text-sm font-semibold text-slate-700">
                Translation file
              </span>
              <WuButton variant="secondary" onClick={() => void handleDownloadTemplate()}>
                Download template
              </WuButton>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(event) => void handleFileChange(event)}
            />

            <button
              type="button"
              className="flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded border border-dashed border-slate-300 bg-white px-4 py-5 text-center font-['Fira_Sans',sans-serif] text-sm text-slate-600 hover:border-[#1b87e6] hover:bg-sky-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
            >
              <span className="wm-upload text-xl text-[#1b87e6]" aria-hidden />
              <span>{isParsing ? 'Reading file…' : 'Upload .xlsx translation file'}</span>
            </button>

            {importSummary ? (
              <p className="font-['Fira_Sans',sans-serif] text-sm text-slate-700" aria-live="polite">
                {importSummary.fileName} · {importSummary.translatedCount} of{' '}
                {importSummary.totalStrings} strings translated
              </p>
            ) : null}

            {importError ? (
              <p className="font-['Fira_Sans',sans-serif] text-sm text-red-600" role="alert">
                {importError}
              </p>
            ) : null}

            <p className="font-['Fira_Sans',sans-serif] text-xs text-slate-500">
              You can skip this and import later from the languages table.
            </p>
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={mappingStyles.footer}>
          <div className={mappingStyles.footerSpacer} />
          <div className={mappingStyles.footerActions}>
            <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </WuButton>
            <WuButton onClick={handleCreate} disabled={!canCreate}>
              Create language
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
