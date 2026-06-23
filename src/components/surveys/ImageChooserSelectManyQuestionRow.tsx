'use client';

import {
  ImageChooserSelectOneQuestionRow,
  type ImageChooserSelectOneQuestionRowProps,
} from '@/components/surveys/ImageChooserSelectOneQuestionRow';

export type ImageChooserSelectManyQuestionRowProps = Omit<
  ImageChooserSelectOneQuestionRowProps,
  'cardClassName' | 'compactOptions'
>;

export function ImageChooserSelectManyQuestionRow(
  props: ImageChooserSelectManyQuestionRowProps
) {
  return (
    <ImageChooserSelectOneQuestionRow
      {...props}
      cardClassName="imageChooserSelectManyCard"
      compactOptions={props.question.options.length > 2}
    />
  );
}
