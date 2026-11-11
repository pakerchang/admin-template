# 型別契約 T2：module 契約 Spec

狀態：**OD-T2-1～4 已裁決**（OD-T2-1 = A、OD-T2-2 = B、OD-T2-3 = A、OD-T2-4 = A；main 代裁 2026-11-11，owner 可覆核），可進實作棒。實作棒的前置條件：I1（`feat/i18n-scope-migration`）已 merge 進 master，T2 從合併後的 master 開 branch（OD-T2-1）。

- 需求來源：`docs/specs/typed-contracts-zod.spec.md`（下稱「T1 spec」）「後續棒次」的 T2 與 §3「設計原則」落點表。T2 **只含三項**：module id registry（`id`／`requires`）、`staticData.routeId` 收窄、nav `to` path registry。
- **不含 nav label**：nav label 的型別、執行期驗證與 shell 強轉移除，已由 i18n 頂層控管模型取代，整條歸 I1（`docs/specs/i18n-scope-migration.spec.md` 補裁 2～4，#26）。本 spec 不碰 label。
- 上位 spec：`docs/specs/fsd-module-architecture.spec.md`（下稱「架構 spec」）§4.1、§4.3、§4.6（R4）、§0 的 R8／R19／R23。本 spec 不改 §0 鎖定決策。
- 基準：master `67a8aee`（已含 T1 #25、i18n spec #26）；I1 實作 worktree 的未 commit 變更只讀參照，用來設計介面銜接（§3）。
- 型別設計依據：架構調查報告（session scratchpad `module-typing-arch-report.md`，不進 repo）的案 2（declaration merging registry）、案 5（Id 泛型 + registry），以及 §4.5 的坑。PoC 都是靜態驗證（`tsc --noEmit` exit code），而且做在補裁 2 之前的 `defineModule` 形狀上；疊到 I1 新形狀的寫法**沒有 PoC**，由實作棒先驗（§3.2）。

## 1. 現況盤點（master `67a8aee`）

| # | 契約點 | 現況型別 | 寫錯時 | 數量 |
|---|---|---|---|---|
| 1 | `TModule.id`（`src/shared/module/types.ts:75`） | `string` | 重複 → `build()` throw（`build.ts` `assertUniqueIds`）；拼錯只會讓依賴它的 `requires` 在執行期 throw | 10 個 module |
| 2 | `TModule.requires`（`types.ts:79`） | `readonly string[]` | 缺依賴、typo、循環 → `build()` throw（`assertRequires`），`tsc` 不擋；requires 自己 → 執行期循環錯誤 | 2 個 module、3 筆（`auth → users`、`product → suppliers, tags`） |
| 3 | `staticData.routeId`（`types.ts:18`） | `string`（註解：`TRouteId` 無 augment 時為 `never`） | 寫入端 `ctx.page({ routeId })` 已是 `TRouteId`（編譯期）；**讀取端**無型別（`permission-structure.test.ts:52`、`override.integration.test.tsx:127`、`build.test.ts:97`） | 10 個 `routes.ts` augment `TRouteIdRegistry`，共 19 個 route id（15 行字面值 + product 以 `` `product.${name}` `` 產生 4 個） |
| 3a | route id 前綴（R23） | `TPageRouteOpts.routeId: TRouteId`，**不知道自己屬於哪個 module** | 寫成別的 module 的 id（`orders` 的 routes 寫 `"product.list"`）→ `tsc` 過，`build()` `pageFor` throw | 同上 |
| 4 | `TNavItem.to`（`types.ts:27`） | `string` | **靜默**：點了到 not-found；`index-redirect.ts:32` `redirect({ to: first.to })` 同樣靜默 | 8 個 module、9 筆字面值（orders 有 children） |
| 4a | `TRouteTitle.to`（I1 新增，補裁 4） | I1 WIP 為 `string` | 同 4 | I1 落地後 1 筆（users `/users`） |

route 定義分布：10 個 module 都有 `model/routes.ts`；9 個用 `routes(ctx: TRouteContext)`，auth 用 `publicRoutes(ctx: TPublicRouteContext)`。

測試 fixture（會受收窄影響的假值，量測於 `67a8aee`）：

- `src/app/kernel/__tests__/build.test.ts`：`mod(id, …)` helper 以假 id 造 module（`"a"`、`"b"`、`"x"`、`"y"`、`"test"`…），4 行 `requires`（含刻意的缺依賴、循環），9 行 `to`／`routeId` 字面值（`"/c"`、`"/a"` 等不存在的路徑）
- `src/shared/module/__tests__/use-visible-nav.test.tsx`：6 行 nav fixture（`to` 為假路徑）
- `src/modules/tags/__tests__/permission-types.test.ts`：2 行；`src/modules/users/ui/__tests__/user-form.test.tsx`：1 行

