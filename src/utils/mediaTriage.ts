/**
 * Honest media triage for the coach photo/video upload — 3 explicit states:
 *  1) 'precise'      → media decoded and looks like gameplay (detail-rich, wide)
 *  2) 'unrecognized' → media could not be decoded / too little signal
 *  3) 'irrelevant'   → media has almost no visual detail (uniform / blank frame)
 *
 * Real client-side pixel sampling (no external AI APIs): brightness histogram
 * variance, colorfulness and edge energy on a 64×36 thumbnail grid.
 */

export type MediaTriageState = 'precise' | 'unrecognized' | 'irrelevant';

export interface MediaTriage {
  state: MediaTriageState;
  reasonFa: string;
  reasonEn: string;
}

const TARGET_W = 64;
const TARGET_H = 36;

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode-failed'));
    img.src = dataUrl;
  });
}

export async function triageImageMedia(dataUrl: string): Promise<MediaTriage> {
  try {
    const img = await loadImage(dataUrl);
    const w = img.naturalWidth || 0;
    const h = img.naturalHeight || 0;
    if (w < 160 || h < 90) {
      return {
        state: 'unrecognized',
        reasonFa: '🤔 کیفیت این تصویر خیلی کمه — لطفاً با کیفیت بالاتر دوباره بفرست',
        reasonEn: 'Image resolution too low — please resend in higher quality',
      };
    }
    const canvas = document.createElement('canvas');
    canvas.width = TARGET_W;
    canvas.height = TARGET_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { state: 'unrecognized', reasonFa: '🤔 تشخیص ممکن نبود — لطفاً دوباره بفرست', reasonEn: 'Could not analyze — please resend' };
    }
    ctx.drawImage(img, 0, 0, TARGET_W, TARGET_H);
    const { data } = ctx.getImageData(0, 0, TARGET_W, TARGET_H);
    const n = data.length / 4;
    let sumLum = 0;
    let sumLum2 = 0;
    let colorfulness = 0;
    let edgeEnergy = 0;
    for (let i = 0; i < n; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sumLum += lum;
      sumLum2 += lum * lum;
      colorfulness += Math.abs(r - g) + Math.abs(g - b);
    }
    // horizontal edge energy (game frames have strong UI/HUD/scene edges)
    for (let y = 0; y < TARGET_H; y++) {
      for (let x = 1; x < TARGET_W; x++) {
        const i = (y * TARGET_W + x) * 4;
        const j = (y * TARGET_W + x - 1) * 4;
        edgeEnergy += Math.abs(data[i] - data[j]) + Math.abs(data[i + 1] - data[j + 1]) + Math.abs(data[i + 2] - data[j + 2]);
      }
    }
    const meanLum = sumLum / n;
    const variance = sumLum2 / n - meanLum * meanLum;
    const stdDev = Math.sqrt(Math.max(0, variance));
    const colorScore = colorfulness / n;
    const edgeScore = edgeEnergy / (TARGET_H * (TARGET_W - 1));

    // irrelevant: near-uniform frame (screenshot of text page, solid color, blank)
    if (stdDev < 14 && edgeScore < 6) {
      return {
        state: 'irrelevant',
        reasonFa: '🚫 این تصویر مرتبط با صحنه بازی نیست (تقریباً یکدسته/متنه) — یه عکس یا ویدیو از خود گیم‌پلی بفرست',
        reasonEn: 'This image does not look like gameplay (too uniform) — send gameplay media instead',
      };
    }
    // gameplay-like: rich detail + strong edges + landscape orientation
    const landscape = w >= h;
    if (landscape && stdDev >= 22 && edgeScore >= 10) {
      return {
        state: 'precise',
        reasonFa: '🎬 رسانه گیم‌پلی دریافت شد — تحلیل دقیق انجام می‌شه',
        reasonEn: 'Gameplay media received — running detailed analysis',
      };
    }
    return {
      state: 'unrecognized',
      reasonFa: '🤔 نتونستم تشخیص بدم این یه صحنه بازیه — لطفاً یه اسکرین‌شات یا ویدیوی گیم‌پلی واضح بفرست',
      reasonEn: 'Not recognizable as a gameplay scene — please send a clear screenshot or clip',
    };
  } catch {
    return {
      state: 'unrecognized',
      reasonFa: '🤔 این فایل قابل خواندن نبود — لطفاً دوباره عکس یا ویدیو بفرست',
      reasonEn: 'File could not be read — please resend the photo or video',
    };
  }
}

/** Videos: decode the first frame at 1s into the same pixel triage. */
export async function triageVideoMedia(dataUrl: string): Promise<MediaTriage> {
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('video-decode-failed'));
      video.src = dataUrl;
    });
    // seek ~1s in (or 25% if shorter)
    const t = Math.min(1, (video.duration || 2) * 0.25);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = t;
    });
    const canvas = document.createElement('canvas');
    canvas.width = TARGET_W;
    canvas.height = TARGET_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { state: 'unrecognized', reasonFa: '🤔 ویدیو قابل تحلیل نبود — دوباره بفرست', reasonEn: 'Video could not be analyzed — resend' };
    }
    ctx.drawImage(video, 0, 0, TARGET_W, TARGET_H);
    const frame = canvas.toDataURL('image/png');
    return triageImageMedia(frame);
  } catch {
    return {
      state: 'unrecognized',
      reasonFa: '🤔 این ویدیو قابل خواندن نبود — لطفاً دوباره بفرست',
      reasonEn: 'Video could not be read — please resend',
    };
  }
}
