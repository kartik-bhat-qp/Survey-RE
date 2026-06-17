'use client';

import { useParams } from 'next/navigation';
import { VideoAiQuestionDetail } from '@/components/video-ai/VideoAiQuestionDetail';

export default function VideoAiQuestionDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  return <VideoAiQuestionDetail questionId={id} />;
}
