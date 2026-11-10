import { DEMO_ACCOUNT } from "./seed";

/** 登入頁角色快選（login-demo-accounts spec D1）；email / role 與 users seed 的一致性由測試保證（不讀 users seed，R5） */
export const DEMO_ACCOUNTS = (
  [
    ["admin@example.com", "superadmin"],
    ["bob@example.com", "admin"],
    ["carol@example.com", "support"],
    ["david@example.com", "partner"],
    ["eve@example.com", "premium"],
  ] as const
).map(([email, role]) => ({ email, role, password: DEMO_ACCOUNT.password }));

/** 語意同 app/mock/enabled.ts 的 isMockEnabled（module 不能 import app，D3；等價由測試保證） */
export const demoAccountsFor = (flag: string | undefined) =>
  flag !== "false" ? DEMO_ACCOUNTS : [];