## 2. 設計

### 2.1 module id registry（OD-TYPE-2 B 同手法）

- `src/shared/module/types.ts` 宣告空介面 `export interface TModuleIdRegistry {}`（`// eslint-disable-next-line @typescript-eslint/no-empty-object-type`，同 `TRouteIdRegistry`），`export type TModuleId = Extract<keyof TModuleIdRegistry, string>`。**不帶 index signature**（理由同 I1 步驟 1：index signature 會讓 `keyof` 撐成 `string`）。
- 每個 module 在自己的 `index.ts` augment（與 T1 的 `TPermissionRegistry` augment 放同一處）：`declare module "@/shared/module" { interface TModuleIdRegistry { orders: true } }`。
- 寬型別 `TModule`：`id: TModuleId`、`requires?: readonly TModuleId[]`。
- `defineModule` 的單一 module 視角：`requires` 只能是**其他**已註冊 id（`Exclude<TModuleId, 自己的 id>`）。
- core-only：拔掉 domain 後，`TModuleId` 只剩 generic module（auth、users、team-members），不是 `never`；generic module 若 `requires` domain，`tsc` 直接擋（D4 違規前移到編譯期，報告 p2 實測）。
- 擋不到的部分照 T1 原則交給執行期：兩個檔案宣告同一個 id（interface merge 允許相同屬性）、檔案在 program 內卻沒 `.use()` → `assertUniqueIds`、`assertRequires` 保留。

### 2.2 `staticData.routeId` 收窄與 route id 前綴（OD-T2-2）

- `StaticDataRouteOption.routeId?: TRouteId`（取代 `string`）。`TRouteId` 在完整安裝與 core-only 都不是 `never`（generic module 都 augment 了 `TRouteIdRegistry`），原註解的前提已不成立。
- （OD-T2-2 已裁決 B）`TRouteContext<Id>`／`TPublicRouteContext<Id>`：`page` 的 `routeId` 收窄為 `` Extract<TRouteId, `${Id}.${string}`> ``，R23 前綴在 `tsc` 就擋。各 `routes.ts` 的 factory 參數改成 `TRouteContext<"orders">` 這類具體 Id；若仍寫寬型別 `TRouteContext`，把窄 ctx 傳給它時 `tsc` 失敗（函式參數逆變），所以不會悄悄退回寬型別。
- `build()` 的 `pageFor` R23 檢查、重複檢查保留（第二道防線）。

### 2.3 nav `to` path registry（OD-T2-3、OD-T2-4）

- `src/shared/module/types.ts` 宣告 `export interface TRoutePathRegistry { "/": true }`，core 自帶 `"/"`（protected index，`index-redirect.ts`），同 T1 core 自帶 `app:access`，避免 registry 變成 `never`。`export type TRoutePath = Extract<keyof TRoutePathRegistry, string>`。
- 每個 module 在 `model/routes.ts`（與 `TRouteIdRegistry` augment 同一個 `declare module` 區塊）登錄自己建立的**靜態**完整路徑（不含 `$param`），例 orders：`"/orders"`、`"/orders/order-list"`。路徑一律無結尾斜線。
- 收窄：`TNavItem.to`（含 `children`）與 I1 新增的 `TRouteTitle.to` 都改為 `TRoutePath`。I1 的 `TRegistryNavItem`／`TResolvedNavItem` 共用同一個 base，`to` 會跟著收窄；shell 的 `handleNavigate(to: string)` 吃得下，不必改。
- R4 本體不動：`router/index.ts` 的 `Register`、route 樹型別寬化、module 內以 route 物件導航（架構 spec §4.6、TRAPS「module route 的 `navigate({ to })` 失去型別檢查」）都維持原狀。T1 spec §3 已記錄 owner 只收回「跨 module 導航字串無型別」這一塊。
- 執行期第二道防線：registry 是手寫的，可能與實際 route 不一致。`build()` 在建完 route tree 後，收集每個 route 的完整路徑（依 parent 鏈串接 `options.path`，pathless 的 `id` route 不貢獻路徑段，結尾 `/` 正規化去掉；根為 `"/"`），nav（含 `children`）與 `routeTitles` 的每個 `to` 都必須等於其中之一，否則 throw，訊息含 module id 與 `to`。**注意**：articles、banners、product、users 的列表頁是 layout `path: "articles"` + 子 route `path: "/"`，TanStack 的 fullPath 是 `"/articles/"`，正規化後才會等於 nav 的 `"/articles"`；不能直接拿 `route.fullPath` 比（而且 `fullPath` 要等 router 建立時才算出來，`build()` 階段可能還沒有值）。

