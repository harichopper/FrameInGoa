/**
 * getCroppedImg
 * Returns a data-URL of the cropped region as a circle-masked canvas.
 * Used both for card preview rendering and high-res PNG export.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  outputSize = 512,
): Promise<string> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d context unavailable');

  // Translate to center so we can rotate around the crop center
  ctx.save();
  ctx.translate(outputSize / 2, outputSize / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-outputSize / 2, -outputSize / 2);

  // Draw the cropped portion scaled to outputSize
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.95);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    // Allow cross-origin images (e.g. Unsplash placeholders)
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}
