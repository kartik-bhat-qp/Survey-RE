'use client';

import { use } from 'react';
import { VideoAiQuestionDetail } from '@/components/video-ai/VideoAiQuestionDetail';

export default function VideoAiQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <VideoAiQuestionDetail questionId={id} />;
}
