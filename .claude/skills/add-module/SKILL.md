---
name: add-module
description: 依 docs/specs/fsd-module-architecture.spec.md 新增或改寫一個 feature module（src/modules/<id>）。在要新增功能頁群、新 domain、把 pages/<feature> 改成 module、或修改 defineModule 欄位（routes / nav / i18n / mockHandlers / permissions / requires）時使用。
---

# add-module

照 spec 契約新增一個 module。每一步的 § 都指向 `docs/specs/fsd-module-architecture.spec.md`；spec 沒寫清楚的地方**不要自己發明契約**，停下來問 owner。

## 前置條件（先確認，再動手）

先看 `CLAUDE.md`「架構遷移（進行中）」表的 milestone 狀態：

| 需要的能力 | 要等哪個 milestone 落地 |
|---|---|
| `defineModule` / `ctx.page` / `ctx.layout` 型別、`build()` 驗證 | M1 |
| `app/modules.ts` 的 `.use()`、`shells/default`、route composition | M3 |
| 權限強制點、手寫 `src/app/operations.gen.ts`、fail-closed guard | M4 |
| `modules/<id>/{model,ui,mocks,locales}` 內嵌結構、裸字典 i18n、自帶 seed | M6 |
| `openapi.yaml` + orval 產 `api/` 與 `<id>.msw.ts` | M7 |

- **M3 之前**：不要建 `src/modules/`。照現況結構寫：頁面放 `src/pages/<feature>/`、route 加在 `src/router/routes.tsx`（`createRoute`）、選單加在 `src/constants/sidebar.tsx`、mock 加在 `src/services/mock/{handlers,data}.ts`、schema 放 `src/services/schemas/`、i18n key 加在 `src/locales/{en,zh}.json`。
- **M3 到 M7 之間**：只有已落地 milestone 涵蓋的部分照 spec 做；新 module 的 `api/`、`mocks/`、`locales/` 要放哪裡 spec 沒有針對過渡期寫明 → 先問 owner。
- 全部（M1、M3、M4、M6、M7）落地後才能完整照下列步驟走。

## 步驟

1. **決定 id 與 kind**（§4.1）
   - `id`：kebab-case、全 app 唯一（§4.3 驗證 1.1）。
   - `kind`：`"generic"`（auth / users / team-members 類）或 `"domain"`（D4 驗收依此挑出 domain，§0.2 D4）。generic module 不得 `requires` domain module（§5.3）。

2. **建目錄**（§3）
   ```
   src/modules/<id>/
   ├── index.ts      # defineModule + route composition + 具名 headless 公開 API
   ├── api/          # orval 產物，禁手寫（clean: true 會刪掉，§3、R15）
   ├── model/        # 手寫 headless：query hooks、form schema、columns、routes.ts、型別轉出
   ├── ui/           # 預設頁面與元件
   ├── mocks/        # <id>.msw.ts（產物）+ 手寫 handlers.ts / seed.ts
   └── locales/{en,zh}.json + augment.d.ts
   ```
   - 檢查點：`mocks/` 下手寫檔**不得**命名 `*.msw.ts`（§3、§7.2，M7 AC-5 機械檢查）。

3. **契約：在 `openapi.yaml` 加 tag 與 paths**（§4.5、§8.2）
   - `tags` 加 `<id>`（`core` 是 kernel 保留 tag，§0.6 R29）。
   - 每個 operation：`operationId`（camelCase、全檔唯一）、**恰好一個** tag、`x-permission`。權限怎麼寫 → 用 `declare-permission` skill。
   - 跑 `pnpm gen:api` 產出 `modules/<id>/api/**` 與 `mocks/<id>.msw.ts`，並重產 `src/app/operations.gen.ts`（§4.5 gen script）。不改 `orval.config.ts`（從 tags 自動推 target）。

