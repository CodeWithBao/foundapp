export const MAX_IMAGES = 8;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 2048;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;
const HEIC_PATTERN = /(?:image\/(?:heic|heif)|\.(?:heic|heif)$)/i;

export function imageFileKey(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function validateImageFile(file) {
  if (!file) return 'Không thể đọc tệp đã chọn.';
  const typeAccepted = ACCEPTED_TYPES.has(String(file.type || '').toLowerCase());
  if (!typeAccepted && !ACCEPTED_EXTENSIONS.test(file.name || '')) {
    return `${file.name}: định dạng không hỗ trợ. Chỉ nhận JPG, PNG, WebP, HEIC hoặc HEIF.`;
  }
  if (file.size <= 0) return `${file.name}: tệp rỗng hoặc không thể đọc.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: vượt quá giới hạn 10 MB.`;
  return '';
}

export function normalizeImageOrder(images) {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const coverIndex = sorted.findIndex(image => image.isCover);
  if (coverIndex > 0) {
    const [cover] = sorted.splice(coverIndex, 1);
    sorted.unshift(cover);
  }
  return sorted.map((image, order) => ({
    ...image,
    order,
    isCover: order === 0,
  }));
}

export function createSelectedImage(file, source, order) {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    source,
    isCover: order === 0,
    order,
    status: 'ready',
    progress: 0,
    uploadedUrl: undefined,
    error: undefined,
    compressed: false,
    fileKey: imageFileKey(file),
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Không thể xử lý ảnh trên thiết bị này.'));
    }, type, quality);
  });
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Safari versions without complete createImageBitmap support use the
      // HTMLImageElement fallback below, which also honors EXIF orientation.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Không thể giải mã ảnh.'));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareImageFile(image) {
  if (image.compressed) return image.file;
  const isHeic = HEIC_PATTERN.test(`${image.file.type}:${image.file.name}`);
  let decoded;
  try {
    decoded = await decodeImage(image.file);
  } catch {
    if (isHeic) {
      throw new Error(`${image.file.name}: thiết bị này không thể chuyển đổi HEIC/HEIF. Vui lòng chọn bản JPG, PNG hoặc WebP.`);
    }
    throw new Error(`${image.file.name}: ảnh bị lỗi hoặc không thể giải mã.`);
  }

  try {
    const width = decoded.width || decoded.naturalWidth;
    const height = decoded.height || decoded.naturalHeight;
    if (!width || !height) throw new Error(`${image.file.name}: không xác định được kích thước ảnh.`);

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
    const outputWidth = Math.max(1, Math.round(width * scale));
    const outputHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext('2d');
    context.drawImage(decoded, 0, 0, outputWidth, outputHeight);

    let outputType = 'image/webp';
    let blob = await canvasToBlob(canvas, outputType, 0.85);
    if (blob.type !== 'image/webp') {
      outputType = 'image/jpeg';
      blob = await canvasToBlob(canvas, outputType, 0.85);
    }
    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error(`${image.file.name}: ảnh vẫn vượt quá 10 MB sau khi xử lý.`);
    }
    const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = (image.file.name || 'item-image').replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${extension}`, {
      type: outputType,
      lastModified: image.file.lastModified || Date.now(),
    });
  } finally {
    if (typeof decoded?.close === 'function') decoded.close();
  }
}
