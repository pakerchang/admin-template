import { http, HttpResponse } from "msw";

import { bodyOf, message } from "@/shared/api/mock-db";

/** R29：kernel 自有 operation（保留 tag `core`，orval 跳過）——通用上傳，product / banners / articles 表單共用 */
export const coreMockHandlers = (baseUrl: string) => {
  const url = new URL("/admin/images", baseUrl).href;
  return [
    // ponytail: 上傳的 base64 直接當 file_url 回傳，不存檔
    http.post(url, async ({ request }) => {
      const body = await bodyOf(request);
      return HttpResponse.json({
        file_name: body.file_name,
        file_url: body.file_value,
      });
    }),
    http.delete(url, () => HttpResponse.json(message("deleted"))),
  ];
};
