import type {StackSource,MappedStackField} from './survey-stack-model';
export interface SurveyStackField {id:number;dataTypeIcon:string;dataTypeLabel:string;fieldLabel:string;sourceOneValue:string;sourceTwoValue:string;optionMatches:string[];}
export interface PrototypeSurveyStack {id:number;name:string;createdOn:string;completedResponses:number;sourceNames:[string,string];sourceIds?:[number,number];sources?:StackSource[];mappedFields?:MappedStackField[];fields:SurveyStackField[];}
export const SURVEY_STACK_STORAGE_KEY='survey-re:created-survey-stacks:v1';
export function readCreatedSurveyStacks():PrototypeSurveyStack[]{
 if(typeof window==='undefined')return [];
 const value=window.localStorage.getItem(SURVEY_STACK_STORAGE_KEY);if(!value)return [];
 const parsed:unknown=JSON.parse(value);if(!Array.isArray(parsed))throw new Error('Invalid saved Survey Stacks');return parsed as PrototypeSurveyStack[];
}
export function saveCreatedSurveyStack(stack:PrototypeSurveyStack){const current=readCreatedSurveyStacks();window.localStorage.setItem(SURVEY_STACK_STORAGE_KEY,JSON.stringify([...current.filter(s=>s.id!==stack.id),stack]));}
