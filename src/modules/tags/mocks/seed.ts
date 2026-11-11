import type { Tag } from "../api/model";

export const tags = [
  "Best Seller",
  "New",
  "Organic",
  "Limited",
  "Gift",
  "Seasonal",
  "Imported",
  "Sale",
].map((tag_name, i) => ({ tag_id: `tag-${i + 1}`, tag_name })) satisfies Tag[];
