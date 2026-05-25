export const COVER_LOGO_FILE = 'ezias-training-logo.png';
export const WATERMARK_LOGO_FILE = 'ezias-monogram.jpg';

const BRANDING_PATHS = {
    cover: `/branding/${COVER_LOGO_FILE}`,
    watermark: `/branding/${WATERMARK_LOGO_FILE}`,
} as const;

export type PdfBrandingImages = {
    cover: string;
    coverAspect: number;
    watermark: string;
};

let watermarkCache: string | null = null;

async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

export function getImageDimensionsFromDataUrl(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Não foi possível ler as dimensões da imagem.'));
        img.src = dataUrl;
    });
}

/** Reduz o peso da capa para o PDF e o preview não estourarem o limite do navegador. */
async function optimizeCoverImageForPdf(
    dataUrl: string,
    maxDimension = 1920
): Promise<{ dataUrl: string; aspect: number }> {
    const { width, height } = await getImageDimensionsFromDataUrl(dataUrl);
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas não disponível para otimizar a capa.'));
                return;
            }
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            resolve({
                dataUrl: canvas.toDataURL('image/jpeg', 0.9),
                aspect: targetWidth / targetHeight,
            });
        };
        img.onerror = () => reject(new Error('Não foi possível otimizar o logo da capa.'));
        img.src = dataUrl;
    });
}

export function getImageFormatFromDataUrl(dataUrl: string): 'JPEG' | 'PNG' {
    if (dataUrl.startsWith('data:image/png')) {
        return 'PNG';
    }
    return 'JPEG';
}

export async function loadPdfBranding(): Promise<PdfBrandingImages> {
    const coverPromise = fetch(BRANDING_PATHS.cover);

    const watermarkPromise = watermarkCache
        ? Promise.resolve(watermarkCache)
        : fetch(BRANDING_PATHS.watermark).then(async (res) => {
            if (!res.ok) {
                throw new Error('Não foi possível carregar a marca d\'água do PDF.');
            }
            const dataUrl = await blobToDataUrl(await res.blob());
            watermarkCache = dataUrl;
            return dataUrl;
        });

    const coverRes = await coverPromise;
    if (!coverRes.ok) {
        throw new Error(`Não foi possível carregar o logo da capa (${COVER_LOGO_FILE}).`);
    }

    const coverRaw = await blobToDataUrl(await coverRes.blob());
    const [watermark, coverOptimized] = await Promise.all([
        watermarkPromise,
        optimizeCoverImageForPdf(coverRaw),
    ]);

    return {
        cover: coverOptimized.dataUrl,
        coverAspect: coverOptimized.aspect,
        watermark,
    };
}
