"use client";

import { useEffect, useState } from "react";

export type CropArea = { x: number; y: number; width: number; height: number };

/**
 * Renders an image inside a container, optionally cropped using source-image
 * pixel coordinates. The container should set its own width/height; this
 * component fills it.
 *
 * Without a crop, behaves like object-fit: cover.
 * With a crop, the image is absolutely positioned and scaled so that the
 * crop rectangle exactly fills the container.
 */
export function CroppedImage({
  src,
  crop,
  alt = "",
  fadeIn = true,
  onReady,
}: {
  src: string;
  crop?: CropArea | null;
  alt?: string;
  fadeIn?: boolean;
  onReady?: () => void;
}) {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!crop) {
      setNat(null);
      onReady?.();
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
      onReady?.();
    };
    img.onerror = () => onReady?.();
    img.src = src;
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, crop?.x, crop?.y, crop?.width, crop?.height]);

  if (!crop) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        onLoad={() => onReady?.()}
      />
    );
  }

  if (!nat) {
    // While measuring natural size, hold the slot empty (or with a faint preview)
    return null;
  }

  const widthPct = (nat.w / crop.width) * 100;
  const heightPct = (nat.h / crop.height) * 100;
  const leftPct = -(crop.x / crop.width) * 100;
  const topPct = -(crop.y / crop.height) * 100;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{
        position: "absolute",
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        left: `${leftPct}%`,
        top: `${topPct}%`,
        maxWidth: "none",
        opacity: fadeIn ? 1 : undefined,
      }}
    />
  );
}
