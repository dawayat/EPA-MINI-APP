/** Embed readable raster bytes so redirects can never taint the report canvas. */
export async function reportImageDataUrl(source: string): Promise<string | null> {
  try {
    const response = await fetch(source, { mode: 'cors', credentials: 'same-origin', signal: AbortSignal.timeout(15000) });
    if (!response.ok || response.type === 'opaque') return null;
    const blob = await response.blob();
    if (!/^image\/(png|jpe?g|webp|gif|avif|bmp)$/i.test(blob.type) || !blob.size || blob.size > 10 * 1024 * 1024) return null;
    return await new Promise<string | null>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}
