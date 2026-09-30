import type {SurveyQuestion,SurveyQuestionType} from './mock-survey-questions';
export interface StackSource {id:number;name:string;}
export interface StackFieldMapping {questionId:number|null;answers:number[];}
export interface MappedStackField {id:string;label:string;type?:SurveyQuestionType;answers:string[];sources:Record<number,StackFieldMapping>;}
export function compatibleFieldQuestions(field:MappedStackField,questions:SurveyQuestion[]){return questions.filter(q=>!field.type||(q.type===field.type&&(q.options?.length??0)===field.answers.length));}
export function mapFieldQuestion(field:MappedStackField,sourceId:number,q:SurveyQuestion):MappedStackField{
 const first=!field.type;const answers=first?[...(q.options??[])]:field.answers;
 return {...field,type:first?q.type:field.type,answers,sources:{...field.sources,[sourceId]:{questionId:q.id,answers:answers.map((_,i)=>i<(q.options?.length??0)?i:-1)}}};
}
export function autoMapSource(field:MappedStackField,sourceId:number,questions:SurveyQuestion[]):MappedStackField{
 const eligible=compatibleFieldQuestions(field,questions);const q=eligible.find(q=>q.text===field.label)??eligible[0];
 return q?mapFieldQuestion(field,sourceId,q):{...field,sources:{...field.sources,[sourceId]:{questionId:null,answers:[]}}};
}
export function seedStackFields(sources:StackSource[],questions:(id:number)=>SurveyQuestion[]):MappedStackField[]{
 if(!sources.length)return [];
 return questions(sources[0].id).map(q=>{let f:MappedStackField={id:crypto.randomUUID(),label:q.text,type:q.type,answers:[...(q.options??[])],sources:{[sources[0].id]:{questionId:q.id,answers:(q.options??[]).map((_,i)=>i)}}};for(const s of sources.slice(1))f=autoMapSource(f,s.id,questions(s.id));return f;});
}
export function setFieldAnswer(field:MappedStackField,sourceId:number,index:number,value:number):MappedStackField{
 const mapping=field.sources[sourceId];if(!mapping)return field;const answers=[...mapping.answers];for(let i=0;i<answers.length;i++)if(i!==index&&value>=0&&answers[i]===value)answers[i]=-1;answers[index]=value;
 return {...field,sources:{...field.sources,[sourceId]:{...mapping,answers}}};
}