## 3. 與 I1 的介面銜接

### 3.1 I1 會改到、T2 也要改的地方

依 I1 spec 步驟 6、Touches，以及 I1 worktree 目前的未 commit 變更（只讀）：

| 檔案 | I1 的改動 | T2 要疊上去的改動 | 衝突風險 |
|---|---|---|---|
| `src/shared/module/types.ts` | `TNavItem` 拆成 `TNavBase`／`TNavTree<TLabel>`，`TNavItem<L>`、`TRouteTitle<L>`、`TRegistryNavItem`、`TResolvedNavItem`；`TModule.routeTitles`；`defineModule = <const M extends TModule>(m: M & { nav?: TNavItem<TNavLocalKey<M>>[]; routeTitles?: … }): M` | `TNavBase.to`、`TRouteTitle.to` → `TRoutePath`；`TModule.id`／`requires`；`defineModule` 的交集再加 `id`／`requires`／`routes`／`publicRoutes` 約束；`StaticDataRouteOption.routeId`；`TRouteContext<Id>` | **高**：同一批型別定義，同一個 `defineModule` 簽章 |
| `src/modules/<id>/index.ts`（10 個） | nav `label` 改局部 key、`i18n` 欄位、users 新增 `routeTitles` | 新增 `TModuleIdRegistry` augment；`requires` 不變 | 中：相鄰 hunk |
| `src/modules/<id>/model/routes.ts`（10 個） | 無（I1 Touches 沒有列） | `TRoutePathRegistry` augment；factory 參數（OD-T2-2 = B）改 `TRouteContext<"<id>">` | 低 |
| `src/app/kernel/build.ts` | nav label 組 key 與驗證、`registry.titles`、同一 `to` 重複 → throw | nav／`routeTitles` 的 `to` 必須是實際 route 路徑 → throw | 中：同一段走訪 nav／children／routeTitles 的程式，T2 應沿用 I1 的走訪，不另寫一份 |
| `src/app/kernel/__tests__/build.test.ts` | nav fixture 的 label 改局部 key、新增 AC-3 (a)～(h) | `mod()` helper 的寬型別入口、假路徑 fixture、新 throw 案例 | 中 |
| `src/shared/module/__tests__/use-visible-nav.test.tsx` | 新增 label 介面案例 | fixture 的 `to` 改用已登錄路徑或走寬型別入口 | 中 |
| `.claude/skills/add-module/`、`docs/TRAPS.md` | label／`routeTitles`／augmentation 寫法 | id 與 path registry 的 augment 寫法 | 低 |

### 3.2 泛型約束怎麼疊在 I1 的 `defineModule` 上

I1 的寫法是「`const M` 推導整個物件，再用交集約束個別欄位」，Id 不另外當型別參數。T2 沿用同一個交集，用 `M["id"]` 當 Id：

```ts
// 示意；實際寫法由實作棒以 tsc 驗證後決定
export const defineModule = <const M extends TModule>(
  m: M & {
    nav?: TNavItem<TNavLocalKey<M>>[];                         // I1
    routeTitles?: readonly TRouteTitle<TNavLocalKey<M>>[];     // I1
    requires?: readonly Exclude<TModuleId, M["id"]>[];          // T2：不能 requires 自己
    routes?: (ctx: TRouteContext<M["id"]>) => AnyRoute[];       // T2（OD-T2-2 已裁決 B）
    publicRoutes?: (ctx: TPublicRouteContext<M["id"]>) => AnyRoute[];
  }
): M => m;
```

- `id: TModuleId` 由寬型別 `TModule` 的約束（`M extends TModule`）負責，不必再寫進交集。
- **§4.5 的坑**：若改用報告案 5 的 `TModule<Id>` 泛型寬型別（`<const Id extends TModuleId, const M extends TModule<Id>>`），`requires` 必須寫成分配式條件型別 `readonly (Id extends TModuleId ? Exclude<TModuleId, Id> : never)[]`；直接寫 `Exclude<TModuleId, Id>` 時，寬型別的 Id 是整個 union，`Exclude` 變成 `never`，`createApp().use(m: TModule)` 收不下任何有 `requires` 的 module（報告 p5 首跑實測）。上面的交集寫法把排除自己的約束只放在 `defineModule`，寬型別 `TModule` 維持 `readonly TModuleId[]`，避開這個坑；兩種寫法擇一，AC-1、AC-5 都要過。
- **未驗證**：交集裡的 `routes: (ctx) => …` 能不能從 `TRouteContext<M["id"]>` 拿到 contextual type（不必在 index.ts 手寫參數型別），以及這個 Id 會不會干擾 I1 的 `TNavLocalKey<M>` 推導，都沒有 PoC。實作棒第一步先在 scratchpad 用 I1 落地後的 `types.ts` 跑 `tsc`；如果交集寫法不行，改用案 5 的雙型別參數寫法，但 I1 的 AC-4 (2) 必須保持通過。兩種都不能用 cast 讓正例通過。**兩種寫法的 PoC 都不成立時，實作棒停下來回報（附 `tsc` 原始錯誤與 exit code），不得自行退回 OD-T2-2 A；退回 A 必須經 owner 同意**（見 OD-T2-2）。
- `const M` 的字面型別回傳保留（I1 AC-4 (2) 已鎖 `id` 字面型別）。

