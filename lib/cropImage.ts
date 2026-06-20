export type CropArea = { x: number; y: number; width: number; height: number };

/**
 * Crop and resize an image region. Supports both square (1:1) and rectangular (2:3) outputs.
 * `maxW`/`maxH` control the maximum output dimensions independently.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  size: { maxW: number; maxH: number } = { maxW: 1200, maxH: 1200 },
  quality = 0.85
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const scale = Math.min(size.maxW / pixelCrop.width, size.maxH / pixelCrop.height, 1);
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

/** Keep the old name working for any other callers. */
export const getCroppedSquare = (src: string, crop: CropArea, maxSize = 1200, quality = 0.85) =>
  getCroppedImg(src, crop, { maxW: maxSize, maxH: maxSize }, quality);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
