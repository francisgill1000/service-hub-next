export async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) {
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

          // Choose output type — prefer jpeg for compression. Preserve png if transparency likely required.
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, quality);
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
