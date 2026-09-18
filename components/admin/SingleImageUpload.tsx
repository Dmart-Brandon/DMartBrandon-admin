'use client';

import { ImageUpload } from './ImageUpload';

interface SingleImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

/**
 * Thin wrapper around <ImageUpload> for fields that hold exactly one URL.
 * Reuses the same drag/drop + S3 plumbing.
 */
export function SingleImageUpload({ value, onChange }: SingleImageUploadProps) {
  return (
    <ImageUpload
      values={value ? [value] : []}
      onChange={(urls) => onChange(urls[urls.length - 1] ?? '')}
    />
  );
}
