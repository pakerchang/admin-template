import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { nullOnApiError } from "@/shared/api/fetcher";

import { login } from "../api/auth";

import type { TAuthSession } from "@/shared/api/session";

/** 登入 mutation：帳密錯誤（非 2xx）→ 以 `auth.error` 訊息失敗 */
export const useLogin = (onSuccess: (session: TAuthSession) => void) => {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const session = await login(credentials).catch(nullOnApiError);
      if (!session) throw new Error(t("auth.error"));
      return session as TAuthSession; // domain 型別（R18）
    },
    onSuccess,
  });
};
