import Image from 'next/image';
import { FeaturedImage as FeaturedImageType } from '@/lib/wordpress/types';

interface FeaturedImageProps {
  image: FeaturedImageType;
  className?: string;
  priority?: boolean;
}

export default function FeaturedImage({
  image,
  className = '',
  priority = false,
}: FeaturedImageProps) {
  const { sourceUrl, altText, mediaDetails } = image.node;

  const width = mediaDetails?.width || 1200;
  const height = mediaDetails?.height || 630;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={sourceUrl}
        alt={altText || ''}
        width={width}
        height={height}
        className="object-cover w-full h-full"
        priority={priority}
      />
    </div>
  );
}
