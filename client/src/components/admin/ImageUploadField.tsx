import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { uploadImage } from '@/services/storageService';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
}

export function ImageUploadField({ label = 'Image', value, onChange, folder }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://... or upload below" />
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
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
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
        {value && (
          <img src={value} alt="" className="h-14 w-14 rounded-xl border border-gray-100 bg-gray-50 object-cover" />
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-gray-400">Stored in Supabase Storage ({folder}/). Max 5 MB.</p>
    </div>
  );
}
