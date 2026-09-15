import { useRef, useState } from 'react';
import { Film, ImagePlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { uploadMedia } from '@/services/storageService';
import { isVideoMediaUrl } from '@/lib/mediaUtils';

interface MediaUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
}

export function MediaUploadField({ label = 'Ad media', value, onChange, folder }: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadMedia(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isVideo = value ? isVideoMediaUrl(value) : false;

  return (
    <div className="space-y-3">
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... or upload image/video below"
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-lacvay-cream/70 px-4 py-2 text-[12.5px] font-semibold text-gray-700 transition hover:border-lacvay-green/40 hover:bg-lacvay-blush/50 hover:text-lacvay-green disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload media'}
        </button>
        {value && !isVideo && (
          <img src={value} alt="" className="h-14 w-14 rounded-xl border border-gray-100 bg-gray-50 object-cover" />
        )}
        {value && isVideo && (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-100 bg-gray-900 text-white">
            <Film className="h-5 w-5" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-gray-400">
        Images or short video ads. Stored in Supabase Storage ({folder}/). Max 5 MB.
      </p>
    </div>
  );
}
