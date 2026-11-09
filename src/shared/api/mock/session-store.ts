/**
 * mock 後端的 session 表（domain-free）：login 簽發 token、guard / handler 由 Authorization 反查 user_id 與角色。
 * 三方各管一段（R5：module 不讀他 module 的 collection）：
 * - 帳號擁有者（users module mocks）以 `setMockRoleResolver` 提供 user_id → 目前角色（角色被改後下一個 request 即生效）
 * - kernel（app/mock）以 `setMockGrantMatrix` 提供角色 → grants 矩陣（core + 已安裝 module 的 mockGrants）
 * - auth module 的 login handler 以 `issueMockToken` 簽發、`mockGrantsOfRole` 展開 grants
 */
import type { TGrant, TGrantMatrix } from "@/shared/permission";

/**
 * 已簽發 session 表（token → user_id）。存 localStorage（與 client session `auth` 同一 storage），
 * 重新整理後 MSW 重啟仍認得同一 token；storage 不可用或內容不是 JSON 時退回本 runtime 的記憶體表。
 * ponytail: 沒有 logout operation 所以不撤銷；能寫 localStorage 的同源 script 本來就讀得到 `auth` 的 token，格式驗證是這裡能做的上限
 */
const SESSIONS_KEY = "mock-sessions";
const TOKEN_RE = /^[0-9a-f]{32}$/;
let memorySessions = new Map<string, string>();

// ponytail: 模組層級狀態（最後一次 build() 的矩陣、users module 註冊的查詢）；M7b 換 orval handler 時一併檢討
let grantMatrix: TGrantMatrix = {};
let roleOfUser: (userId: string) => string | undefined = () => undefined;

/** 讀回時逐條驗格式（32 位小寫 hex → string user_id），壞條目丟棄 */
const readSessions = (): Map<string, string> => {
  let raw: unknown;
  try {
    raw = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "{}");
  } catch {
    return memorySessions;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return new Map();
  return new Map(
    Object.entries(raw).filter(
      (entry): entry is [string, string] =>
        TOKEN_RE.test(entry[0]) && typeof entry[1] === "string"
    )
  );
};

/** login 簽發不可預測的 token（128 bit；getRandomValues 在非 secure context 也可用）；session 表唯一寫入點 */
export const issueMockToken = (userId: string) => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  );
  memorySessions = new Map(readSessions()).set(token, userId);
  try {
    localStorage.setItem(
      SESSIONS_KEY,
      JSON.stringify(Object.fromEntries(memorySessions))
    );
  } catch {
    // storage 不可用：只留在記憶體
  }
  return token;
};

/** 唯一的 token → user_id 入口：只認 `Bearer <已簽發 token>`，其餘一律 undefined（R25） */
export const mockUserIdOf = (authorization?: string | null) => {
  const token = /^Bearer (\S+)$/.exec(authorization ?? "")?.[1];
  return (token && readSessions().get(token)) || undefined;
};

export const setMockRoleResolver = (fn: typeof roleOfUser) => {
  roleOfUser = fn;
};

/** Authorization → 該 user 目前的角色；無 token / 查無 session / 帳號不存在 → undefined */
export const mockRoleOf = (authorization?: string | null) => {
  const userId = mockUserIdOf(authorization);
  return userId ? roleOfUser(userId) : undefined;
};

export const setMockGrantMatrix = (matrix: TGrantMatrix) => {
  grantMatrix = matrix;
};

export const mockGrantsOfRole = (role?: string): readonly TGrant[] =>
  (role && grantMatrix[role]) || [];
