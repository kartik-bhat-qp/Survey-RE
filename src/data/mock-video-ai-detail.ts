export type SentimentValue = 'Positive' | 'Neutral' | 'Negative';

export interface VideoAiResponse {
  id: string;
  date: string;
  sentiment: SentimentValue;
  duration: string;
  durationSeconds: number;
  viewed: boolean;
  language: string;
  summary: string;
  transcript: string;
}

export interface VideoAiQuestionDetail {
  id: string;
  question: string;
  survey: string;
  date: string;
  totalResponses: number;
  analyzedResponses: number;
  sentiment: { positive: number; neutral: number; negative: number };
  avgDuration: string;
  durationRange: { min: string; max: string };
  themes: string[];
  aiSummary: string;
  responses: VideoAiResponse[];
}

const DETAIL_RESPONSES: VideoAiResponse[] = [
  {
    id: '221640647',
    date: 'Jun 03 2026',
    sentiment: 'Positive',
    duration: '0:11',
    durationSeconds: 11,
    viewed: true,
    language: 'en',
    summary:
      'The speaker expressed strong satisfaction with Google Maps, highlighting real-time traffic rerouting as a feature that has consistently improved their daily commute.',
    transcript:
      "Google Maps is honestly amazing. The traffic rerouting happens automatically and I have never been late to a meeting because of it. It just works.",
  },
  {
    id: '221470507',
    date: 'Jun 03 2026',
    sentiment: 'Positive',
    duration: '0:07',
    durationSeconds: 7,
    viewed: true,
    language: 'en',
    summary:
      'Respondent highlighted daily reliance on Google Maps, with particular appreciation for live traffic updates that save significant commute time every morning.',
    transcript:
      "I use it every single day. The live traffic updates save me at least twenty minutes every morning on my commute.",
  },
  {
    id: '221502834',
    date: 'Jun 03 2026',
    sentiment: 'Neutral',
    duration: '0:22',
    durationSeconds: 22,
    viewed: false,
    language: 'en',
    summary:
      'Balanced feedback noting solid core navigation but frustration with inaccurate business hours. The respondent cited a specific negative experience of driving to a closed restaurant.',
    transcript:
      "It is pretty good for navigation but the business hours are often wrong. I drove thirty minutes to a restaurant that was actually closed. That was frustrating. The core directions work well though.",
  },
  {
    id: '221388912',
    date: 'Jun 03 2026',
    sentiment: 'Positive',
    duration: '0:34',
    durationSeconds: 34,
    viewed: false,
    language: 'en',
    summary:
      'Strong enthusiasm for Google Maps with specific praise for Street View for pre-visit neighborhood exploration and the integrated review and photo system for restaurant discovery.',
    transcript:
      "I absolutely love Google Maps. The Street View feature is something I use before visiting any new place. I checked out my new apartment neighborhood before moving in and found the nearest coffee shop. And the reviews and photos integration is really helpful for finding great restaurants. It is one of the most useful apps I have ever used.",
  },
  {
    id: '221519443',
    date: 'Jun 03 2026',
    sentiment: 'Negative',
    duration: '0:15',
    durationSeconds: 15,
    viewed: true,
    language: 'en',
    summary:
      'Critical response noting a perceived decline in quality, focused on sponsored results cluttering search and suspicion that routes are deliberately guided past commercial areas.',
    transcript:
      "Honestly Google Maps has gotten worse lately. The search results are full of sponsored places that push real results way down. And it seems like they route me past shopping centers on purpose.",
  },
  {
    id: '221601287',
    date: 'Jun 02 2026',
    sentiment: 'Positive',
    duration: '0:19',
    durationSeconds: 19,
    viewed: false,
    language: 'en',
    summary:
      'Positive experience centered on walking navigation and urban exploration. The respondent highlighted augmented reality walking directions as a standout innovative feature.',
    transcript:
      "For walking around the city it is absolutely perfect. I use it to explore new neighborhoods and have discovered so many hidden gems. The AR walking directions where arrows appear on the actual street are brilliant.",
  },
  {
    id: '221445670',
    date: 'Jun 02 2026',
    sentiment: 'Neutral',
    duration: '0:41',
    durationSeconds: 41,
    viewed: true,
    language: 'en',
    summary:
      'Mixed assessment comparing Google Maps favorably for place discovery and reviews while noting Waze as superior for real-time driving hazards. The respondent uses both apps for different purposes.',
    transcript:
      "It works fine for basic navigation but I switched to Waze for driving because the community hazard updates are so much better. Google Maps does not tell me about speed traps or road debris in real time. But for finding places, reading reviews, and planning trips, I still use Google Maps. I think they are each better at different things so I use both.",
  },
  {
    id: '221677201',
    date: 'Jun 02 2026',
    sentiment: 'Negative',
    duration: '0:09',
    durationSeconds: 9,
    viewed: false,
    language: 'en',
    summary:
      'Brief but critical response focused on outdated offline maps causing missed turns and navigation failures during a road trip in low-connectivity areas.',
    transcript:
      "The offline maps are terrible. I downloaded them for a road trip and they were completely outdated. I missed two turns and got really lost.",
  },
  {
    id: '221534890',
    date: 'Jun 01 2026',
    sentiment: 'Positive',
    duration: '1:02',
    durationSeconds: 62,
    viewed: true,
    language: 'en',
    summary:
      'Detailed positive analysis from a product perspective praising seamless feature integration, personalization capabilities, the timeline feature, and the Local Guides crowdsourcing model.',
    transcript:
      "From a product standpoint Google Maps is one of the best applications ever built. The way it integrates real-time traffic data, user reviews, business information, photos, and turn-by-turn navigation into one seamless experience is remarkable. What impresses me most is how it personalizes over time. It knows my home and work, it remembers my preferred routes, it learns what kind of places I like. The timeline feature showing everywhere I have been over the years is incredible. I once used it to recall which restaurant I visited on a specific date two years ago. And the Local Guides program where regular users contribute reviews and photos is a genius crowdsourcing strategy. It is a product that genuinely improves your daily life in a meaningful way.",
  },
  {
    id: '221490123',
    date: 'Jun 01 2026',
    sentiment: 'Positive',
    duration: '0:28',
    durationSeconds: 28,
    viewed: false,
    language: 'en',
    summary:
      'Enthusiastic response highlighting real-time crowd data and indoor navigation as underrated game-changing features for avoiding packed venues and navigating airports.',
    transcript:
      "I love Google Maps so much. The feature that shows how crowded a place is before you go has been a complete game changer for me. I used to hate arriving somewhere packed. Now I just check the busy times first. Also the indoor maps in airports and shopping malls are so underrated. I have not gotten lost in an airport once since they added that feature.",
  },
];

