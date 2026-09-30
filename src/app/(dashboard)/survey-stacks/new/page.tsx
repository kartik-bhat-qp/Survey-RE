'use client';
import {Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import SurveyStackEditor from '@/components/stacks/SurveyStackEditor';
function NewStack(){const params=useSearchParams();return <SurveyStackEditor newName={params.get('name')??'Untitled Survey Stack'}/>;}
export default function NewSurveyStackPage(){return <Suspense fallback={<p>Loading…</p>}><NewStack/></Suspense>;}
