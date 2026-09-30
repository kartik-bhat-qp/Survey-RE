'use client';
import { useEffect, useState } from 'react';
import { demoQuestionStack, type QuestionStack } from '@/data/question-stacks';
const KEY = 'survey-re:question-stacks:v1';
const EVENT = 'survey-re:question-stacks-changed';
export function readQuestionStacks(): QuestionStack[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [demoQuestionStack()];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(item => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.surveyId === 'number' && Array.isArray(item.groups))) throw new Error('Saved Question Stacks could not be read.');
  return parsed as QuestionStack[];
}
export function useQuestionStacks() {
  const [stacks, setStacks] = useState<QuestionStack[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => { try { setStacks(readQuestionStacks()); setError(''); } catch { setError('Saved Question Stacks could not be loaded. Your saved data has been preserved.'); } setReady(true); };
    sync(); window.addEventListener(EVENT,sync); window.addEventListener('storage',sync);
    return () => { window.removeEventListener(EVENT,sync); window.removeEventListener('storage',sync); };
  }, []);
  function saveStack(stack: QuestionStack) {
    const latest = readQuestionStacks();
    const next = latest.some(item => item.id === stack.id) ? latest.map(item => item.id === stack.id ? stack : item) : [...latest,stack];
    window.localStorage.setItem(KEY,JSON.stringify(next)); window.dispatchEvent(new Event(EVENT));
  }
  function removeStack(id:string){const latest=readQuestionStacks();window.localStorage.setItem(KEY,JSON.stringify(latest.filter(s=>s.id!==id)));window.dispatchEvent(new Event(EVENT));}
  return {stacks,ready,error,saveStack,removeStack};
}