export const MOCK_VIDEO_AI_QUESTION_DETAIL: VideoAiQuestionDetail = {
  id: 'vai-001',
  question: 'How has been your experience with Google Maps?',
  survey: 'Video AI',
  date: 'Jun 03 2026',
  totalResponses: 23,
  analyzedResponses: 22,
  sentiment: { positive: 60, neutral: 22, negative: 18 },
  avgDuration: '0:27',
  durationRange: { min: '0:07', max: '1:02' },
  themes: ['Navigation accuracy', 'Traffic updates', 'Business information', 'Offline maps', 'Personalization'],
  aiSummary:
    'Respondents showed predominantly positive experiences with Google Maps, particularly praising real-time traffic rerouting, Street View, and integrated reviews. Common themes include daily utility, personalization, and exploratory features. Critical voices focused on declining search quality due to sponsored content and issues with outdated offline maps. Several neutral responses noted a preference for Waze for real-time driving hazards while continuing to use Google Maps for planning and discovery. Overall the product is viewed as an essential daily utility with room for improvement in ad transparency and offline map accuracy.',
  responses: DETAIL_RESPONSES,
};

export function getVideoAiQuestionDetail(id: string): VideoAiQuestionDetail | undefined {
  if (id === 'vai-001') return MOCK_VIDEO_AI_QUESTION_DETAIL;
  return {
    ...MOCK_VIDEO_AI_QUESTION_DETAIL,
    id,
    question: 'How has been your experience with Google Maps?',
    survey: 'Brand Perception Q2',
    date: 'May 28 2026',
  };
}
