import jsQR from 'jsqr';

/**
 * Robust QR code decoder from an Image or File.
 * Employs multiple strategies:
 * 1. Native browser BarcodeDetector API (fast, ML Kit hardware-accelerated, handles arbitrary rotation & screen angles).
 * 2. jsQR on native canvas with both normal and inverted colors.
 * 3. Multi-scale downscaling (screenshots from modern smartphones are often 1080x2400 or 1440x3120,
 *    where QR modules are too large for jsQR's sampling grid unless scaled down to ~800-1000px).
 */
export async function decodeQRFromImageElement(img: HTMLImageElement): Promise<string | null> {
  // Strategy 1: Browser native BarcodeDetector API
  const BarcodeDetectorClass = (typeof window !== 'undefined' && (window as any).BarcodeDetector) || null;
  if (BarcodeDetectorClass) {
    try {
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      const barcodes = await detector.detect(img);
      if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
        return barcodes[0].rawValue.trim();
      }
    } catch {
      // Fall through to jsQR
    }
  }

  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;
  if (!naturalWidth || !naturalHeight) return null;

  // Scales to attempt: 1x (native), and downscaled targets (1000px, 750px, 500px)
  const maxDim = Math.max(naturalWidth, naturalHeight);
  const targetSizes: number[] = [maxDim];
  if (maxDim > 1200) targetSizes.push(1000);
  if (maxDim > 900) targetSizes.push(750);
  if (maxDim > 600) targetSizes.push(500);

  for (const targetMax of targetSizes) {
    try {
      const scale = Math.min(1, targetMax / maxDim);
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      // Try both normal and inverted (for dark mode screenshots)
      const code = jsQR(imgData.data, width, height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data && code.data.trim()) {
        return code.data.trim();
      }
    } catch {
      // Continue to next scale
    }
  }

  return null;
}

export function decodeQRFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const result = await decodeQRFromImageElement(img);
        resolve(result);
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

/**
 * Extracts a clean code or URL parameter from scanned QR text.
 */
export function extractCodeFromQR(raw: string): string {
  const trimmed = raw.trim();

  // Try JSON
  try {
    const parsed = JSON.parse(trimmed);
    const code = parsed?.inviteCode || parsed?.familyCode || parsed?.code;
    if (code) return String(code).trim().toUpperCase();
  } catch {}

  // Try URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('nhipnha://')) {
    try {
      const url = new URL(trimmed);
      const code =
        url.searchParams.get('code') ||
        url.searchParams.get('invite') ||
        url.searchParams.get('inviteCode') ||
        url.searchParams.get('qr');
      if (code) return code.trim().toUpperCase();
      const lastSeg = url.pathname.split('/').filter(Boolean).pop();
      if (lastSeg && (lastSeg.includes('-') || lastSeg.length >= 6)) return lastSeg.trim().toUpperCase();
    } catch {}
  }

  return trimmed;
}
