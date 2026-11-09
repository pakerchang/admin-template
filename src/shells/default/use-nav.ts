import { useRouter } from "@tanstack/react-router";

import type { TNavItem } from "@/shared/module";

/** kernel 以 router context 帶入已排序的 nav（app/kernel/create-app）；M4 換成 shared/module 的 useVisibleNav() */
export const useNav = (): readonly TNavItem[] =>
  (useRouter().options.context as { nav?: TNavItem[] } | undefined)?.nav ?? [];
