/** Prepare the exact crop once so email apps do not need CSS image clipping. */
export function cropRightHalf(source: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      try {
        const width = Math.max(1, Math.floor(image.naturalWidth / 2));
        const height = image.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context || !height) throw new Error('Could not crop the venue photo.');
        context.drawImage(image, image.naturalWidth - width, 0, width, height, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error('Could not read the venue photo.'));
    image.src = source;
  });
}
