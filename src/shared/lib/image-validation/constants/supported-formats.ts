/**
 * 支援的圖片類型和副檔名定義
 *
 * 這是整個圖片驗證系統的格式定義來源
 * 所有需要格式資訊的地方都應該從這裡 import
 */

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * 獲取支援的圖片格式
 * @returns 包含支援的 MIME 類型和副檔名的物件
 */
export function getSupportedImageFormats() {
  return {
    types: [...SUPPORTED_IMAGE_TYPES],
    extensions: [...SUPPORTED_IMAGE_EXTENSIONS],
  };
}
