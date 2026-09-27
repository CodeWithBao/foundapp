const HASH_SIZE = 8;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    if (!source) return reject(new Error('missing image'));
    const image = new Image();
    const timer = setTimeout(() => reject(new Error('image timeout')), 6000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('cannot read image')); };
    if (!String(source).startsWith('data:')) image.crossOrigin = 'anonymous';
    image.src = source;
  });
}

export async function createImageFingerprint(source) {
  if (!source || typeof document === 'undefined') return '';
  try {
    const image = await loadImage(source);
    const canvas = document.createElement('canvas');
    canvas.width = HASH_SIZE;
    canvas.height = HASH_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, HASH_SIZE, HASH_SIZE);
    const pixels = context.getImageData(0, 0, HASH_SIZE, HASH_SIZE).data;
    const gray = [];
    for (let index = 0; index < pixels.length; index += 4) {
      gray.push(Math.round(pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114));
    }
    const average = gray.reduce((sum, value) => sum + value, 0) / gray.length;
    return gray.map(value => (value >= average ? '1' : '0')).join('');
  } catch (error) {
    console.warn('Không thể tạo dấu vân tay ảnh:', error.message);
    return '';
  }
}

export function compareImageFingerprints(left = '', right = '') {
  if (left.length < 16 || left.length !== right.length) return 0;
  let different = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) different += 1;
  }
  return Math.max(0, 1 - different / left.length);
}
