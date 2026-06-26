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
    language: 'EN',
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
    language: 'EN',
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
    language: 'ES',
    summary:
      'Retroalimentación equilibrada que señala una buena navegación principal pero frustración con los horarios comerciales incorrectos.',
    transcript:
      "Es bastante bueno para la navegación pero los horarios comerciales suelen estar equivocados. Conduje treinta minutos a un restaurante que estaba cerrado. Eso fue frustrante. Las indicaciones principales funcionan bien.",
  },
  {
    id: '221388912',
    date: 'Jun 03 2026',
    sentiment: 'Positive',
    duration: '0:34',
    durationSeconds: 34,
    viewed: false,
    language: 'FR',
    summary:
      'Enthousiasme fort pour Google Maps avec des éloges spécifiques pour Street View et le système intégré d\'avis et de photos.',
    transcript:
      "J'adore absolument Google Maps. La fonctionnalité Street View est quelque chose que j'utilise avant de visiter tout nouvel endroit. J'ai exploré mon nouveau quartier avant d'emménager et j'ai trouvé le café le plus proche. Et l'intégration des avis et photos est vraiment utile pour trouver de bons restaurants.",
  },
  {
    id: '221519443',
    date: 'Jun 03 2026',
    sentiment: 'Negative',
    duration: '0:15',
    durationSeconds: 15,
    viewed: true,
    language: 'DE',
    summary:
      'Kritische Antwort, die einen wahrgenommenen Qualitätsverlust anmerkt, fokussiert auf gesponserte Ergebnisse und verdächtige Routenführung.',
    transcript:
      "Ehrlich gesagt ist Google Maps in letzter Zeit schlechter geworden. Die Suchergebnisse sind voller gesponserter Orte, die echte Ergebnisse weit nach unten schieben. Und es scheint, als würden sie mich absichtlich an Einkaufszentren vorbeiführen.",
  },
  {
    id: '221601287',
    date: 'Jun 02 2026',
    sentiment: 'Positive',
    duration: '0:19',
    durationSeconds: 19,
    viewed: false,
    language: 'EN',
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
    language: 'JA',
    summary:
      'Googleマップを場所探しやレビューに好意的に評価しつつ、リアルタイム運転ハザードではWazeが優れていると指摘する混合評価。',
    transcript:
      "基本的なナビゲーションには問題ありませんが、コミュニティハザード更新がはるかに優れているWazeに切り替えました。Googleマップはスピードトラップや道路の障害物をリアルタイムで教えてくれません。でも場所を探したり、レビューを読んだり、旅行を計画したりするためにはGoogleマップを使い続けています。",
  },
  {
    id: '221677201',
    date: 'Jun 02 2026',
    sentiment: 'Negative',
    duration: '0:09',
    durationSeconds: 9,
    viewed: false,
    language: 'PT',
    summary:
      'Resposta breve mas crítica focada em mapas offline desatualizados causando falhas de navegação durante uma viagem.',
    transcript:
      "Os mapas offline são terríveis. Baixei-os para uma viagem de carro e estavam completamente desatualizados. Perdi duas curvas e fiquei completamente perdido.",
  },
  {
    id: '221534890',
    date: 'Jun 01 2026',
    sentiment: 'Positive',
    duration: '1:02',
    durationSeconds: 62,
    viewed: true,
    language: 'EN',
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
    language: 'EN',
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
