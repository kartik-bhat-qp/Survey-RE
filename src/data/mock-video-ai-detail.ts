export type SentimentValue = 'Positive' | 'Neutral' | 'Negative';

export interface VideoAiResponse {
  id: string;
  date: string;
  sentiment: SentimentValue;
  duration: string;
  durationSeconds: number;
  viewed: boolean;
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
    summary:
      'The speaker expressed a strong personal connection to the brand as a result of the social media post. This indicates positive engagement and resonance with the brand messaging through social channels.',
    transcript:
      'Yeah I really love this, the colors remind me of the treats I buy for my dog already. It feels really authentic and the dog is so cute…',
  },
  {
    id: '221470507',
    date: 'Jun 03 2026',
    sentiment: 'Positive',
    duration: '0:07',
    durationSeconds: 7,
    viewed: true,
    summary:
      'The discussion focused on the connection and relatability of the media campaign. The participant expressed personal resonance, suggesting the campaign effectively engages the intended audience.',
    transcript:
      'Oh this is nice! I follow this brand on Instagram already. The post feels very on-brand and I would definitely share this with my friends…',
  },
  {
    id: '221502834',
    date: 'Jun 03 2026',
    sentiment: 'Neutral',
    duration: '0:22',
    durationSeconds: 22,
    viewed: false,
    summary:
      'The respondent provided a balanced view, noting both strengths in visual design and areas for improvement in product placement. They felt the post was visually appealing but lacked clear product information.',
    transcript:
      "It looks nice I guess, the colors are pretty. But I'm not sure what they're actually selling? Like the dog is cute but I had to look hard to see the product…",
  },
  {
    id: '221388912',
    date: 'Jun 03 2026',
    sentiment: 'Positive',
    duration: '0:34',
    durationSeconds: 34,
    viewed: false,
    summary:
      "Strong emotional response to the brand identity. The participant highlighted specific design elements that resonated, including color palette and lifestyle positioning.",
    transcript:
      "I love everything about this! The pastel colors, the happy dog, the whole vibe. It makes me want to buy these treats even though I don't have a dog yet…",
  },
  {
    id: '221519443',
    date: 'Jun 03 2026',
    sentiment: 'Negative',
    duration: '0:15',
    durationSeconds: 15,
    viewed: true,
    summary:
      'The respondent felt the post was visually cluttered and the product was not prominent enough. They suggested the brand prioritize product visibility over lifestyle imagery.',
    transcript:
      "Honestly I'm not a fan. There's too much going on, the dog takes up most of the image and I can barely see the product. If I were scrolling I'd just skip past this…",
  },
  {
    id: '221601287',
    date: 'Jun 02 2026',
    sentiment: 'Positive',
    duration: '0:19',
    durationSeconds: 19,
    viewed: false,
    summary:
      "Positive reaction centered on brand authenticity and the use of a real pet versus a stock image. The participant valued the organic feel of the campaign.",
    transcript:
      "This feels really genuine, like it's not overly polished which I appreciate. The dog looks like a real pet not a model dog and that makes me trust the brand more…",
  },
  {
    id: '221445670',
    date: 'Jun 02 2026',
    sentiment: 'Neutral',
    duration: '0:41',
    durationSeconds: 41,
    viewed: true,
    summary:
      "Mixed feedback — appreciated the creative direction but questioned whether the ad would perform well on all social platforms. Suggested platform-specific adaptations.",
    transcript:
      "For Instagram this works great. But if this showed up on my Twitter feed I think the format would be off. It's very square and visual, not sure about other platforms…",
  },
  {
    id: '221677201',
    date: 'Jun 02 2026',
    sentiment: 'Negative',
    duration: '0:09',
    durationSeconds: 9,
    viewed: false,
    summary:
      "Brief but critical response. The participant did not connect with the visual style and found the color scheme unappetizing for a pet food product.",
    transcript:
      "The pastels don't say pet food to me. I think of baby products. It's confusing and wouldn't make me want to buy treats for my dog…",
  },
  {
    id: '221534890',
    date: 'Jun 01 2026',
    sentiment: 'Positive',
    duration: '1:02',
    durationSeconds: 62,
    viewed: true,
    summary:
      "Detailed positive analysis of the post's effectiveness. The respondent works in marketing and praised the campaign strategy, noting strong brand-audience alignment.",
    transcript:
      "From a marketing perspective this is solid. The color palette is cohesive, the product placement is subtle but effective, and the dog creates an emotional hook…",
  },
  {
    id: '221490123',
    date: 'Jun 01 2026',
    sentiment: 'Positive',
    duration: '0:28',
    durationSeconds: 28,
    viewed: false,
    summary:
      "Enthusiastic response with emphasis on shareability. The participant mentioned they would engage with and share this type of content on their personal social accounts.",
    transcript:
      "Oh my god the dog! I would 100% share this. My friends and I always send each other cute dog content and this would fit right in. Smart marketing actually…",
  },
];

export const MOCK_VIDEO_AI_QUESTION_DETAIL: VideoAiQuestionDetail = {
  id: 'vai-001',
  question: 'How do you feel about this social media post?',
  survey: 'Video AI',
  date: 'Jun 03 2026',
  totalResponses: 23,
  analyzedResponses: 22,
  sentiment: { positive: 68, neutral: 23, negative: 9 },
  avgDuration: '0:38',
  durationRange: { min: '0:07', max: '1:42' },
  themes: ['Brand affinity', 'Visual appeal', 'Product visibility', 'Color recognition'],
  aiSummary:
    'Respondents generally had a positive reaction to the social media post, with many expressing a strong personal connection to the brand. Common themes include appreciation for visual aesthetics, product color recognition, and suggestions to improve product prominence in the imagery. Several participants noted the campaign felt relatable and authentic, while a minority felt the messaging could be better tailored to specific social platforms. Constructive critiques centered on enhancing product visibility and ensuring the content resonates across different demographics.',
  responses: DETAIL_RESPONSES,
};

export function getVideoAiQuestionDetail(id: string): VideoAiQuestionDetail | undefined {
  if (id === 'vai-001') return MOCK_VIDEO_AI_QUESTION_DETAIL;
  return {
    ...MOCK_VIDEO_AI_QUESTION_DETAIL,
    id,
    question: 'What comes to mind when you see this brand logo?',
    survey: 'Brand Perception Q2',
    date: 'May 28 2026',
  };
}
