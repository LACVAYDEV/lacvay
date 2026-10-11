import { supabase } from '@/lib/supabase';

const BUCKET = 'lacvay-media';
const MAX_BYTES = 5 * 1024 * 1024;

function assertMediaFile(file: File, allowVideo: boolean): void {
  const isImage = file.type.startsWith('image/');
  const isVideo = allowVideo && file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    throw new Error(
      allowVideo
        ? 'Please select an image (JPEG, PNG, WebP, GIF) or video (MP4, WebM).'
        : 'Please select an image file (JPEG, PNG, WebP, or GIF).',
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File must be 5 MB or smaller.');
  }
}

function generateSafeFileName(file: File, fallbackExt = 'jpg'): string {
  const rawExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileExt = rawExt && rawExt.length > 0 && rawExt.length <= 10 ? rawExt : fallbackExt;
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return `${uuid}.${fileExt}`;
}

function sanitizeFolder(folder: string): string {
  return folder.replace(/[^a-zA-Z0-9_-]/g, '').trim() || 'uploads';
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  assertMediaFile(file, false);

  const safeFileName = generateSafeFileName(file, 'jpg');
  const safeFolder = sanitizeFolder(folder);
  const path = `${safeFolder}/${safeFileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadMedia(file: File, folder: string): Promise<string> {
  assertMediaFile(file, true);

  const isVideo = file.type.startsWith('video/');
  const safeFileName = generateSafeFileName(file, isVideo ? 'mp4' : 'jpg');
  const safeFolder = sanitizeFolder(folder);
  const path = `${safeFolder}/${safeFileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
