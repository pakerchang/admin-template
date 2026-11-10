import type { TTag } from "../model/schema";

export const tags: TTag[] = [
  "Best Seller",
  "New",
  "Organic",
  "Limited",
  "Gift",
  "Seasonal",
  "Imported",
  "Sale",
].map((tag_name, i) => ({ tag_id: `tag-${i + 1}`, tag_name }));
