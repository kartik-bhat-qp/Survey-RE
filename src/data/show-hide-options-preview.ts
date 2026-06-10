import { parseSelectedValues } from '@/data/mock-criteria-engine';
import {
  getCriteriaCoveredOptionIds,
  isShowHideOptionsLogicApplied,
  type QuestionLogicState,
  type ShowHideOptionsCriterion,
  type ShowHideOptionsState,
} from '@/data/mock-question-logic';

export interface ShowHideOptionsPreviewConfig {
  hideOptionByDefault: boolean;
  criteria: ShowHideOptionsCriterion[];
  uncoveredOptionsAction: ShowHideOptionsState['uncoveredOptionsAction'];
  useLegacyMethod: boolean;
}

export function toShowHideOptionsPreviewConfig(
  logic: QuestionLogicState,
  optionIds: string[]
): ShowHideOptionsPreviewConfig | null {
  if (!isShowHideOptionsLogicApplied(logic, optionIds)) {
    return null;
  }

  const { hideOptionByDefault, criteria, uncoveredOptionsAction, useLegacyMethod } =
    logic.showHideOptions;

  return {
    hideOptionByDefault,
    criteria,
    uncoveredOptionsAction,
    useLegacyMethod,
  };
}

export function simulateRandomCriteriaMet(
  config: ShowHideOptionsPreviewConfig
): Record<string, boolean> {
  const criteriaMet: Record<string, boolean> = {};
  for (const criterion of config.criteria) {
    criteriaMet[criterion.id] = Math.random() < 0.5;
  }
  return criteriaMet;
}

export function resolvePreviewVisibleOptionIds(
  optionIds: string[],
  config: ShowHideOptionsPreviewConfig,
  criteriaMet: Record<string, boolean>
): string[] {
  if (config.useLegacyMethod) {
    return resolveLegacyPreviewVisibleOptionIds(optionIds, config, criteriaMet);
  }

  const visibility = new Map<string, boolean>();
  const covered = getCriteriaCoveredOptionIds(config);

  for (const optionId of optionIds) {
    if (!covered.has(optionId)) {
      visibility.set(optionId, config.uncoveredOptionsAction === 'show');
    }
  }

  for (const criterion of config.criteria) {
    const met = criteriaMet[criterion.id] ?? false;
    for (const optionId of parseSelectedValues(criterion.targetOptionId)) {
      if (criterion.action === 'show-option') {
        visibility.set(optionId, met);
      } else {
        visibility.set(optionId, !met);
      }
    }
  }

  return optionIds.filter((optionId) => visibility.get(optionId) === true);
}

function resolveLegacyPreviewVisibleOptionIds(
  optionIds: string[],
  config: ShowHideOptionsPreviewConfig,
  criteriaMet: Record<string, boolean>
): string[] {
  const visibility = new Map<string, boolean>();
  const defaultVisible = !config.hideOptionByDefault;

  for (const optionId of optionIds) {
    visibility.set(optionId, defaultVisible);
  }

  for (const criterion of config.criteria) {
    if (!(criteriaMet[criterion.id] ?? false)) continue;
    for (const optionId of parseSelectedValues(criterion.targetOptionId)) {
      if (criterion.action === 'show-option') {
        visibility.set(optionId, true);
      } else {
        visibility.set(optionId, false);
      }
    }
  }

  return optionIds.filter((optionId) => visibility.get(optionId));
}

export function resolvePreviewVisibleOptions<T extends { id: string }>(
  options: T[],
  config: ShowHideOptionsPreviewConfig | null | undefined
): T[] {
  if (!config) return options;

  const criteriaMet = simulateRandomCriteriaMet(config);
  const visibleIds = new Set(
    resolvePreviewVisibleOptionIds(
      options.map((option) => option.id),
      config,
      criteriaMet
    )
  );

  return options.filter((option) => visibleIds.has(option.id));
}
