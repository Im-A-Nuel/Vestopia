import Image from "next/image";

interface GameImageProps {
  src: string;
  alt: string;
  width: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function GameImage({ src, alt, width, height = width, className, priority = false }: GameImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={src.includes("/artwork/") ? `render-smooth ${className ?? ""}`.trim() : className}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      unoptimized
      draggable={false}
    />
  );
}
