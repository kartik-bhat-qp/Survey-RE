export const QUESTION_LOGIC_HELP_LINKS = {
  logicType: 'https://help.questionpro.com/skip-logic',
  looping: 'https://help.questionpro.com/looping',
  pipingText: 'https://help.questionpro.com/piping-text',
  variableAssignment: 'https://help.questionpro.com/variable-assignment',
  branchingRandomizer: 'https://help.questionpro.com/branching-randomizer',
  validation: 'https://help.questionpro.com/validation',
} as const;

export type QuestionLogicHelpTopic = keyof typeof QUESTION_LOGIC_HELP_LINKS;

export function getQuestionLogicHelpUrl(topic: QuestionLogicHelpTopic): string {
  return QUESTION_LOGIC_HELP_LINKS[topic];
}
