import Image from 'next/image';

/**
 * Renders a product image. Uses next/image (optimised, lazy) for real URLs
 * (Supabase Storage / Unsplash), falls back to a plain <img> for legacy base64
 * data: URLs, and shows a neutral placeholder when there is no image.
 * The parent element must be `position: relative` (next/image uses `fill`).
 */
export default function ProductImage({
  src,
  alt,
  sizes,
  className = '',
  priority = false,
}: {
  src?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return <div className="w-full h-full bg-neutral-200" aria-hidden />;
  }
  const isRemote = /^https?:\/\//i.test(src);
  if (!isRemote) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes || '(max-width: 768px) 100vw, 25vw'}
      className={`object-cover ${className}`}
      priority={priority}
    />
  );
}
