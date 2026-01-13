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
}: TeamLogoProps) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
    />
  );
}

