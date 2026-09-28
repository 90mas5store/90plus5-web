'use client';

import Image from "next/image";

type TeamLogoProps = {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
};

export default function TeamLogo({
  src,
  alt,
  size = 40,
  className = "",
}: TeamLogoProps) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: "auto", height: "auto" }}
      className={`object-contain max-w-full max-h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] ${className}`}
    />
  );
}
