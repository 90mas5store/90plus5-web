'use client';

import Image from "next/image";

type TeamLogoProps = {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function TeamLogo({
  src,
  alt,
  size = 40,
  className = "",
  style,
}: TeamLogoProps) {
  if (!src) return null;

  const isSvg = typeof src === 'string' && (src.includes('.svg') || src.startsWith('data:image/svg'));

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized={isSvg}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: "100%",
        maxHeight: "100%",
        ...style,
      }}
      className={`object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] ${className}`}
    />
  );
}
