import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { setAuth } from "@/shared/api/session";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { useLogin } from "../model/use-login";

import type { TLeafKey } from "@/shared/i18n/types";
import type { MouseEvent, SubmitEvent } from "react";

type TDemoAccount = { email: string; password: string; role: string };

/** 帶入帳密、不送出（login-demo-accounts spec D4） */
const fillForm =
  ({ email, password }: TDemoAccount) =>
  (event: MouseEvent<HTMLButtonElement>) => {
    const fields = event.currentTarget.form!.elements;
    (fields.namedItem("email") as HTMLInputElement).value = email;
    (fields.namedItem("password") as HTMLInputElement).value = password;
  };

/**
 * 登入表單（auth module 預設頁）；全螢幕外框由 shell 的 AuthLayout 提供。
 * `demoAccounts` 由 index.ts 注入（只在 mock 模式非空，spec D2）。
 */
const LoginPage = ({
  demoAccounts = [],
}: {
  demoAccounts?: TDemoAccount[];
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const login = useLogin((session) => {
    setAuth(session);
    navigate({ to: "/" });
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    login.mutate({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-background p-8 shadow-[0_0_10px_2px_rgba(168,85,247,0.8)] transition duration-300 hover:shadow-[0_0_20px_4px_rgba(192,132,252,1)]"
    >
      <h1 className="text-2xl font-semibold">{t("auth.title")}</h1>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue="admin@example.com"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue="admin123"
          required
        />
      </div>
      {login.error && (
        <p role="alert" className="text-sm text-destructive">
          {login.error.message}
        </p>
      )}
      <Button type="submit" disabled={login.isPending}>
        {t("auth.submit")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("auth.hint")}</p>
      {demoAccounts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("auth.demo.title")}</p>
          {demoAccounts.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              className="h-auto flex-col items-start whitespace-normal text-left"
              onClick={fillForm(account)}
            >
              <span className="font-medium">
                {t(`auth.demo.roles.${account.role}` as TLeafKey)} ·{" "}
                {account.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(`auth.demo.descriptions.${account.role}` as TLeafKey)}
              </span>
            </Button>
          ))}
        </div>
      )}
    </form>
  );
};

export default LoginPage;
