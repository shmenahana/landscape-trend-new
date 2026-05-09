export type CropArea = { x: number; y: number; width: number; height: number };

export async function getCroppedSquare(
  imageSrc: string,
  pixelCrop: CropArea,
  maxSize = 1200,
  quality = 0.85
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const target = Math.min(maxSize, Math.max(pixelCrop.width, pixelCrop.height));

  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
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
    target,
    target
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
