import { cn } from "@/shared/lib/utils";

export type TTagTone = "warning" | "info" | "accent" | "danger" | "success";

const TONE_CLASSES: Record<TTagTone, string> = {
  warning: "border-orange-500 bg-orange-300 text-orange-900",
  info: "border-blue-500 bg-blue-300 text-blue-900",
  accent: "border-purple-500 bg-purple-300 text-purple-900",
  danger: "border-red-500 bg-red-300 text-red-900",
  success: "border-green-500 bg-green-300 text-green-900",
};

interface ITagProps {
  className?: string;
  tone?: TTagTone;
  tagContent: string;
}

/** 通用標籤；顏色由 tone 決定，domain 狀態 → tone 的對應由各 module 自己做 */
export const Tag = ({ className, tone, tagContent }: ITagProps) => (
  <div
    className={cn(
      "size-fit rounded-md border px-2 py-1 text-sm",
      tone && TONE_CLASSES[tone],
      className
    )}
  >
    {tagContent}
  </div>
);