### 3.3 合併順序（OD-T2-1）

已裁決 **A：I1 先 merge，T2 實作棒從含 I1 的 master 開 branch**。理由：

- I1 是 82 個檔案的大棒（worktree 目前 `git diff --stat`），T2 約 25 個檔案；衝突集中在 `types.ts` 與 `defineModule` 簽章，讓小的一方 rebase 成本最低。
- T2 要收窄 I1 新增的 `TRouteTitle.to`，執行期檢查也要沿用 I1 在 `build()` 的 nav 走訪；I1 沒落地前，這兩件事沒有對象。
- T2 若先 merge，I1 必須在 82 個檔案的 branch 上重新解 `types.ts` 衝突，並重驗補裁 2 的推導（AC-4 (2)）。

## 4. Spec

### User Story

身為 admin-template 的開發者，我在 `defineModule` 填 `id`、`requires`，在 `routes.ts` 填 `routeId`，在 nav／`routeTitles` 填 `to` 時，要有 IDE 補全，而且寫錯（未註冊的 id、requires 自己或不存在的 module、別的 module 的 route id、不存在的路徑）在 `tsc`（`pnpm build`）就失敗，不是等到 `build()` throw 或靜默跳到 not-found。整個 domain module 被拔掉時，殘留的 `requires` 與導航路徑在編譯期報錯。

### Milestones

T2 一棒（OD-TYPE-4 = A 的第二棒），獨立 PR。前置：I1 已 merge，T2 從合併後的 master 開 branch（OD-T2-1 = A）。done 基線：`pnpm build && pnpm exec vitest run && pnpm verify:core-only` exit 0。

0. PoC 先行（§3.2）：在 scratchpad 用 I1 落地後的 `types.ts` 驗 `TRouteContext<M["id"]>` 的 contextual typing 與 `TNavLocalKey<M>` 推導不互相干擾。交集寫法與案 5 寫法都不成立 → 停下來回報，不得自行退回 OD-T2-2 A（退回須 owner 同意）。
1. 型別：`TModuleIdRegistry`／`TModuleId`、`TRoutePathRegistry`（core 自帶 `"/"`）／`TRoutePath`、`StaticDataRouteOption.routeId: TRouteId`、`TNavBase.to`／`TRouteTitle.to: TRoutePath`（OD-T2-4 = A）、`TModule.id`／`requires`、`defineModule` 約束（§3.2）、`TRouteContext<Id>`／`TPublicRouteContext<Id>`（OD-T2-2 = B）。
2. 10 個 module 一次切換（同 OD-TYPE-5 A）：`index.ts` augment `TModuleIdRegistry`；`model/routes.ts` augment `TRoutePathRegistry`（只登錄靜態路徑，OD-T2-3 = A）；factory 參數改具體 Id（OD-T2-2 = B）。非測試碼的 `id`／`requires`／`to`／`routeId` 字面值預期 0 處需改（實作棒以 `tsc` 確認，若有不合法字面值即為既有 bug，先回報再修）。
3. 執行期：`build()` 加 nav／`routeTitles` `to` 路徑檢查（§2.3，OD-T2-3 = A），沿用 I1 的 nav 走訪；`assertUniqueIds`、`assertRequires`、`pageFor` 的 R23 與重複檢查保留。
4. 測試 fixture：假 id／假路徑的 fixture 走寬型別入口，在注入點 cast（比照 TRAPS「測試 fixture 的非法權限字串」）；**禁止**在測試檔 augment `TModuleIdRegistry`／`TRoutePathRegistry`（declaration merging 是全域的，測試檔的假 id 會變成整個 program 都合法）。build 測試裡 nav `to` 指向不存在 route 的 fixture，因為步驟 3 會開始 throw，改成指向 fixture 自己建立的 route，或把那個案例改寫成 throw 斷言；原斷言的意圖不變。
5. 補全量測腳本：新增 `scripts/check-completions.mjs`（AC-11）。
6. 同步：`.claude/skills/add-module/`（新 module 要 augment 兩個 registry）、`docs/TRAPS.md`（測試檔不得 augment registry；`to` 結尾斜線正規化）、架構 spec §4.1 型別草案（`TModuleIdRegistry`、`TRoutePathRegistry`、`routeId: TRouteId`）、`docs/specs/refactor/README.md` T2 列。

