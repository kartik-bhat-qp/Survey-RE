'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';
import mappingStyles from './SurveyStackFieldMapping.module.css';

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

type SurveyStack = {
  id: number;
  name: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type QuestionOption = SelectOption & {
  responseOptions: string[];
};

type StackField = {
  id: number;
  dataTypeIcon: string;
  dataTypeLabel: string;
  fieldLabel: string;
  sourceOneValue: string;
  sourceTwoValue: string;
  optionMatches: string[];
};

const SURVEY_STACKS: SurveyStack[] = [
  { id: 1, name: 'Customer Experience Portfolio' },
  { id: 2, name: 'Market Insights Program' },
  { id: 3, name: 'Brand Health Benchmark' },
  { id: 4, name: 'Product Feedback Initiative' },
  { id: 5, name: 'Employee Engagement Suite' },
  { id: 6, name: 'Executive Pulse Tracker' },
  { id: 7, name: 'Compliance Readiness Review' },
];

const FIELD_OPTIONS: QuestionOption[] = [
  {
    value: 'gender',
    label: 'Please indicate your gender.',
    responseOptions: ['Male', 'Female', 'Other'],
  },
  {
    value: 'identity',
    label: 'How do you identify as?',
    responseOptions: ['Male', 'Female', 'Prefer not to answer'],
  },
  {
    value: 'age',
    label: 'What is your age range?',
    responseOptions: ['18-24', '25-34', '35-44', '45-54', '55+'],
  },
  {
    value: 'satisfaction',
    label: 'How satisfied are you overall?',
    responseOptions: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'],
  },
  {
    value: 'recommendation',
    label: 'How likely are you to recommend us?',
    responseOptions: ['Promoter', 'Passive', 'Detractor'],
  },
];

const STACK_FIELDS: StackField[] = [
  {
    id: 1,
    dataTypeIcon: 'wm-category',
    dataTypeLabel: 'Multiple choice',
    fieldLabel: 'Please indicate your gender (or ci',
    sourceOneValue: 'gender',
    sourceTwoValue: 'gender',
    optionMatches: ['Male', 'Female', 'Other'],
  },
];

const QUESTION_SELECT_CLASS =
  'h-10 w-full rounded-none border-0 bg-[#f1f1f1] text-[13px] text-[#606978]';

function getQuestion(value: string) {
  return FIELD_OPTIONS.find((option) => option.value === value);
}

function getSelectedQuestion(value: string) {
  return getQuestion(value) ?? null;
}

function getAutoMatches(sourceOneValue: string, sourceTwoValue: string) {
  const sourceOneQuestion = getQuestion(sourceOneValue);
  const sourceTwoQuestion = getQuestion(sourceTwoValue);

  if (!sourceOneQuestion || !sourceTwoQuestion) return [];

  const matches = sourceOneQuestion.responseOptions.map((sourceOption, index) => {
    const exactMatch = sourceTwoQuestion.responseOptions.find(
      (targetOption) => targetOption.toLowerCase() === sourceOption.toLowerCase()
    );

    return exactMatch ?? sourceTwoQuestion.responseOptions[index] ?? sourceTwoQuestion.responseOptions[0] ?? '';
  });

  return normalizeOptionMatches(matches);
}

function normalizeOptionMatches(matches: string[]) {
  const seen = new Set<string>();

  return matches.map((match) => {
    if (!match || seen.has(match)) return '';
    seen.add(match);
    return match;
  });
}

function getSelectedMappingValue(value: string | undefined) {
  if (!value) return null;
  return { value, label: value };
}

function fieldMappingsAreComplete(field: StackField) {
  const sourceOneQuestion = getQuestion(field.sourceOneValue);
  const sourceTwoQuestion = getQuestion(field.sourceTwoValue);

  if (!sourceOneQuestion || !sourceTwoQuestion) return true;

  return sourceOneQuestion.responseOptions.every((_, index) => {
    const match = field.optionMatches[index] ?? '';
    return match.trim() !== '';
  });
}

export default function SurveyStackDetailPage() {
  const params = useParams<{ id: string }>();
  const stackId = Number(params.id);
  const stack = SURVEY_STACKS.find((item) => item.id === stackId) ?? SURVEY_STACKS[0];
  const basePath = useBiProductBasePath();
  const surveyStacksPath = withBiProductBasePath(basePath, '/survey-stacks');
  const [fields, setFields] = useState(STACK_FIELDS);
  const [expandedFieldIds, setExpandedFieldIds] = useState<number[]>([]);
  const { showToast } = useWuShowToast();

  const title = useMemo(() => stack.name || 'Survey stack', [stack.name]);
  const canUpdate = useMemo(
    () => fields.every((field) => fieldMappingsAreComplete(field)),
    [fields]
  );

  function updateQuestion(fieldId: number, key: 'sourceOneValue' | 'sourceTwoValue', option: QuestionOption | QuestionOption[]) {
    if (Array.isArray(option)) return;

    setFields((currentFields) =>
      currentFields.map((field) => {
        if (field.id !== fieldId) return field;

        const nextField = { ...field, [key]: option.value };

        return {
          ...nextField,
          optionMatches: getAutoMatches(nextField.sourceOneValue, nextField.sourceTwoValue),
        };
      })
    );
    setExpandedFieldIds((currentIds) =>
      currentIds.includes(fieldId) ? currentIds : [...currentIds, fieldId]
    );
  }

  function updateFieldLabel(fieldId: number, fieldLabel: string) {
    setFields((currentFields) =>
      currentFields.map((field) =>
        field.id === fieldId ? { ...field, fieldLabel } : field
      )
    );
  }

  function updateOptionMatch(fieldId: number, optionIndex: number, option: QuestionOption | QuestionOption[] | SelectOption | SelectOption[]) {
    if (Array.isArray(option)) return;

    setFields((currentFields) =>
      currentFields.map((field) => {
        if (field.id !== fieldId) return field;

        const nextMatches = [...field.optionMatches];
        const selectedValue = option.value;

        nextMatches.forEach((match, index) => {
          if (index !== optionIndex && match === selectedValue) {
            nextMatches[index] = '';
          }
        });

        nextMatches[optionIndex] = selectedValue;

        return { ...field, optionMatches: normalizeOptionMatches(nextMatches) };
      })
    );
  }

  function addField() {
    setFields((currentFields) => [
      ...currentFields,
      {
        id: Math.max(...currentFields.map((field) => field.id), 0) + 1,
        dataTypeIcon: 'wm-edit',
        dataTypeLabel: 'Custom field',
        fieldLabel: 'untitled',
        sourceOneValue: '',
        sourceTwoValue: '',
        optionMatches: [],
      },
    ]);
  }

  function toggleField(fieldId: number) {
    setExpandedFieldIds((currentIds) =>
      currentIds.includes(fieldId)
        ? currentIds.filter((id) => id !== fieldId)
        : [...currentIds, fieldId]
    );
  }

  function updateStack() {
    showToast({
      message: `Survey stack '${title}' updated successfully`,
      variant: 'success',
      duration: 3000,
      position: 'top',
    });
  }

  function deleteField(fieldId: number) {
    setFields((currentFields) => currentFields.filter((field) => field.id !== fieldId));
    setExpandedFieldIds((currentIds) => currentIds.filter((id) => id !== fieldId));
  }

  function renderResponseOptions(field: StackField, source: 'one' | 'two') {
    const sourceOneQuestion = getQuestion(field.sourceOneValue);
    const sourceTwoQuestion = getQuestion(field.sourceTwoValue);
    const currentQuestion = source === 'one' ? sourceOneQuestion : sourceTwoQuestion;

    if (!currentQuestion) return null;

    const responseOptions = source === 'two' && sourceOneQuestion
      ? sourceOneQuestion.responseOptions
      : currentQuestion.responseOptions;

    return (
      <div className={mappingStyles.mappingList}>
        {responseOptions.map((responseOption, optionIndex) => (
          <div
            key={`${field.id}-${source}-${responseOption}-${optionIndex}`}
            className={mappingStyles.mappingItem}
          >
            {source === 'one' || !sourceTwoQuestion ? (
              <span className={mappingStyles.mappingLabelBox}>{responseOption}</span>
            ) : (
              <WuSelect
                data={sourceTwoQuestion.responseOptions.map((targetOption) => ({
                  value: targetOption,
                  label: targetOption,
                }))}
                accessorKey={{ value: 'value', label: 'label' }}
                value={getSelectedMappingValue(field.optionMatches[optionIndex])}
                placeholder="Select a value"
                onSelect={(option) => updateOptionMatch(field.id, optionIndex, option as SelectOption | SelectOption[])}
                variant="flat"
                className={`${mappingStyles.mappingSelect} ${QUESTION_SELECT_CLASS}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-46px)] flex-col bg-white font-['Fira_Sans',sans-serif] text-[#566173]">
      <header className="flex h-[52px] items-center justify-between border-b border-[#e7eaf0] px-5">
        <h1 className="truncate text-[25px] font-normal leading-none text-[#606978]">
          {title}
        </h1>
        <div className="flex items-center gap-3">
          <WuButton
            type="button"
            variant="outline"
            color="primary"
            className="h-9 w-[122px] rounded-[3px] border-[#4d9cff] bg-white text-[14px] font-normal text-[#1e88e5] hover:bg-[#f4f9ff]"
          >
            Cancel
          </WuButton>
          <WuButton
            type="button"
            variant="primary"
            color="primary"
            onClick={updateStack}
            disabled={!canUpdate}
            className="h-9 w-[122px] rounded-[3px] bg-[#1e88e5] text-[14px] font-normal text-white hover:bg-[#1976d2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Update
          </WuButton>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto px-5 pb-24 pt-[76px]">
        <div className="grid max-w-[1288px] grid-cols-[150px_260px_354px_354px_40px] items-start gap-x-8">
          <div className="px-2 text-[14px] font-medium text-[#606978]">Data type</div>
          <div className="px-2 text-[14px] font-medium text-[#606978]">Field label</div>
          <div className="h-12 bg-[#ececec] px-3 py-2 text-[13px] font-medium leading-5 text-[#687385]">
            QuestionPro : Understanding Your Audience
          </div>
          <div className="h-12 bg-[#ececec] px-3 py-2 text-[13px] font-medium leading-5 text-[#687385]">
            New QuestionPro : Understanding Your Audience
          </div>
          <div aria-hidden="true" />

          {fields.map((field) => {
            const isExpanded = expandedFieldIds.includes(field.id);

            return (
              <div
                key={field.id}
                className="group col-span-5 mt-7 grid grid-cols-[150px_260px_354px_354px_40px] items-start gap-x-8"
              >
                <div className="flex h-10 items-center justify-center">
                  <span className={`${field.dataTypeIcon} text-[24px] text-[#1e88e5]`} aria-label={field.dataTypeLabel} />
                </div>
                <div>
                  <WuInput
                    value={field.fieldLabel}
                    onChange={(event) => updateFieldLabel(field.id, event.target.value)}
                    aria-label={`Field label ${field.id}`}
                    variant="flat"
                    className="h-10 w-full rounded-none border-0 bg-[#f1f1f1] px-4 text-[13px] text-[#606978]"
                  />
                </div>
                <div>
                  <WuSelect
                    data={FIELD_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={getSelectedQuestion(field.sourceOneValue)}
                    placeholder="---Select question---"
                    onSelect={(option) =>
                      updateQuestion(field.id, 'sourceOneValue', option as QuestionOption | QuestionOption[])}
                    variant="flat"
                    className={QUESTION_SELECT_CLASS}
                  />
                  {isExpanded && renderResponseOptions(field, 'one')}
                </div>
                <div>
                  <WuSelect
                    data={FIELD_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={getSelectedQuestion(field.sourceTwoValue)}
                    placeholder="---Select question---"
                    onSelect={(option) =>
                      updateQuestion(field.id, 'sourceTwoValue', option as QuestionOption | QuestionOption[])}
                    variant="flat"
                    className={QUESTION_SELECT_CLASS}
                  />
                  {isExpanded && renderResponseOptions(field, 'two')}
                </div>
                <div className="flex h-10 items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <WuButton
                    type="button"
                    variant="iconOnly"
                    aria-label={`Edit ${field.fieldLabel}`}
                    onClick={() => toggleField(field.id)}
                    className="h-7 w-7 rounded-[3px] bg-transparent p-0 text-[#4f5867] hover:bg-[#eef3f8]"
                  >
                    <span className="wm-edit text-[17px]" aria-hidden="true" />
                  </WuButton>
                  <WuButton
                    type="button"
                    variant="iconOnly"
                    aria-label={`Delete ${field.fieldLabel}`}
                    onClick={() => deleteField(field.id)}
                    className="h-7 w-7 rounded-[3px] bg-transparent p-0 text-[#4f5867] hover:bg-[#eef3f8]"
                  >
                    <span className="wm-delete text-[17px]" aria-hidden="true" />
                  </WuButton>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="sticky bottom-0 flex h-[72px] items-center border-t border-[#e7eaf0] bg-white px-5">
        <WuButton
          type="button"
          variant="primary"
          color="primary"
          Icon={<span className="wm-add text-[15px]" aria-hidden="true" />}
          onClick={addField}
          className="h-10 rounded-[4px] bg-[#1e88e5] px-4 text-[15px] font-normal text-white hover:bg-[#1976d2]"
        >
          Add field
        </WuButton>
        <span className="ml-4 text-[12px] text-[#a2a9b3]">
          QuestionPro Admin #Business Intelligence v1315
        </span>
        <Link
          href={surveyStacksPath}
          className="ml-auto text-[12px] text-[#687385] hover:text-[#1e88e5] hover:underline"
        >
          Back to survey stacks
        </Link>
      </footer>
    </div>
  );
}
