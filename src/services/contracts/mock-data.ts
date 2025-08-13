import { generateMock } from "@anatine/zod-mock";
import { z } from "zod";

import { bannerSchema } from "@/services/contracts/banner";
import { baseOrderSchema, orderItemSchema } from "@/services/contracts/orders";
import { productSchema } from "@/services/contracts/product";
import { userSchema } from "@/services/contracts/user";

const transDataPattern = <S extends z.ZodTypeAny>(data: S, count = 1) => {
  return z.array(data).length(count);
};

export const generateProductData = () =>
  generateMock(transDataPattern(productSchema, 20));

export const generateUserData = generateMock(transDataPattern(userSchema, 10));

export const generateOrderData = () =>
  generateMock(transDataPattern(baseOrderSchema, 10));
export const generateOrderItemData = generateMock(
  transDataPattern(orderItemSchema, 5)
);

export const generateBannerData = async () => {
  const generateBannerMockData = () => {
    const activeBanners = generateMock(transDataPattern(bannerSchema, 3)).map(
      (banner) => ({
        ...banner,
        banner_status: "active" as const,
      })
    );

    const inactiveBanners = generateMock(
      transDataPattern(bannerSchema, 12)
    ).map((banner) => ({
      ...banner,
      banner_status: "inactive" as const,
    }));

    return [...activeBanners, ...inactiveBanners];
  };

  return generateBannerMockData();
};