4. **model/routes.ts：定義 route，不 import ui**（§4.4、§4.6）
   - 用 `defineRoutes<TPages>((ctx, pages) => …)`；頁面元件從參數 `pages` 拿。
   - 有畫面的 route 一律 `ctx.page({ …, routeId, component, permission })`；只做路徑分組的用 `ctx.layout({ …, permission })`，**不得**帶 `component` / `routeId`（§4.1、§4.3 驗證 1.8）。
   - route id 格式 `${moduleId}.${name}`（例 `orders.list`），前綴必須是本 module `id`（§0.6 R23、§4.3 驗證 1.7），並以 declaration merging 加進 `TRouteIdRegistry`（§4.4 範例）。
   - 每個 route 都要有 `permission`，不需權限時顯式寫 `"authenticated"`（§6.2）。
   - 禁直接呼叫 `createRoute`（§6.2、§7.2 lint）。
   - module 內導航用 route 物件（`xxxRoutes.get().details`），跨 module 導航只用 nav 字串（§4.6）。

5. **index.ts：defineModule + route composition**（§3.2、§4.1、§4.4）
   - `export default defineModule({ id, kind, requires?, routes, publicRoutes?, nav?, i18n?, mockHandlers?, permissions? })`。
   - `routes: (ctx) => xxxRoutes.build(ctx, { list: ListPage, … })`——ui 頁面只在這裡注入。
   - 具名 export 只放 headless 公開 API（hooks、型別由 `model` 轉出，不直接轉出 `api` 產物，§0.4 R18）。
   - `requires`：列出所有會 import 的其他 module id（§0.3 R8）；缺依賴或成環 → `build()` fail fast（§4.3 驗證 1.2）。

6. **nav**（§4.1、§6.3）
   - `TNavItem.permission` 必填；`label` 是 i18n key，必須以 `${moduleId}.` 開頭；`to` 為絕對路徑；`order` 預設 100。
   - permission 的 resource 必須在某 module 的 `permissions.resources` 宣告過（§4.3 驗證 1.4）。

7. **i18n：裸字典**（§4.3 步驟 4、§5.4）
   - `locales/*.json` 頂層**不含** module id（`{ "list": { "title": "訂單" } }`）；kernel 會自動 scope 成 `<id>.list.title`。頂層 key 等於 `id` → `build()` throw（§4.3 驗證 1.3）。
   - `augment.d.ts` 以 `interface TranslationResources { <id>: typeof zh }` 擴充型別（§5.4）。

8. **mocks**（§4.5）
   - `mocks/handlers.ts` 匯出 `HttpHandler[]`：用 orval 的 `get<OperationId>MockHandler(overrideFn)` 包住，override 讀寫本 module 的 seed。
   - 需要非 200 回應（404 / 422）時手寫 `http.*` handler，**排在**該 operation 的 orval handler 前面（orval handler status 寫死 200，§11.1 K1）。
   - `mocks/seed.ts` 用 `shared/api/mock-db` 的 `createCollection`；**不讀其他 module 的 collection**（§0.3 R5、§5.3）。
   - 契約外的手寫 handler 會被 guard 回 404，要先改 `openapi.yaml`（§6.5）。

9. **permissions**（§6.1）→ 用 `declare-permission` skill。

10. **安裝**（§4.2）：在 `src/app/modules.ts` 加一行 `.use(xxxModule)`。這是唯一列出 `.use()` 的檔案。

11. **頁面可覆寫**（§4.4）：不需額外動作；shell 以 `pages["<id>.<name>"]` 或 app 以 `.override("<id>.<name>", Page)` 覆寫。`shells/default` 不得覆寫或 import module（§4.4、§7.2）。

## 依賴方向檢查點（§3.1、§7.2）

- `ui → model → api → shared`；`mocks → api、shared`；`index.ts → 本 module 各 segment`。
- `ui` 不直接 import `api`（§0.4 R18）；`model` 不 import `ui`。
- 跨 module 只 import `@/modules/<other>`（`index.ts`），且 `<other>` 在 `requires` 內（§5.3）。同 module 內用相對路徑。

## 驗證

```bash
pnpm gen:api && git diff --exit-code -- src/modules src/app/operations.gen.ts   # M7 起
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"                                      # M5 起；不要用 pnpm lint（帶 --fix）
pnpm build && pnpm exec vitest run                                                # 每棒 done 基線；不要用 pnpm test（watch 會掛住）
```

失敗訊息若來自 `build()` 驗證（module id、requires、i18n、nav resource、operation、routeId），對照 §4.3 步驟 1 的條目修。
