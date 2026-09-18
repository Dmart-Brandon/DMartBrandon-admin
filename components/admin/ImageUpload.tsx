"use client";

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUpload({ values, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) { setError('Please select image files'); return; }

    const oversized = validFiles.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) { setError('Each image must be under 5MB'); return; }

    setIsUploading(true);
    setError('');

    try {
      const uploads = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data.url as string;
      });

      const newUrls = await Promise.all(uploads);
      onChange([...values, ...newUrls]);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const setAsMain = (index: number) => {
    if (index === 0) return;
    const reordered = [...values];
    const [moved] = reordered.splice(index, 1);
    reordered.unshift(moved);
    onChange(reordered);
  };

  return (
    <div className="space-y-3">
      {/* Uploaded images grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {values.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">
                  Main
                </span>
              )}
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => setAsMain(i)}
                  className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Set as main
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
      />
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        className={`w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1.5 transition-colors
          ${isUploading ? 'border-primary/40 bg-primary/10 cursor-wait' : 'border-border cursor-pointer hover:border-primary/60 hover:bg-primary/10'}`}
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <p className="text-sm text-primary font-medium">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              {values.length > 0 ? 'Add more images' : 'Click or drag images here'}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — max 5MB each · multiple allowed</p>
          </>
        )}
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
