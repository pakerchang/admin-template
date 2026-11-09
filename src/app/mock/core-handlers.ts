import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { message } from "@/shared/api/mock-db";

/** R29：kernel 自有 operation（保留 tag `core`）——通用上傳，product / banners / articles 表單共用 */
export const coreMockHandlers = (baseUrl: string) =>
  toHttpHandlers(
    {
      // ponytail: 上傳的 base64 直接當 file_url 回傳，不存檔
      "POST /admin/images": ({ body }) => ({
        body: { file_name: body.file_name, file_url: body.file_value },
      }),
      "DELETE /admin/images": () => message("deleted"),
    },
    { baseUrl }
  );
