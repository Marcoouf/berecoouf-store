"use client";

import clsx from "clsx";
import SmartImage from "./SmartImage";

interface Props {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  padding?: number;
  className?: string;
  imageClassName?: string;
  loading?: 'lazy' | 'eager';
}

const DEFAULT_PADDING = 32; // px

export default function ConditionalPaddingImage({
  src,
  alt,
  sizes,
  priority,
  quality,
  padding = DEFAULT_PADDING,
  className,
  imageClassName,
  loading,
}: Props) {
  return (
    <div className={clsx("absolute inset-0 bg-white", className)} style={{ padding }}>
      <SmartImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        loading={loading}
        wrapperClassName="relative h-full w-full"
        className={clsx("!object-contain", imageClassName)}
      />
    </div>
  );
}
