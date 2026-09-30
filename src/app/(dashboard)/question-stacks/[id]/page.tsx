'use client';
import {useParams} from 'next/navigation';
import {QuestionStackEditor} from '@/components/stacks/QuestionStackEditor';
export default function Page(){const {id}=useParams<{id:string}>();return <QuestionStackEditor id={id}/>;}