### Acceptance Criteria

型別測試以 vitest `.test.ts` 撰寫（`expectTypeOf` + `// @ts-expect-error`，同 T1 AC 的寫法；`tsconfig.app.json` 的 `include` 為 `src/**/*`，指令沒觸發錯誤會報 TS2578，所以反例不會真空通過）。錯誤案例寫成一行放得下的形狀，避開 TRAPS「`@ts-expect-error` 被 prettier 換行後失效」。

- domain 型別測試：`src/modules/tags/__tests__/module-contract-types.test.ts`（以 tags 為代表，隨 module 刪除，core-only 不受影響）
- core-safe 型別測試：`src/modules/users/__tests__/module-contract-types.test.ts`（users 是 generic module，core-only 仍在，只引用 generic id 與 `"/"`）

- [ ] AC-1 [cmd] module id／`requires`：`src/modules/tags/__tests__/module-contract-types.test.ts` 以 `// @ts-expect-error` 鎖住下列 `defineModule` 呼叫 `tsc` 失敗：未註冊的 `id`（例 `"tag"`）；`requires` 含未註冊 id（例 `["tag"]`）；`requires` 含自己（tags 的 `requires: ["tags"]`）。正例不帶指令：`requires` 其他已註冊 id；`expectTypeOf<TModuleId>()` 等於 10 個 module id 的 union。另以 `expectTypeOf<string>().not.toMatchTypeOf<TModuleId>()` 鎖住 registry 沒被 index signature 撐寬。驗收：`pnpm exec tsc -b tsconfig.app.json` exit 0。
- [ ] AC-2 [cmd] route id：同檔鎖住 (a) `staticData.routeId` 讀取端型別：`expectTypeOf<NonNullable<StaticDataRouteOption["routeId"]>>().toEqualTypeOf<TRouteId>()`；(b)（OD-T2-2 已裁決 B）在 `TRouteContext<"tags">` 的 `ctx.page` 寫別的 module 的 route id（例 `"product.list"`）與不存在的 id（例 `"tags.lst"`）`tsc` 失敗，`"tags.list"` 通過；把 `(ctx: TRouteContext<"product">) => …` 指派給 tags 的 `routes` `tsc` 失敗。驗收同 AC-1。
- [ ] AC-3 [cmd] nav／`routeTitles` `to`：同檔鎖住 nav 頂層 `to`、`children` 的 `to`、`routeTitles` 的 `to` 寫成未登錄路徑（例 `"/tag"`）、含結尾斜線（例 `"/tags/"`）、param 模板（例 `"/orders/$id"`）都 `tsc` 失敗；`"/tags"` 與 `"/orders/order-list"` 通過；`expectTypeOf<string>().not.toMatchTypeOf<TRoutePath>()`。驗收同 AC-1。
- [ ] AC-4 [cmd] core-safe：`src/modules/users/__tests__/module-contract-types.test.ts` 以 `expectTypeOf` 斷言 `TModuleId`、`TRouteId`、`TRoutePath` 都不是 `never`，`"/"` 是 `TRoutePath` 的成員、`"users"` 是 `TModuleId` 的成員。`pnpm verify:core-only` exit 0、輸出含 `core-only build: OK`（core-only 下 domain id／路徑不在 registry、generic module 的字面值仍合法）。
- [ ] AC-5 [cmd] 寬型別不退化（§4.5 的坑）：同 AC-1 的檔案以 `defineModule` 建一個帶 `requires: ["suppliers"]` 的 tags 形狀 module，斷言它可指派給寬型別 `TModule`，且 `createApp().use()` 接受它（型別層，不必執行）；`expectTypeOf(<該 module>.id).toEqualTypeOf<"…">()` 字面型別保留。`src/app/modules.ts` 不加任何 cast 仍通過 `tsc`。驗收同 AC-1。
- [ ] AC-6 [cmd] 執行期路徑檢查（第二道防線）：`src/app/kernel/__tests__/build.test.ts` 新增案例：(a) nav 頂層 `to` 不是任何已建 route 的路徑 → throw，訊息含 module id 與 `to`；(b) `children` 的 `to` 同上；(c) `routeTitles` 的 `to` 同上；(d) layout `path: "x"` + 子 route `path: "/"` 時，nav `to: "/x"` 不 throw（結尾斜線正規化）；(e) `to` 指到另一個已安裝 module 的路徑不 throw（跨 module 導航是 nav 的用途）；(f) `to: "/"` 不 throw。fixture 走 `mod()` 的寬型別入口（假 id／假路徑在注入點 cast）。`pnpm exec vitest run src/app/kernel/__tests__/build.test.ts` exit 0。
- [ ] AC-7 [cmd] 既有執行期檢查保留：`build.test.ts` 既有的重複 module id、缺依賴、循環依賴、缺 routeId、重複 routeId、R23 前綴錯誤案例原斷言照過；`src/app/__tests__/app-wiring.test.tsx` 的 routeId 集合斷言照過（完整安裝 10 個 module 經 `build()` 不 throw，即 9 筆 nav `to` 與 users 的 `routeTitles` 都通過 AC-6 的檢查）。`pnpm exec vitest run src/app/kernel/__tests__/build.test.ts src/app/__tests__/app-wiring.test.tsx` exit 0。
- [ ] AC-8 [cmd] 不靠 cast、registry 不在測試檔 augment：`git grep -nE "interface (TModuleIdRegistry|TRoutePathRegistry)" -- 'src/**/__tests__/**'` 0 筆；`git grep -nE "as (TModuleId|TRoutePath)([^A-Za-z]|$)" -- src ':!src/**/__tests__/**'` 0 筆（非測試碼不得 cast 進新的收窄型別；git grep 的 ERE 不支援 `\b`，所以用字元類別收尾。`build.ts:255` 既有的 `id as TRouteId` 是 kernel 內部 `opts: any` 的解析，不在本條範圍）；10 個 `src/modules/*/index.ts` 各恰好一處 `interface TModuleIdRegistry`、10 個 `src/modules/*/model/routes.ts` 各恰好一處 `interface TRoutePathRegistry`（以 `git grep -c` 逐檔確認）。
- [ ] AC-9 [cmd] `pnpm build && pnpm exec vitest run` exit 0；§1 列出的 fixture 測試檔（`build.test.ts`、`use-visible-nav.test.tsx`、`tags/__tests__/permission-types.test.ts`、`user-form.test.tsx`）原斷言的執行期行為不變。I1 的型別測試 `src/shared/module/__tests__/nav-label-types.test.ts` 照過（T2 的約束不破壞 nav 局部 key 推導）。
- [ ] AC-10 [cmd] `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` 0 error（boundaries 規則不放寬）。
- [ ] AC-11 [cmd] IDE 補全量測：新增 `scripts/check-completions.mjs`，以 repo 安裝的 `typescript` 建 `LanguageService`（`getCompletionsAtPosition`，與 VS Code 同一個 API；量測法沿用架構調查報告 §4 的 `completions.mjs`），讀 `tsconfig.app.json`，在記憶體中加一個虛擬檔 `src/modules/tags/__completion_probe__.ts`（只存在 LanguageServiceHost 內，**不寫入磁碟、不進 git**），內容為 tags 形狀的 `defineModule` 與 `TRouteContext<"tags">` 呼叫，於下列 marker 取補全並斷言，任一不符即 exit 1 並印出實際清單：
  - (a) `requires: ["`：補全集合**恰好等於** `src/modules/` 下目錄名（readdir 取得）去掉 `tags`，即其他 9 個 module id；
  - (b) `ctx.page` 的 `routeId: "`：補全非空、每一筆都以 `tags.` 開頭、含 `tags.list`；
  - (c) nav 頂層 `to: "`、`children` 的 `to: "`、`routeTitles` 的 `to: "`：三處補全非空、含 `"/"`、`"/tags"`、`"/orders/order-list"`，且沒有任何一筆含 `$` 或以 `/` 結尾（`"/"` 除外）；
  - (d) 把 nav `to` 寫成 `"/tag"` 的虛擬檔版本，`getSemanticDiagnostics` 對該檔至少 1 筆錯誤（紅線）；同一檔改回 `"/tags"` 時 0 筆。
  驗收：`node scripts/check-completions.mjs` exit 0、輸出逐 marker 列出補全清單。腳本只在完整安裝下跑（不列入 core-only）。VS Code 目視為補充，owner 親驗 pending，不阻擋交付（同 T1 AC-9）。

