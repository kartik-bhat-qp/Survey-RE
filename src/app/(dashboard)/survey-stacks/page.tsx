'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {readCreatedSurveyStacks,saveCreatedSurveyStack,SURVEY_STACK_STORAGE_KEY,type PrototypeSurveyStack} from '@/data/prototype-survey-stacks';
import { MOCK_SURVEYS } from '@/data/mock-survey-folders';
import { useQuestionStacks } from '@/hooks/useQuestionStacks';
import { StackDialog,StackButton,StackInput } from '@/components/stacks/StackControls';
import stackStyles from '@/components/stacks/Stacks.module.css';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';

type SurveyStack = {
  id: number | string;
  kind?: string;
  name: string;
  createdOn: string;
  completedResponses: number;
};

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);

const SURVEY_STACKS: SurveyStack[] = [
  {
    id: 1,
    name: 'Customer Experience Portfolio',
    createdOn: 'May 05 2026',
    completedResponses: 6,
  },
  {
    id: 2,
    name: 'Market Insights Program',
    createdOn: 'May 05 2026',
    completedResponses: 6,
  },
  {
    id: 3,
    name: 'Brand Health Benchmark',
    createdOn: 'Apr 30 2026',
    completedResponses: 11,
  },
  {
    id: 4,
    name: 'Product Feedback Initiative',
    createdOn: 'Nov 10 2025',
    completedResponses: 10,
  },
  {
    id: 5,
    name: 'Employee Engagement Suite',
    createdOn: 'Nov 10 2025',
    completedResponses: 10,
  },
  {
    id: 6,
    name: 'Executive Pulse Tracker',
    createdOn: 'Nov 10 2025',
    completedResponses: 10,
  },
  {
    id: 7,
    name: 'Compliance Readiness Review',
    createdOn: 'Oct 31 2025',
    completedResponses: 6,
  },
];

