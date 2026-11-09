/** mock 預設開；只有 `VITE_API_MOCK=false` 才關（改打 `VITE_API_BASE_URL` 的真後端） */
export const isMockEnabled = (flag: string | undefined) => flag !== "false";
