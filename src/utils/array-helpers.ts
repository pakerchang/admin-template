/**
 * 陣列操作工具函數
 * 使用函數式編程方式處理常見的陣列操作
 */

/**
 * 安全地新增項目到陣列，避免重複
 */
export const safeAppend = <T>(item: T, array: T[]): T[] => {
  return array.includes(item) ? array : [...array, item];
};

/**
 * 從陣列中移除指定項目
 */
export const removeItem = <T>(item: T, array: T[]): T[] => {
  return array.filter((element) => element !== item);
};

/**
 * 檢查陣列是否包含指定項目
 */
export const contains = <T>(item: T, array: T[]): boolean => {
  return array.includes(item);
};

/**
 * 確保值是陣列，如果不是則返回空陣列
 */
export const ensureArray = <T>(value: T[] | undefined | null): T[] => {
  return Array.isArray(value) ? value : [];
};

/**
 * 比較兩個陣列是否相等（順序無關）
 */
export const arraysEqual = <T>(arr1: T[], arr2: T[]): boolean => {
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((item, index) => item === sorted2[index]);
};