承諾 → AC 對照：module id registry（AC-1、AC-4、AC-5）；routeId 收窄與 R23 前綴（AC-2）；nav `to` 與 `routeTitles.to` path registry（AC-3、AC-6）；執行期第二道防線保留（AC-6、AC-7）；一次切換、無 cast（AC-8、AC-9）；core-only（AC-4）；IDE 補全（AC-11）。

### Touches

T2 實作棒範圍：

- `src/shared/module/types.ts`（`TModuleIdRegistry`、`TRoutePathRegistry`、`StaticDataRouteOption.routeId`、`TNavBase.to`、`TRouteTitle.to`、`TModule.id`／`requires`、`defineModule`、`TRouteContext<Id>`／`TPublicRouteContext<Id>`）；`src/shared/module/index.ts`（若需匯出新型別）
- `src/modules/<id>/index.ts`（10 個，`TModuleIdRegistry` augment）、`src/modules/<id>/model/routes.ts`（10 個，`TRoutePathRegistry` augment；factory 參數型別）
- `scripts/check-completions.mjs`（新增，AC-11 補全量測）
- `src/app/kernel/build.ts`（路徑檢查；kernel 呼叫 `m.routes`／`m.publicRoutes` 處的型別）、`src/app/kernel/create-app.tsx`（僅在型別需要時）
- 測試：`src/modules/tags/__tests__/module-contract-types.test.ts`、`src/modules/users/__tests__/module-contract-types.test.ts`（新增）；`src/app/kernel/__tests__/build.test.ts`（新增案例與 fixture 入口）；§1 列出的其他 fixture 測試檔（只改 fixture 入口或路徑，不改斷言）
- `.claude/skills/add-module/`、`docs/TRAPS.md`、`docs/specs/refactor/README.md`（T2 列）
- 架構 spec 只同步 §4.1 型別草案（`TModuleIdRegistry`、`TRoutePathRegistry`、`staticData.routeId: TRouteId`、`requires: readonly TModuleId[]`），註明本 spec；§0 鎖定決策不動
- `scripts/verify-core-only.sh` 的 `FULL_INSTALL_TESTS`（僅在新增測試需列入時）

