export interface SurveyCreationTemplate {
  id: string;
  label: string;
  prompt: string;
}

const CONTEXTS = [
  'Retail',
  'Healthcare',
  'Financial Services',
  'Higher Education',
  'Hospitality',
  'SaaS',
  'Nonprofit',
  'Manufacturing',
  'Real Estate',
  'Automotive',
  'Telecommunications',
  'Insurance',
  'Government',
  'Media and Entertainment',
  'Logistics',
  'Energy',
  'Professional Services',
  'E-commerce',
  'Pharmaceuticals',
  'Travel and Tourism',
] as const;

const PURPOSES = [
  {
    name: 'Customer Satisfaction',
    short: 'CSAT',
    focus:
      'overall satisfaction, key touchpoint ratings, and open feedback on what to improve',
  },
  {
    name: 'Net Promoter Score',
    short: 'NPS',
    focus:
      'likelihood to recommend, follow-up on the score, and drivers of loyalty or churn risk',
  },
  {
    name: 'Customer Effort Score',
    short: 'CES',
    focus:
      'how easy it was to get help, resolve an issue, or complete a task, with improvement suggestions',
  },
  {
    name: 'Employee Engagement',
    short: 'Engagement',
    focus:
      'motivation, alignment with goals, growth opportunities, manager support, and workplace culture',
  },
  {
    name: 'Employee Pulse',
    short: 'Pulse',
    focus: 'short weekly morale, workload, psychological safety, and one open comment for leadership',
  },
  {
    name: 'Product Feedback',
    short: 'Product',
    focus: 'feature usefulness, ease of use, bugs or gaps, and priorities for the next release',
  },
  {
    name: 'Event Feedback',
    short: 'Event',
    focus:
      'overall satisfaction, sessions, speakers, logistics, networking value, and ideas for future events',
  },
  {
    name: 'Training Evaluation',
    short: 'Training',
    focus:
      'content relevance, instructor quality, pace, materials, and confidence applying what was learned',
  },
  {
    name: 'Post-Purchase Feedback',
    short: 'Post-Purchase',
    focus:
      'delivery experience, product quality versus expectations, support needs, and likelihood to buy again',
  },
  {
    name: 'Market Research',
    short: 'Market',
    focus:
      'category needs, buying behavior, brand consideration, pricing sensitivity, and unmet problems',
  },
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildContextPurposeTemplates(): SurveyCreationTemplate[] {
  const templates: SurveyCreationTemplate[] = [];

  for (const context of CONTEXTS) {
    for (const purpose of PURPOSES) {
      const contextSlug = slugify(context);
      const purposeSlug = slugify(purpose.short);
      templates.push({
        id: `${contextSlug}-${purposeSlug}`,
        label: `${context} ${purpose.name} Survey`,
        prompt: `A ${context.toLowerCase()} ${purpose.name} (${purpose.short}) survey focusing on ${purpose.focus}.`,
      });
    }
  }

  return templates;
}

/** Hand-crafted templates with richer prompts (also included in the library of 200). */
const SIGNATURE_TEMPLATES: SurveyCreationTemplate[] = [
  {
    id: 'csat',
    label: 'CSAT Survey',
    prompt:
      'A Customer Satisfaction (CSAT) survey with overall satisfaction rating, key touchpoint ratings, and open feedback on what to improve.',
  },
  {
    id: 'nps',
    label: 'NPS Survey',
    prompt:
      'A Net Promoter Score survey asking likelihood to recommend, follow-up on the score, and optional comments on drivers of loyalty.',
  },
  {
    id: 'customer-effort',
    label: 'Customer Effort Survey',
    prompt:
      'A Customer Effort Score survey measuring how easy it was to get help, resolve an issue, or complete a task, with improvement suggestions.',
  },
  {
    id: 'product-feedback',
    label: 'Product Feedback Survey',
    prompt:
      'A product feedback survey on feature usefulness, ease of use, bugs or gaps, and priorities for the next release.',
  },
  {
    id: 'support-satisfaction',
    label: 'Support Satisfaction Survey',
    prompt:
      'A support satisfaction survey on agent helpfulness, resolution time, communication clarity, and overall support experience.',
  },
  {
    id: 'employee-engagement',
    label: 'Employee Engagement Survey',
    prompt:
      'An employee engagement survey covering motivation, alignment with company goals, growth opportunities, and culture.',
  },
  {
    id: 'employee-pulse',
    label: 'Employee Pulse Survey',
    prompt:
      'A short employee pulse survey on weekly morale, workload, manager support, and one open comment for leadership.',
  },
  {
    id: 'onboarding-feedback',
    label: 'Onboarding Feedback Survey',
    prompt:
      'An onboarding feedback survey for new hires on orientation clarity, tools and training, manager support, and readiness for the role.',
  },
  {
    id: 'exit-interview',
    label: 'Exit Interview Survey',
    prompt:
      'An exit interview survey on reasons for leaving, manager and team experience, compensation fairness, and suggestions to improve retention.',
  },
  {
    id: 'training-feedback',
    label: 'Training Feedback Survey',
    prompt:
      'A training feedback survey on content relevance, instructor quality, pace, materials, and confidence applying what was learned.',
  },
  {
    id: 'market-research',
    label: 'Market Research Survey',
    prompt:
      'A market research survey on category needs, buying behavior, brand consideration, and unmet problems in our target segment.',
  },
  {
    id: 'brand-awareness',
    label: 'Brand Awareness Survey',
    prompt:
      'A brand awareness survey measuring aided and unaided recall, associations, preference versus competitors, and message resonance.',
  },
  {
    id: 'website-feedback',
    label: 'Website Feedback Survey',
    prompt:
      'A website feedback survey on navigation, content clarity, design, performance, mobile experience, and suggested improvements.',
  },
  {
    id: 'event-feedback',
    label: 'Event Feedback Survey',
    prompt:
      'An event feedback survey on overall satisfaction, sessions, speakers, logistics, networking value, and ideas for future events.',
  },
  {
    id: 'course-evaluation',
    label: 'Course Evaluation Survey',
    prompt:
      'A course evaluation survey for students on learning outcomes, instructor effectiveness, materials, workload, and course improvements.',
  },
  {
    id: 'patient-satisfaction',
    label: 'Patient Satisfaction Survey',
    prompt:
      'A patient satisfaction survey on wait times, staff communication, care quality, facility cleanliness, and likelihood to recommend.',
  },
  {
    id: 'restaurant-feedback',
    label: 'Restaurant Feedback Survey',
    prompt:
      'A restaurant feedback survey on food quality, service, ambiance, value, wait time, and likelihood to return or recommend.',
  },
  {
    id: 'hotel-guest',
    label: 'Hotel Guest Survey',
    prompt:
      'A hotel guest survey on check-in, room comfort, amenities, staff service, cleanliness, and overall stay satisfaction.',
  },
  {
    id: 'community-feedback',
    label: 'Community Feedback Survey',
    prompt:
      'A community feedback survey on member needs, program value, communication, inclusivity, and priorities for the community.',
  },
  {
    id: 'concept-testing',
    label: 'Concept Testing Survey',
    prompt:
      'A concept testing survey presenting a new idea with appeal, purchase intent, pricing sensitivity, strengths, and concerns versus alternatives.',
  },
];

function mergeTemplateLibrary(): SurveyCreationTemplate[] {
  const contextual = buildContextPurposeTemplates();

  if (contextual.length !== 200) {
    throw new Error(`Expected 200 contextual survey templates, got ${contextual.length}`);
  }

  return [...SIGNATURE_TEMPLATES, ...contextual.slice(0, 200 - SIGNATURE_TEMPLATES.length)];
}

export const SURVEY_CREATION_TEMPLATE_COUNT = 200;

export const SURVEY_CREATION_TEMPLATES: SurveyCreationTemplate[] = mergeTemplateLibrary();

export function filterSurveyCreationTemplates(
  templates: SurveyCreationTemplate[],
  query: string
): SurveyCreationTemplate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return templates;
  }

  return templates.filter(
    (template) =>
      template.label.toLowerCase().includes(normalized) ||
      template.prompt.toLowerCase().includes(normalized) ||
      template.id.replace(/-/g, ' ').includes(normalized)
  );
}
