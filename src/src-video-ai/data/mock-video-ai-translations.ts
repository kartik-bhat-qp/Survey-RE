import type { VideoAiResponse } from '@/data/mock-video-ai-detail';

export interface ResponseTranslation {
  summary: string;
  transcript: string;
}

/** Per-response translations keyed by target language code (excluding native content). */
export const RESPONSE_TRANSLATIONS: Record<string, Partial<Record<string, ResponseTranslation>>> = {
  '221640647': {
    es: {
      summary:
        'El encuestado expresó una gran satisfacción con Google Maps, destacando el redireccionamiento de tráfico en tiempo real como una función que ha mejorado constantemente su desplazamiento diario.',
      transcript:
        'Google Maps es increíble, sinceramente. El redireccionamiento de tráfico ocurre automáticamente y nunca he llegado tarde a una reunión por eso. Simplemente funciona.',
    },
    fr: {
      summary:
        'Le répondant a exprimé une grande satisfaction envers Google Maps, mettant en avant le réacheminement du trafic en temps réel comme une fonctionnalité qui a amélioré son trajet quotidien.',
      transcript:
        "Google Maps est honnêtement incroyable. Le réacheminement du trafic se fait automatiquement et je n'ai jamais été en retard à une réunion grâce à ça. Ça fonctionne tout simplement.",
    },
    de: {
      summary:
        'Der Befragte äußerte große Zufriedenheit mit Google Maps und hob die Echtzeit-Umleitung als Funktion hervor, die seinen täglichen Arbeitsweg verbessert hat.',
      transcript:
        'Google Maps ist ehrlich gesagt großartig. Die Verkehrsumleitung passiert automatisch und ich war deswegen nie zu spät zu einem Meeting. Es funktioniert einfach.',
    },
    pt: {
      summary:
        'O respondente expressou grande satisfação com o Google Maps, destacando o desvio de tráfego em tempo real como um recurso que melhorou consistentemente seu trajeto diário.',
      transcript:
        'O Google Maps é honestamente incrível. O desvio de tráfego acontece automaticamente e eu nunca me atrasei para uma reunião por causa disso. Simplesmente funciona.',
    },
    zh: {
      summary:
        '受访者对 Google 地图表示非常满意，尤其提到实时交通改道功能持续改善其日常通勤体验。',
      transcript:
        'Google 地图真的很棒。交通改道会自动发生，我因此从未开会迟到。它就是好用。',
    },
  },
  '221470507': {
    es: {
      summary:
        'El encuestado destacó su dependencia diaria de Google Maps, con especial aprecio por las actualizaciones de tráfico en vivo que ahorran tiempo significativo cada mañana.',
      transcript:
        'Lo uso todos los días. Las actualizaciones de tráfico en vivo me ahorran al menos veinte minutos cada mañana en mi trayecto.',
    },
    fr: {
      summary:
        'Le répondant a souligné sa dépendance quotidienne à Google Maps, avec une appréciation particulière pour les mises à jour du trafic en direct.',
      transcript:
        "Je l'utilise tous les jours. Les mises à jour du trafic en direct me font gagner au moins vingt minutes chaque matin.",
    },
    de: {
      summary:
        'Der Befragte betonte seine tägliche Nutzung von Google Maps und schätzte besonders die Live-Verkehrsupdates.',
      transcript:
        'Ich benutze es jeden Tag. Die Live-Verkehrsupdates sparen mir jeden Morgen mindestens zwanzig Minuten.',
    },
    pt: {
      summary:
        'O respondente destacou a dependência diária do Google Maps, com especial apreço pelas atualizações de trânsito ao vivo.',
      transcript:
        'Eu uso todos os dias. As atualizações de trânsito ao vivo me economizam pelo menos vinte minutos toda manhã.',
    },
    zh: {
      summary: '受访者强调每天依赖 Google 地图，尤其赞赏实时路况更新节省通勤时间。',
      transcript: '我每天都用它。实时路况更新每天早上至少为我节省二十分钟。',
    },
  },
  '221502834': {
    en: {
      summary:
        'Balanced feedback noting good core navigation but frustration with incorrect business hours.',
      transcript:
        'It is pretty good for navigation but the business hours are often wrong. I drove thirty minutes to a restaurant that was closed. That was frustrating. The core directions work well.',
    },
    fr: {
      summary:
        'Retour équilibré signalant une bonne navigation principale mais une frustration liée aux horaires commerciaux incorrects.',
      transcript:
        "C'est plutôt bon pour la navigation mais les horaires d'ouverture sont souvent incorrects. J'ai conduit trente minutes jusqu'à un restaurant fermé. C'était frustrant.",
    },
  },
  '221388912': {
    en: {
      summary:
        'Strong enthusiasm for Google Maps with specific praise for Street View and the integrated reviews and photos system.',
      transcript:
        "I absolutely love Google Maps. Street View is something I use before visiting any new place. I explored my new neighborhood before moving in and found the closest café. The reviews and photos integration is really helpful for finding good restaurants.",
    },
    es: {
      summary:
        'Gran entusiasmo por Google Maps con elogios específicos a Street View y al sistema integrado de reseñas y fotos.',
      transcript:
        'Me encanta Google Maps. Street View es algo que uso antes de visitar cualquier lugar nuevo. Exploré mi nuevo barrio antes de mudarme y encontré la cafetería más cercana.',
    },
  },
  '221519443': {
    en: {
      summary:
        'Critical response noting perceived quality decline, focused on sponsored results and suspicious routing.',
      transcript:
        'Honestly Google Maps has gotten worse lately. Search results are full of sponsored places pushing real results down. And it feels like they route me past shopping centers on purpose.',
    },
    fr: {
      summary:
        'Réponse critique notant une baisse de qualité perçue, centrée sur les résultats sponsorisés et un routage suspect.',
      transcript:
        'Honnêtement Google Maps s\'est dégradé récemment. Les résultats de recherche sont remplis de lieux sponsorisés. Et j\'ai l\'impression qu\'il me fait passer devant des centres commerciaux exprès.',
    },
  },
  '221601287': {
    es: {
      summary:
        'Experiencia positiva centrada en la navegación peatonal y la exploración urbana, destacando las direcciones AR como función innovadora.',
      transcript:
        'Para caminar por la ciudad es absolutamente perfecto. Lo uso para explorar nuevos barrios y he descubierto muchos lugares ocultos. Las direcciones AR con flechas en la calle son brillantes.',
    },
    fr: {
      summary:
        'Expérience positive centrée sur la navigation piétonne et l\'exploration urbaine, avec les directions AR comme atout majeur.',
      transcript:
        "Pour se promener en ville c'est absolument parfait. J'utilise l'application pour explorer de nouveaux quartiers. Les directions AR avec des flèches dans la rue sont géniales.",
    },
    de: {
      summary:
        'Positive Erfahrung mit Fokus auf Fußgängernavigation und Stadterkundung, hervorgehoben durch AR-Laufrichtungen.',
      transcript:
        'Zum Gehen in der Stadt ist es absolut perfekt. Ich nutze es, um neue Viertel zu erkunden. Die AR-Laufrichtungen mit Pfeilen auf der Straße sind brillant.',
    },
    pt: {
      summary:
        'Experiência positiva centrada na navegação a pé e exploração urbana, destacando as direções AR.',
      transcript:
        'Para caminhar pela cidade é absolutamente perfeito. Uso para explorar novos bairros. As direções AR com setas na rua são brilhantes.',
    },
    zh: {
      summary: '积极评价步行导航与城市探索，突出 AR 步行指引这一创新功能。',
      transcript: '在城市里步行导航非常完美。我用它探索新社区。街景 AR 箭头指引非常出色。',
    },
  },
  '221445670': {
    en: {
      summary:
        'Mixed review favoring Google Maps for place discovery and reviews while noting Waze is better for real-time driving hazards.',
      transcript:
        'Fine for basic navigation but I switched to Waze because community hazard updates are much better. Google Maps does not warn me about speed traps or road obstacles in real time. But I still use Google Maps for finding places, reading reviews, and planning trips.',
    },
  },
  '221677201': {
    en: {
      summary:
        'Brief critical response focused on outdated offline maps causing navigation failures during a road trip.',
      transcript:
        'Offline maps are terrible. I downloaded them for a road trip and they were completely outdated. I missed two turns and got completely lost.',
    },
    es: {
      summary:
        'Respuesta breve pero crítica sobre mapas offline desactualizados que causaron fallos de navegación.',
      transcript:
        'Los mapas offline son terribles. Los descargué para un viaje y estaban completamente desactualizados. Perdí dos curvas y me quedé completamente perdido.',
    },
  },
  '221534890': {
    es: {
      summary:
        'Análisis positivo detallado desde una perspectiva de producto, elogiando la integración de funciones y la personalización.',
      transcript:
        'Desde el punto de vista del producto, Google Maps es una de las mejores aplicaciones jamás creadas. Integra tráfico en tiempo real, reseñas, información comercial y navegación en una sola experiencia.',
    },
    fr: {
      summary:
        'Analyse positive détaillée saluant l\'intégration des fonctionnalités, la personnalisation et le programme Local Guides.',
      transcript:
        "Du point de vue produit, Google Maps est l'une des meilleures applications jamais créées. L'intégration du trafic, des avis et de la navigation est remarquable.",
    },
    de: {
      summary:
        'Detaillierte positive Analyse aus Produktsicht mit Lob für nahtlose Integration und Personalisierung.',
      transcript:
        'Aus Produktsicht ist Google Maps eine der besten Anwendungen überhaupt. Die Integration von Verkehrsdaten, Bewertungen und Navigation ist bemerkenswert.',
    },
    pt: {
      summary:
        'Análise positiva detalhada elogiando integração de recursos, personalização e o programa Local Guides.',
      transcript:
        'Do ponto de vista do produto, o Google Maps é um dos melhores aplicativos já criados. A integração de tráfego, avaliações e navegação é notável.',
    },
    zh: {
      summary: '从产品角度给出详细正面分析，称赞功能整合、个性化与 Local Guides 模式。',
      transcript: '从产品角度看，Google 地图是有史以来最好的应用之一。它把实时路况、用户评价和导航整合在一起，非常出色。',
    },
  },
  '221490123': {
    es: {
      summary:
        'Respuesta entusiasta que destaca los datos de afluencia en tiempo real y la navegación interior como funciones poco valoradas.',
      transcript:
        'Me encanta Google Maps. La función que muestra lo concurrido que está un lugar antes de ir ha cambiado completamente mi experiencia. Los mapas interiores en aeropuertos y centros comerciales están muy infravalorados.',
    },
    fr: {
      summary:
        'Réponse enthousiaste mettant en avant les données d\'affluence en temps réel et la navigation intérieure.',
      transcript:
        "J'adore Google Maps. La fonction qui montre l'affluence d'un lieu avant d'y aller a changé ma vie. Les plans intérieurs dans les aéroports sont très sous-estimés.",
    },
    de: {
      summary:
        'Begeisterte Antwort mit Fokus auf Echtzeit-Auslastungsdaten und Innenraumnavigation.',
      transcript:
        'Ich liebe Google Maps. Die Funktion, die zeigt, wie voll ein Ort ist, bevor man hingeht, war ein Wendepunkt. Innenkarten in Flughäfen sind sehr unterschätzt.',
    },
    pt: {
      summary:
        'Resposta entusiástica destacando dados de movimento em tempo real e navegação interna.',
      transcript:
        'Eu amo o Google Maps. O recurso que mostra o quão cheio um lugar está antes de ir mudou completamente minha experiência. Mapas internos em aeroportos são muito subestimados.',
    },
    zh: {
      summary: '热情评价实时拥挤度数据和室内导航等被低估的功能。',
      transcript: '我非常喜欢 Google 地图。出发前查看拥挤程度的功能改变了我的体验。机场室内地图非常被低估。',
    },
  },
};

export function getNativeLangCode(response: VideoAiResponse): string {
  return response.language.toLowerCase();
}

export function getTranslatedSummary(
  response: VideoAiResponse,
  targetLang: string,
  textOverrides?: { summary?: string },
): string {
  const original = textOverrides?.summary ?? response.summary;
  const nativeLang = getNativeLangCode(response);
  if (targetLang === nativeLang) return original;
  return RESPONSE_TRANSLATIONS[response.id]?.[targetLang]?.summary ?? original;
}

export function getTranslatedTranscript(
  response: VideoAiResponse,
  targetLang: string,
  textOverrides?: { transcript?: string },
): string {
  const original = textOverrides?.transcript ?? response.transcript;
  const nativeLang = getNativeLangCode(response);
  if (targetLang === nativeLang) return original;
  return RESPONSE_TRANSLATIONS[response.id]?.[targetLang]?.transcript ?? original;
}

export function getLanguageLabel(code: string): string {
  const labels: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    zh: 'Chinese',
    ja: 'Japanese',
  };
  return labels[code] ?? code.toUpperCase();
}
