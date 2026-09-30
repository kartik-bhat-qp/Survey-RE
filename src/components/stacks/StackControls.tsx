'use client';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
export const StackButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => m.WuButton), {ssr:false});
export const StackInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => m.WuInput), {ssr:false});
export const StackDialog = dynamic(async () => {
  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = await import('@npm-questionpro/wick-ui-lib');
  return function StackDialogContent({title,onClose,children,footer,wide=false}: {title:string;onClose:()=>void;children:ReactNode;footer?:ReactNode;wide?:boolean}) {
    return <WuModal open onOpenChange={open=>{if(!open)onClose();}} maxWidth={wide?'1100px':'650px'} variant="action"><WuModalHeader>{title}</WuModalHeader><WuModalContent style={{maxHeight:'70vh',overflow:'auto'}}>{children}</WuModalContent>{footer && <WuModalFooter>{footer}</WuModalFooter>}</WuModal>;
  };
}, {ssr:false});

const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => m.WuSelect), {ssr:false});
export function StackSelect({label,value,options,onChange,disabled=false,placeholder='---Select question---'}:{label:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void;disabled?:boolean;placeholder?:string}){
 return <div role="group" aria-label={label}><WuSelect data={options} accessorKey={{value:'value',label:'label'}} value={options.find(o=>o.value===value)??null} onSelect={option=>{if(option&&typeof option==='object'&&!Array.isArray(option)&&'value' in option)onChange(String(option.value));}} disabled={disabled} placeholder={placeholder} variant="flat" className="w-full border-0 border-b border-[#aeb3b8] rounded-none bg-transparent text-[13px]"/></div>;
}

export function StackTypeIcon({type}:{type?:string}){
 if(!type)return null;
 return <svg width="28" height="30" viewBox="0 0 28 30" role="img" aria-label={type}>{type==='Text'?<><rect x="3" y="7" width="22" height="18" fill="#f3db58"/><text x="14" y="21" fontSize="16" textAnchor="middle" fill="white">I</text></>:type.includes('Matrix')?<g fill="#df6033"><circle cx="9" cy="10" r="4"/><circle cx="20" cy="10" r="4"/><circle cx="9" cy="21" r="4"/><circle cx="20" cy="21" r="4"/></g>:<g fill="#478bd5"><path d="M14 3 20 13H8Z"/><rect x="4" y="17" width="9" height="9"/><circle cx="21" cy="21" r="5"/></g>}</svg>;
}
