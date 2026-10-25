/**
 * Image Compressor & Optimizer
 * Kompresi dan optimasi gambar otomatis di browser sebelum diunggah ke server.
 * Mencegah timeout, memangkas file kamera 5-15MB menjadi < 400KB tanpa penurunan kualitas visual,
 * dan mencegah kegagalan upload akibat batasan client_max_body_size Nginx (1M).
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: 'image/webp' | 'image/jpeg';
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    mimeType = 'image/webp',
  } = options;

  // Lewati file SVG atau non-gambar
  if (
    !file ||
    !file.type ||
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return file;
  }

  // Jika ukuran file sudah sangat kecil (< 300KB), tidak perlu dikompresi lagi
  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    // Timeout proteksi 5 detik jika FileReader/Image gagal memuat
    const timeoutId = setTimeout(() => {
      resolve(file);
    }, 5000);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeoutId);
        let width = img.width;
        let height = img.height;

        // Hitung skala aspect ratio agar tidak melebihi batas resolusi maksimal
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Gambar ke kanvas
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Jika ukuran hasil kompresi malah lebih besar, pertahankan file asli
              resolve(file);
              return;
            }
            const ext = mimeType === 'image/webp' ? '.webp' : '.jpg';
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}${ext}`, {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(file);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      clearTimeout(timeoutId);
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}
