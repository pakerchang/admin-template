import type { ImageMetadata } from "../types";

/**
 * 從檔案讀取圖片元數據
 */
export async function getImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const metadata: ImageMetadata = {
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
      };
      URL.revokeObjectURL(objectUrl);
      resolve(metadata);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("無法讀取圖片資訊"));
    };

    img.src = objectUrl;
  });
}

/**
 * 計算圖片寬高比
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * 檢查寬高比是否在容許範圍內
 */
export function isAspectRatioInRange(
  actualRatio: number,
  targetRatio: number,
  tolerance: number = 0.05
): boolean {
  return Math.abs(actualRatio - targetRatio) <= targetRatio * tolerance;
}

/**
 * 格式化檔案大小顯示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
