const estimateDataUrlSize = (dataUrl) => {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

const renderToDataUrl = (canvas, type, quality) => {
  return canvas.toDataURL(type, quality);
};

export async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.8, maxBytes = 1_500_000) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = (e) => reject(e);
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = (e) => reject(e);
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const preferredType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          let dataUrl = renderToDataUrl(canvas, preferredType, quality);

          if (estimateDataUrlSize(dataUrl) > maxBytes) {
            dataUrl = renderToDataUrl(canvas, 'image/jpeg', Math.max(0.55, quality - 0.15));
          }

          if (estimateDataUrlSize(dataUrl) > maxBytes) {
            dataUrl = renderToDataUrl(canvas, 'image/jpeg', 0.5);
          }

          resolve(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
}

export default compressImage;
