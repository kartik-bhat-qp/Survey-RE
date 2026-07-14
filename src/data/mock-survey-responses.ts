export type ResponseStatus = 'Completed' | 'Partial' | 'Disqualified';

export interface SurveyResponse {
  id: string;
  status: ResponseStatus;
  timestamp: string;
  timeTaken: number;
  respondentEmail: string | null;
  emailList: string | null;
  externalReference: string | null;
  customerId: string | null;
  employeeId: string | null;
  department: string | null;
  jobTitle: string | null;
}

export const RAA_BLOCKED = '**RAA Blocked**';

export const RESPONSE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Responses' },
  { value: 'completed', label: 'Completed' },
  { value: 'partial', label: 'Partial' },
  { value: 'disqualified', label: 'Disqualified' },
];

export const MOCK_SURVEY_RESPONSES: SurveyResponse[] = [
  {
    id: '226407635',
    status: 'Completed',
    timestamp: '07/14/2026 12:18:14',
    timeTaken: 3,
    respondentEmail: null,
    emailList: null,
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226407548',
    status: 'Completed',
    timestamp: '07/14/2026 12:15:26',
    timeTaken: 6,
    respondentEmail: null,
    emailList: null,
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226407510',
    status: 'Completed',
    timestamp: '07/14/2026 12:14:26',
    timeTaken: 1,
    respondentEmail: null,
    emailList: null,
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226407401',
    status: 'Completed',
    timestamp: '07/14/2026 11:58:03',
    timeTaken: 9,
    respondentEmail: 'k.sharma@example.com',
    emailList: 'Batch A',
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226407289',
    status: 'Partial',
    timestamp: '07/14/2026 11:42:17',
    timeTaken: 47,
    respondentEmail: null,
    emailList: null,
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226406918',
    status: 'Completed',
    timestamp: '07/14/2026 10:31:55',
    timeTaken: 14,
    respondentEmail: 'p.nguyen@example.com',
    emailList: 'Batch A',
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226406744',
    status: 'Disqualified',
    timestamp: '07/14/2026 10:05:40',
    timeTaken: 2,
    respondentEmail: null,
    emailList: null,
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226405902',
    status: 'Completed',
    timestamp: '07/13/2026 17:22:09',
    timeTaken: 21,
    respondentEmail: 'a.patel@example.com',
    emailList: 'Batch B',
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226405610',
    status: 'Partial',
    timestamp: '07/13/2026 15:04:33',
    timeTaken: 88,
    respondentEmail: null,
    emailList: null,
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
  {
    id: '226404871',
    status: 'Completed',
    timestamp: '07/13/2026 12:48:51',
    timeTaken: 5,
    respondentEmail: 'l.chen@example.com',
    emailList: 'Batch B',
    externalReference: RAA_BLOCKED,
    customerId: RAA_BLOCKED,
    employeeId: RAA_BLOCKED,
    department: RAA_BLOCKED,
    jobTitle: RAA_BLOCKED,
  },
];