export default function SurveyStacksPage() {
  const basePath = useBiProductBasePath();
  const surveyStacksPath = withBiProductBasePath(basePath, '/survey-stacks');
  const [searchTerm, setSearchTerm] = useState('');
  const [chooseType,setChooseType] = useState(false);
  const [newType,setNewType]=useState<'Question Stack'|'Survey Stack'|null>(null);
  const [newName,setNewName]=useState('');
  const router = useRouter();
  const {stacks:questionStacks,error,saveStack,removeStack} = useQuestionStacks();
  const [action,setAction]=useState<{kind:'rename'|'delete';stack:SurveyStack}|null>(null);
  const [actionName,setActionName]=useState('');
  const [actionError,setActionError]=useState('');
  const [hidden,setHidden]=useState<number[]>([]);
  const [createdSurveyStacks,setCreatedSurveyStacks]=useState<PrototypeSurveyStack[]>([]);
  // Hydrate browser-only prototype persistence after the server render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{try{setCreatedSurveyStacks(readCreatedSurveyStacks());setHidden(JSON.parse(localStorage.getItem('survey-re:hidden-survey-stacks')??'[]'));}catch{/* Preserve baseline stacks when saved demo data is unavailable. */}},[]);
  const allStacks: SurveyStack[] = useMemo(()=>[...SURVEY_STACKS.filter(s=>!hidden.includes(Number(s.id))&&!createdSurveyStacks.some(saved=>saved.id===s.id)),...createdSurveyStacks.filter(s=>!hidden.includes(s.id)),...questionStacks.map(stack=>({id:stack.id,name:stack.name,createdOn:stack.createdOn,completedResponses:MOCK_SURVEYS.find(s=>s.id===stack.surveyId)?.completedResponses??0,kind:'Question Stack'}))],[questionStacks,createdSurveyStacks,hidden]);

  function applyAction(){
    if(!action)return;
    try{
      const stack=action.stack;
      if(stack.kind==='Question Stack'){
        if(action.kind==='delete')removeStack(String(stack.id));
        else{const current=questionStacks.find(s=>s.id===stack.id);if(current)saveStack({...current,name:actionName.trim()});}
      }else if(action.kind==='delete'){
        const next=[...hidden,Number(stack.id)];localStorage.setItem('survey-re:hidden-survey-stacks',JSON.stringify(next));setHidden(next);
        const kept=readCreatedSurveyStacks().filter(s=>s.id!==stack.id);localStorage.setItem(SURVEY_STACK_STORAGE_KEY,JSON.stringify(kept));setCreatedSurveyStacks(kept);
      }else{
        const current=readCreatedSurveyStacks().find(s=>s.id===stack.id)??{id:Number(stack.id),name:stack.name,createdOn:stack.createdOn,completedResponses:stack.completedResponses,sourceNames:['QuestionPro : Understanding Your Audience','New QuestionPro : Understanding Your Audience'] as [string,string],sourceIds:[MOCK_SURVEYS[0].id,MOCK_SURVEYS[1].id] as [number,number],fields:[]};
        saveCreatedSurveyStack({...current,name:actionName.trim()});setCreatedSurveyStacks(readCreatedSurveyStacks());
      }
      setAction(null);setActionError('');
    }catch{setActionError('Could not save this change. Your saved data has been preserved.');}
  }
  const columns: IWuTableColumnDef<SurveyStack>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      filterable: true,
      cell: ({ row }) => (
        <Link
          href={row.original.kind === 'Question Stack' ? withBiProductBasePath(basePath, `/question-stacks/${row.original.id}`) : `${surveyStacksPath}/${row.original.id}`}
          className="block py-2 font-normal text-[#1b3380] no-underline hover:text-[#1b3380] hover:underline focus-visible:text-[#1b3380] focus-visible:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'kind', header: 'Type', cell: ({row}) => row.original.kind ?? 'Survey Stack',
    },
    {
      accessorKey: 'createdOn',
      header: 'Created on',
      filterable: true,
    },
    {
      accessorKey: 'completedResponses',
      header: 'Completed responses',
      headerAlign: 'left',
      cellAlign: 'left',
      cell: ({ row }) => row.original.completedResponses,
    },
    {accessorKey:'id',header:'',cell:({row})=><div className={stackStyles.listActions}><button aria-label={`Rename ${row.original.name}`} onClick={()=>{setAction({kind:'rename',stack:row.original});setActionName(row.original.name);}}>✎</button><button aria-label={`Delete ${row.original.name}`} onClick={()=>setAction({kind:'delete',stack:row.original})}>⌫</button></div>},
  ];

  const filteredStacks = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return allStacks;
    }

    return allStacks.filter((stack) =>
      stack.name.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [searchTerm,allStacks]);

  return (
    <div className="min-h-[calc(100vh-46px)] bg-white font-['Fira_Sans',sans-serif] text-[#253449]">
      <div className={stackStyles.header}>
        <h1 className="text-[18px] font-semibold leading-none text-[#515b6b]">
          Stacks
        </h1>
        {newType?<form className={stackStyles.inlineName} onSubmit={e=>{e.preventDefault();if(newName.trim())router.push(withBiProductBasePath(basePath,`${newType==='Question Stack'?'/question-stacks':'/survey-stacks'}/new?name=${encodeURIComponent(newName.trim())}`));}}><div className={stackStyles.nameInput}><WuInput autoFocus aria-label="Stack name" placeholder="Stack name" value={newName} onChange={e=>setNewName(e.target.value)}/></div><StackButton type="submit" disabled={!newName.trim()}>Create {newType}</StackButton><StackButton variant="link" aria-label="Cancel new stack" onClick={()=>{setNewType(null);setNewName('');}}>×</StackButton></form>:<WuButton
          onClick={()=>setChooseType(true)}
          className="inline-flex h-8 items-center gap-2 rounded-[4px] bg-[#1e88e5] px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1976d2]"
          Icon={<span className="wm-add text-[16px]" aria-hidden="true" />}
        >
          New stack
        </WuButton>}
      </div>

      {action&&<StackDialog title={action.kind==='rename'?'Rename stack':'Delete stack'} onClose={()=>setAction(null)} footer={<><StackButton variant="secondary" onClick={()=>setAction(null)}>Cancel</StackButton><StackButton disabled={action.kind==='rename'&&!actionName.trim()} onClick={applyAction}>{action.kind==='rename'?'Update':'Yes'}</StackButton></>}>{action.kind==='rename'?<StackInput aria-label="Stack name" value={actionName} onChange={e=>setActionName(e.target.value)}/>:<p>Delete “{action.stack.name}”? Widgets using this stack will need a new source.</p>}{actionError&&<p role="alert">{actionError}</p>}</StackDialog>}
      {error && <p role="alert" className={stackStyles.error}>{error}</p>}
      {chooseType && <StackDialog title="Create new stack" onClose={()=>setChooseType(false)}><div className={stackStyles.choices}><button className={stackStyles.choice} onClick={()=>{setChooseType(false);setNewType('Question Stack');}}><span className={stackStyles.choiceTitle}><span className="wm-layers" aria-hidden="true"/><strong>Question Stack</strong></span><p>Group related questions from one survey into reusable metrics.</p></button><button className={stackStyles.choice} onClick={()=>{setChooseType(false);setNewType('Survey Stack');}}><span className={stackStyles.choiceTitle}><span className="wm-layers" aria-hidden="true"/><strong>Survey Stack</strong></span><p>Combine fields and answers across multiple surveys.</p></button></div></StackDialog>}
      <section className="px-[31px] pt-[33px]">
        <WuInput
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search"
          aria-label="Search stacks"
          variant="flat"
          Icon={<span className="wm-search text-[13px]" aria-hidden="true" />}
          iconPosition="left"
          className="h-8 w-[165px] rounded-[4px] border-0 border-b border-[#d7dbe2] bg-[#f3f3f4] text-[12px] text-[#253449]"
        />

        <div className="mt-4 overflow-x-auto">
          <WuTable
            data={filteredStacks as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="bordered"
            size="compact"
            sort={{ enabled: true }}
            NoDataContent="No stacks match your search."
            className="min-w-[900px] !border-0 text-[12px] [&_td]:!border-l-0 [&_td]:!border-r-0 [&_th]:!border-l-0 [&_th]:!border-r-0 [&_th]:bg-[#f0f0f0] [&_th]:text-[#5f6b7a]"
          />
        </div>
      </section>
    </div>
  );
}
