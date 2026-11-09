import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, setAuth } from "@/services/api-client";

import type { TAuthSession } from "@/services/api-client";
import type { SubmitEvent } from "react";

/** 登入表單（auth module 預設頁）；全螢幕外框由 shell 的 AuthLayout 提供 */
const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiFetch<TAuthSession>("/api/auth/login", {
        method: "POST",
        body: credentials,
      });
      if (response.status !== 200) {
        throw new Error(t("login.error"));
      }
      return response.body;
    },
    onSuccess: (session) => {
      setAuth(session);
      navigate({ to: "/" });
    },
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
      <h1 className="text-2xl font-semibold">{t("login.title")}</h1>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("login.email")}</Label>
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
        <Label htmlFor="password">{t("login.password")}</Label>
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
        {t("login.submit")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("login.hint")}</p>
    </form>
  );
};

export default LoginPage;