### Must-Not-Touch

- 架構 spec §0 鎖定決策（R1–R29、D1–D5）；R4 本體：`src/app/router/index.ts` 的 `Register`、route 樹型別寬化、module 內以 route 物件導航的做法都不改
- `build()` 既有執行期檢查（`assertUniqueIds`、`assertRequires`、`assertI18nBare`、`assertNavPermissions`、`pageFor` 的 routeId 必填／R23 前綴／重複）不得移除
- nav label、`routeTitles.label`、i18n 字典與 `TransKey`（屬 I1）；T1 的權限型別（`src/shared/permission/**`）
- `openapi.yaml`、`orval.config.ts`、orval 產物（`src/modules/*/api/**`、`*.msw.ts`）、`src/app/operations.gen.ts`
- route 的實際路徑、route id 集合、nav 的項目與順序（只收窄型別，畫面與 URL 行為不變）
- 不新增 module；`src/app/modules.ts` 的 `.use(` 數量不變
- 不另建 module／路徑 codegen（同 OD-TYPE-2 的方向；報告案 3 不採）
- 測試檔不得 augment `TModuleIdRegistry`／`TRoutePathRegistry`

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && test -z "$(git grep -lE 'interface (TModuleIdRegistry|TRoutePathRegistry)' -- 'src/**/__tests__/**')" && node scripts/check-completions.mjs && pnpm verify:core-only
```
expected: exit 0；輸出含 `core-only build: OK`

### Owner Decisions

#### OD-T2-1 與 I1 的合併順序

| 選項 | 內容 | 後果 |
|---|---|---|
| **A I1 先、T2 後（已裁決）** | T2 實作棒等 I1 merge 後，從 master 開 branch | 衝突只在 T2 這邊、規模小；`TRouteTitle.to` 與 `build()` 的 nav 走訪都已存在，可以直接沿用；T2 開工時間被 I1 卡住 |
| B 平行開發，T2 後 rebase | T2 現在就從 `67a8aee` 開工，I1 merge 後 rebase | 提早開工，但 `types.ts`、`defineModule`、`build.ts` 要整段重寫一次；`routeTitles.to` 要等 rebase 後才能補，AC-3／AC-6 在 rebase 前無法完整驗收 |
| C T2 先 | T2 先 merge，I1 rebase | I1 的 82 個檔案要重解衝突，並重驗補裁 2 的推導（I1 AC-4 (2)）；成本最高 |

**已裁決：A（main 代裁 2026-11-11，owner 可覆核）**。I1 先合併，T2 從合併後的 master 開工。T2 不急（三項都是「寫錯會被 `build()` 或畫面發現」的等級，不像 T1 的權限會靜默 403），等 I1 的成本最低。

#### OD-T2-2 route id 收窄到什麼程度

| 選項 | 內容 | 後果 |
|---|---|---|
| A 只收窄讀取端 | `StaticDataRouteOption.routeId: TRouteId`，其餘不動 | 改動最小（`types.ts` 1 行）；R23 前綴錯仍要等 `build()` throw |
| **B 讀取端 + `TRouteContext<Id>`（已裁決）** | 另加 `TRouteContext<Id>`／`TPublicRouteContext<Id>`，`ctx.page` 的 `routeId` 只能是 `` `${Id}.${string}` `` 的已註冊 id | R23 前綴錯在 `tsc` 擋，補全只列自己 module 的 route id（報告 p5 實測 X7／X8）；要改 10 個 `routes.ts` 的 factory 參數型別；交集寫法下的 contextual typing 未經 PoC（§3.2） |

**已裁決：B（main 代裁 2026-11-11，owner 可覆核）**。依據：與 typed-contracts「寫錯要讓 `tsc` 失敗」的設計原則一致（補全 + `tsc` 擋），額外成本是 10 行參數型別。**實作棒的 PoC（§3.2 交集寫法與案 5 寫法）都不成立時，停下來回報，不得自動退回 A；退回 A 必須經 owner 同意**。任何情況都不得用 cast 讓正例通過。

#### OD-T2-3 path registry 登錄什麼、執行期怎麼守

| 選項 | 內容 | 後果 |
|---|---|---|
| **A 只登錄靜態路徑 + `build()` 檢查（已裁決）** | module 在 `routes.ts` 登錄自己的靜態完整路徑（無 `$param`、無結尾斜線）；`build()` 檢查每個 nav／`routeTitles` 的 `to` 是實際 route 路徑 | `to` 的補全只列能直接導過去的路徑；手寫 registry 與實際 route 不一致時，只要被 nav 用到就會在 `build()` throw（vitest 擋）；registry 裡沒被用到的多餘路徑不會被發現（無害） |
| B 連 param 模板一起登錄 | 也登錄 `"/orders/$id"` 這類模板 | 模板不能直接當 nav `to`，登錄了反而讓 nav 可以寫進去；只有在未來要讓 `navigate()` 也走 registry 時才有用，但那是 R4 的範圍 |
| C 只做型別，不加執行期檢查 | registry 與 route 不一致時靜默 | 違反「型別第一道、執行期第二道」（T1 spec 設計原則）；registry 是手寫的，漂移的風險真實存在 |

**已裁決：A（main 代裁 2026-11-11，owner 可覆核）**。只登錄靜態路徑，再加上 `build()` 的執行期檢查（§2.3、AC-6）。

#### OD-T2-4 I1 新增的 `routeTitles.to` 要不要一起收窄

T1 spec 的 T2 範圍只寫了「nav `to`」，`routeTitles` 是 I1 補裁 4 之後才出現的欄位，兩邊 spec 都沒提到它的 `to` 歸誰。

| 選項 | 內容 | 後果 |
|---|---|---|
| **A 併入 T2（已裁決）** | `TRouteTitle.to` 同樣收窄為 `TRoutePath`，執行期也檢查 | 語意與 nav `to` 相同（都是「這個路徑的標題」），共用同一個 base 型別，不另外處理反而要多寫一個例外；I1 已經在 `build()` 檢查同一 `to` 重複，T2 加路徑存在檢查自然 |
| B 不收窄 | 維持 `string` | `routeTitles` 寫錯路徑時 breadcrumb 靜默不顯示標題；與 nav `to` 不一致 |

**已裁決：A（main 代裁 2026-11-11，owner 可覆核）**。`routeTitles.to` 與 nav `to` 一起收窄；Touches（`TRouteTitle.to`）、AC-3、AC-6 (c)、AC-11 (c) 已按 A 撰寫。

### 已知事項

- registry 反映「檔案在 program 內」而非「已 `.use()`」（T1 PoC P2）：檔案在、沒 `.use()` 的 module id 仍算已註冊，所以 `assertRequires` 必須保留。
- `TModuleIdRegistry` 的 key 與 `defineModule({ id })` 是兩處手寫的同一個字串；拼錯其中一處，AC-1 的「未註冊 id」會擋下 `id` 這一側，但擋不到「registry 寫了 `tag`、id 也寫 `tag`」這種兩邊一起錯，最後由 `requires` 的使用端或 `app-wiring` 測試發現。
- 報告的 PoC 都在補裁 2 之前的 `defineModule` 形狀上做，所有數字只證明「Id 泛型 + registry」這個方向可行，不證明疊在 I1 新形狀上一定可行（§3.2 未驗證項）。
