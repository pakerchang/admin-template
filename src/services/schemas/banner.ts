import { z } from "zod";

import { activeStatusEnums, imageResponseSchema } from "@/shared/api/schema";

export const bannerSchema = z.object({
  banner_id: z.string(),
  title: z.string(),
  desktop_image_url: imageResponseSchema,
  mobile_image_url: imageResponseSchema,
  redirect_url: z.url(),
  sort_order: z.number(),
  banner_status: activeStatusEnums,
  created_at: z.iso.datetime().optional(),
  updated_at: z.iso.datetime().optional(),
});

export type TBanner = z.infer<typeof bannerSchema>;
