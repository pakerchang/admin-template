import { iso, placeholderImage } from "@/shared/api/mock-db";

import type { Banner } from "../api/model";

export const banners = [
  "Summer Sale",
  "New Arrivals",
  "Free Shipping",
  "Gift Season",
  "Tea Festival",
  "Member Day",
].map((title, i) => ({
  banner_id: `banner-${i + 1}`,
  title,
  desktop_image_url: {
    file_name: `banner-${i + 1}-desktop.svg`,
    file_url: placeholderImage(title, "#0ea5e9"),
  },
  mobile_image_url: {
    file_name: `banner-${i + 1}-mobile.svg`,
    file_url: placeholderImage(title, "#14b8a6"),
  },
  redirect_url: `https://example.com/campaign/${i + 1}`,
  sort_order: i < 3 ? i + 1 : 0,
  banner_status: i < 3 ? "active" : "inactive",
  created_at: iso(60 - i * 3),
  updated_at: iso(5),
})) satisfies Banner[];
