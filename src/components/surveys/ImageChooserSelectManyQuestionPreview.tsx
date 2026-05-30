'use client';

import type { ImageChooserSelectManyPreviewData } from '@/data/mock-add-question-previews';
import { ImageChooserSelectOneQuestionPreview } from '@/components/surveys/ImageChooserSelectOneQuestionPreview';

interface ImageChooserSelectManyQuestionPreviewProps {
  data: ImageChooserSelectManyPreviewData;
}

export function ImageChooserSelectManyQuestionPreview({
  data,
}: ImageChooserSelectManyQuestionPreviewProps) {
  return <ImageChooserSelectOneQuestionPreview data={data} compactLayout />;
}
