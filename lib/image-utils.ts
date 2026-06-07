export async function imageFileToBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

export async function processLogoForDocx(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

export async function processImageGreyscale(
  imageBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  const blob = new Blob([imageBuffer]);
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const val = grey < 180 ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = val;
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas toBlob failed"));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}
