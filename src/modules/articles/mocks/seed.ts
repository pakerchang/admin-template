import { iso, placeholderImage } from "@/shared/api/mock-db";

import type { TArticle } from "@/services/schemas/article";

/** R5：作者（staff_id / 名字）與標籤名稱是自帶快照，與 team-members / tags seed 的值一致 */
const AUTHORS = ["Alice", "Bob", "Carol", "David", "Eve"];
const TAG_NAMES = ["Best Seller", "New", "Organic", "Limited", "Gift"];

export const articles: TArticle[] = [
  "How to Brew the Perfect Oolong",
  "A Short History of Taiwanese Tea",
  "Pairing Tea with Desserts",
  "Storing Tea at Home",
  "Our Visit to Alishan",
].map((title, i) => ({
  article_id: `article-${i + 1}`,
  user_id: `staff-${(i % AUTHORS.length) + 1}`,
  nick_name: AUTHORS[i % AUTHORS.length],
  title,
  tags: [TAG_NAMES[i % TAG_NAMES.length]],
  describe: `${title} — a quick read.`,
  image_url: {
    file_name: `article-${i + 1}.svg`,
    file_url: placeholderImage(
      title.split(" ").slice(0, 3).join(" "),
      "#f59e0b"
    ),
  },
  content_html: `<h2>${title}</h2><p>This is a demo article used for the UI showcase.</p>`,
  created_at: iso(40 - i * 4),
  updated_at: iso(8 - i),
}));
