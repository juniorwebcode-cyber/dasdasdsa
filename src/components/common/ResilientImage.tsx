import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ResilientImage({
  src,
  alt,
  className,
  fallbackTitle
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'w-full h-full min-h-[240px] flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#F3F1EC] via-[#FAF9F6] to-[#EAE6DF] text-[#52525B] p-6 text-center',
          className
        )}
      >
        <Building2 className="w-8 h-8 text-[#1E4D5C]/60" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#52525B] max-w-[22ch] line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('w-full h-full object-cover', className)}
      loading="lazy"
    />
  );
}
