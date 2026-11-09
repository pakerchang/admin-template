// module 公開面：kernel / 其他 module 只能 import 這支
import type { AppModule } from "../../../src/permissions";
import type { Banner } from "./model";
import { getCreateBannerMockHandler, getListBannersMockHandler } from "./mocks/banners.msw";

export { createBanner, listBanners } from "./api/banners";
export type { Banner, CreateBannerBody } from "./model";

export const bannerDb: Banner[] = []; // ponytail: 代表日後的 mock-db
export const bannersModule: AppModule = {
  id: "banners",
  mockHandlers: [
    getListBannersMockHandler(() => ({ code: 200, msg: "success", error: "", data: bannerDb, total: bannerDb.length })),
    getCreateBannerMockHandler(async ({ request }) => {
      bannerDb.unshift({ ...(await request.json()), banner_id: `banner-${bannerDb.length + 1}` });
      return { message: "created" };
    }),
  ],
};
