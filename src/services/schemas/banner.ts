import { z } from "zod";

import {
  activeStatusEnums,
  imageResponseSchema,
} from "@/services/types/schema";

export const bannerSchema = z.object({
  banner_id: z.string(),
  title: z.string(),
  desktop_image_url: imageResponseSchema,
  mobile_image_url: imageResponseSchema,
  redirect_url: z.string().url(),
  sort_order: z.number(),
  banner_status: activeStatusEnums,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type TBanner = z.infer<typeof bannerSchema>;
