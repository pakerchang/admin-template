import { createElement } from "react";

import { defineModule } from "@/shared/module";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { demoAccountsFor } from "./mocks/demo-accounts";
import { authMockHandlers } from "./mocks/handlers";
import { authRoutes } from "./model/routes";
import LoginPage from "./ui/LoginPage";

// mock 模式才有展示帳號快選；ui 不能讀 mocks / app，由這裡注入（login-demo-accounts spec D2、D3）
const demoAccounts = demoAccountsFor(import.meta.env.VITE_API_MOCK);
const LoginWithDemoAccounts = () => createElement(LoginPage, { demoAccounts });

declare module "@/shared/i18n/types" {
  interface TranslationResources {
    auth: typeof zh;
  }
}

declare module "@/shared/module" {
  interface TModuleIdRegistry {
    auth: true;
  }
}

export default defineModule({
  id: "auth",
  kind: "generic",
  i18n: { en, zh },
  // login 查 users 的帳號（經其 index.ts）
  requires: ["users"],
  mockHandlers: authMockHandlers,
  publicRoutes: (ctx) => authRoutes(ctx, { login: LoginWithDemoAccounts }),
});
