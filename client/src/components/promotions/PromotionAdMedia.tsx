import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isVideoMediaUrl } from '@/lib/mediaUtils';

interface PromotionAdMediaProps {
  url?: string;
  title: string;
  className?: string;
  mediaClassName?: string;
  fallbackClassName?: string;
}

export function PromotionAdMedia({
  url,
  title,
  className,
  mediaClassName,
  fallbackClassName,
}: PromotionAdMediaProps) {
  if (!url) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-lacvay-yellow/25 to-lacvay-blush/40 p-4 text-center',
          fallbackClassName,
          className,
        )}
      >
        <Film className="h-8 w-8 text-lacvay-green/50" />
        <p className="text-[11px] font-semibold text-gray-500">No media uploaded</p>
      </div>
    );
  }

  if (isVideoMediaUrl(url)) {
    return (
      <video
        src={url}
        className={cn('h-full w-full object-cover', mediaClassName, className)}
        muted
        loop
        playsInline
        autoPlay
        aria-label={title}
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={cn('h-full w-full object-cover', mediaClassName, className)}
    />
  );
}
