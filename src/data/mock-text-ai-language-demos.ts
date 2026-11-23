import type { TextAiAnalysisRow, TextAiResponseLanguage } from './mock-text-ai-widget-data';
import type { TextAiSummaryWidget } from './mock-text-ai-summary-widget';

interface DemoComment {
  original: string;
  english: string;
  theme: string;
  subtheme: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

interface TextAiLanguageDemo {
  id: number;
  title: string;
  language: TextAiResponseLanguage;
  question: string;
  summary: string;
  sentimentSummary: string;
  comments: DemoComment[];
}

export const TEXT_AI_LANGUAGE_DEMOS: TextAiLanguageDemo[] = [
  {
    id: 24,
    title: 'Online Checkout Feedback',
    language: { code: 'es', name: 'Spanish' },
    question: 'How was your online checkout experience?',
    summary: 'Customers appreciated guest checkout and clear delivery dates. They wanted to see shipping costs earlier and keep their cart after a failed payment.',
    sentimentSummary: 'Feedback was positive about convenience and delivery information. Payment failures and late fees drove the critical comments.',
    comments: [
      {
        original: 'Pude pagar sin crear una cuenta. Terminé la compra en menos de dos minutos.',
        english: 'I could pay without creating an account. I finished my purchase in under two minutes.',
        theme: 'Checkout convenience',
        subtheme: 'Guest checkout',
        sentiment: 'positive',
      },
      {
        original: 'Me gustó que la fecha de entrega apareciera antes de confirmar el pedido.',
        english: 'I liked seeing the delivery date before confirming my order.',
        theme: 'Delivery information',
        subtheme: 'Delivery date',
        sentiment: 'positive',
      },
      {
        original: 'Los gastos de envío solo aparecieron al final. Habría sido útil verlos antes.',
        english: 'Shipping costs only showed up at the end. It would have been helpful to see them earlier.',
        theme: 'Delivery information',
        subtheme: 'Shipping costs',
        sentiment: 'negative',
      },
      {
        original: 'La tarjeta fue rechazada y, al volver a intentarlo, el carrito estaba vacío.',
        english: 'My card was declined, and when I tried again the cart was empty.',
        theme: 'Payment',
        subtheme: 'Payment recovery',
        sentiment: 'negative',
      },
      {
        original: 'Desde el móvil me costó corregir la dirección, pero el pago fue rápido.',
        english: 'It was hard to correct my address on my phone, but payment was quick.',
        theme: 'Checkout convenience',
        subtheme: 'Mobile form',
        sentiment: 'mixed',
      },
      {
        original: 'Recibí el correo de confirmación enseguida y el resumen era fácil de entender.',
        english: 'I got the confirmation email right away, and the summary was easy to understand.',
        theme: 'Order confirmation',
        subtheme: 'Confirmation email',
        sentiment: 'positive',
      },
    ],
  },
  {
    id: 25,
    title: 'Customer Support Survey',
    language: { code: 'fr', name: 'French' },
    question: 'How was your recent experience with customer support?',
    summary: 'Customers valued clear explanations and fixes on the first call. Long chat queues, repeated explanations, and missing updates made unresolved cases harder to follow.',
    sentimentSummary: 'Customers praised effective agents. Waiting and having to repeat information accounted for most of the negative feedback.',
    comments: [
      {
        original: 'La conseillère a réglé mon problème dès le premier appel et m’a expliqué la marche à suivre.',
        english: 'The agent solved my problem on the first call and explained what to do next.',
        theme: 'Resolution',
        subtheme: 'First-contact resolution',
        sentiment: 'positive',
      },
      {
        original: 'J’ai attendu près de vingt minutes avant que quelqu’un me réponde sur le chat.',
        english: 'I waited almost twenty minutes before anyone answered me in chat.',
        theme: 'Response time',
        subtheme: 'Chat queue',
        sentiment: 'negative',
      },
      {
        original: 'Le remboursement a bien été effectué, mais je n’ai reçu aucune nouvelle entre-temps.',
        english: 'The refund went through, but I received no updates in the meantime.',
        theme: 'Communication',
        subtheme: 'Status updates',
        sentiment: 'mixed',
      },
      {
        original: 'J’ai dû raconter toute l’histoire au deuxième interlocuteur, alors que j’avais déjà donné le numéro du dossier.',
        english: 'I had to explain everything to the second agent even though I had already given the case number.',
        theme: 'Communication',
        subtheme: 'Agent handoff',
        sentiment: 'negative',
      },
      {
        original: 'Les instructions reçues par courriel étaient claires. J’ai pu réactiver mon compte sans rappeler.',
        english: 'The instructions in the email were clear. I was able to reactivate my account without calling again.',
        theme: 'Resolution',
        subtheme: 'Self-service instructions',
        sentiment: 'positive',
      },
      {
        original: 'Un rappel automatique serait pratique quand la file d’attente est longue.',
        english: 'An automatic callback would be useful when the queue is long.',
        theme: 'Response time',
        subtheme: 'Callback option',
        sentiment: 'neutral',
      },
    ],
  },
  {
    id: 26,
    title: 'New Hire Onboarding Survey',
    language: { code: 'de', name: 'German' },
    question: 'What helped you get started, and what could we improve?',
    summary: 'A prepared laptop, a buddy, and a clear first-week plan helped new hires settle in. Delayed system access and overlapping training sessions slowed them down.',
    sentimentSummary: 'Feedback about team support was positive. The strongest criticism concerned waiting for access and uncertainty about schedules.',
    comments: [
      {
        original: 'Mein Laptop war am ersten Tag bereit, und alle wichtigen Programme waren schon installiert.',
        english: 'My laptop was ready on the first day, and all the important programs were already installed.',
        theme: 'Equipment and access',
        subtheme: 'Laptop setup',
        sentiment: 'positive',
      },
      {
        original: 'Bis ich Zugriff auf die Projektordner hatte, sind drei Tage vergangen.',
        english: 'It took three days before I had access to the project folders.',
        theme: 'Equipment and access',
        subtheme: 'System permissions',
        sentiment: 'negative',
      },
      {
        original: 'Meine Patin hat sich jeden Morgen kurz Zeit genommen. So konnte ich Fragen direkt klären.',
        english: 'My onboarding buddy made time for me every morning, so I could get my questions answered right away.',
        theme: 'Team support',
        subtheme: 'Onboarding buddy',
        sentiment: 'positive',
      },
      {
        original: 'Der Plan für die erste Woche war hilfreich, aber zwei Schulungen lagen zur gleichen Zeit.',
        english: 'The first-week plan was helpful, but two training sessions were scheduled at the same time.',
        theme: 'Training',
        subtheme: 'Scheduling',
        sentiment: 'mixed',
      },
      {
        original: 'Eine kurze Checkliste vor dem Start hätte mir geholfen, die Unterlagen rechtzeitig zusammenzustellen.',
        english: 'A short checklist before I started would have helped me get my paperwork together on time.',
        theme: 'Preparation',
        subtheme: 'Pre-start checklist',
        sentiment: 'neutral',
      },
      {
        original: 'Beim gemeinsamen Mittagessen habe ich schnell jemanden kennengelernt, an den ich mich mit Fragen wenden konnte.',
        english: 'At the team lunch I quickly met someone I could go to with questions.',
        theme: 'Team support',
        subtheme: 'Team introductions',
        sentiment: 'positive',
      },
    ],
  },
];

export function getTextAiLanguageDemo(dashboardId: number): TextAiLanguageDemo | undefined {
  return TEXT_AI_LANGUAGE_DEMOS.find(demo => demo.id === dashboardId);
}

export function textAiLanguageDemoRows(demo: TextAiLanguageDemo): TextAiAnalysisRow[] {
  return demo.comments.map((comment, index) => ({
    id: index + 1,
    value: comment.original,
    translatedValue: comment.english,
    topic: comment.theme,
    subtopic: comment.subtheme,
    subtopicTone: comment.sentiment === 'positive' ? 'positive' : 'neutral',
    sentiment: comment.sentiment,
    insight: '',
    tags: [comment.subtheme],
    collectedOn: `2026-11-${17 + index}`,
  }));
}

export function textAiLanguageDemoSummary(demo: TextAiLanguageDemo): TextAiSummaryWidget {
  const overview = { heading: 'Overall Snapshot', paragraphs: [demo.summary] };
  return {
    id: 'language-summary',
    question: demo.question,
    summaryTypes: [
      { id: 'thematic', label: 'Thematic', isDefault: true, sections: [overview] },
      { id: 'thematic-sentiment', label: 'Thematic & Sentiment', sections: [
        overview,
        { heading: 'Sentiment', paragraphs: [demo.sentimentSummary] },
      ] },
    ],
  };
}
