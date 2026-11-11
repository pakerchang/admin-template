| AC | 判定 | 獨立審查證據 |
|---|---|---|
| AC-1 | PASS | `src/app/modules.ts:18` 起恰有十次 `.use(`；兩個舊集中檔已刪除。 |
| AC-2 | PASS | 比對 base 的 `src/router/routes.tsx` 與十個 `model/routes.ts`，既有 URL pattern 保留；新增 `/` index redirect。完整清單見 `src/app/__tests__/app-wiring.test.tsx:11`。route id 的差異另列下文。 |
| AC-3 | PASS | `src/app/router/index-redirect.ts:27` 依排序後 nav、`can()` 選第一項，無項目則渲染 Forbidden；測試涵蓋三種 grants。default shell 仍有 M4 待移除的角色限制，見 info。 |
| AC-4 | PASS | `src/app/kernel/build.ts:236` 起解析 override；`src/app/__tests__/app-wiring.test.tsx:97` 驗 `/users`。base 的 users list 確實是 `/users`，規格的 `/users/user-list` 與既有路由不符。 |
| AC-5 | PASS（程式碼層；manual 待驗） | sidebar 宣告、排序、翻譯與 CRUD 實作未見新增阻礙；`src/shells/default/app-sidebar.tsx:90` 消費 registry nav。瀏覽器、CRUD、語系切換仍待 owner 驗證。 |
| AC-6 | **FAIL** | 一般小寫、無預設 port 的 origin 下邏輯正確；但合法 origin 經 URL 正規化後會繞過 guard，表外 request 未回 404。`src/app/mock/guard.ts:42`，見 C1。 |
| AC-7 | **FAIL（R24 完整契約）** | 題列的未設定、相對與同源負例有處理；但 `src/app/mock/start-worker.ts:17` 僅取 origin 比同源，仍接受異源非根路徑，無法保證「專用絕對 origin」。見 C1。 |

上述 PASS 包含靜態審查判定，並不代表我重跑了作者的完整測試。獨立 `tsc --incremental false --noEmit` **exit 0**；Vitest 被唯讀 sandbox 禁止建立暫存目錄，未執行任何測試。路由與 guard 的獨立 Node probes 則有實際執行。

**16 項自行決定**

| # | 判定 | 理由與證據 |
|---|---|---|
| 1 | 合理 | pathless `/` 保留 protected 子路由 id，`_index` 避免 `/` 重複；本地套件可重現原本的比對失敗。`src/app/kernel/build.ts:284`、`src/app/router/index-redirect.ts:19`。 |
| 2 | 合理 | base 的 users list 是 users 下的 index route；保留 `/users` 符合 URL 紅線。`src/modules/users/model/routes.ts:25`。但應同步修正文規格，見 W1。 |
| 3 | 合理 | create/edit 是不同 route，R23 要求唯一 page id；共用 component 不表示應共用 id。`src/modules/banners/model/routes.ts:31`、articles 同位置。 |
| 4 | 合理 | 保留 `dashboard.menu.*` 符合 M3 的 i18n key 紅線；前綴要求應在 M6 遷移時完成。`src/modules/consumers/index.ts:15`。 |
| 5 | 合理 | 登入者給 `["*"]` 維持 M3 原有可見範圍，正式 grants 接線屬 M4。`src/app/core.ts:9`。 |
| 6 | 合理 | router context 避免 shell import app；目前 registry nav 不過濾，符合 M3 的全權限過渡。`src/shells/default/use-nav.ts:6`。 |
| 7 | 合理 | `model/routes` 沒 import UI，由 index 注入，符合 headless 邊界；`defineRoutes` 尚無必要消費者。`src/modules/users/model/routes.ts:13`、`src/modules/users/index.ts:11`。 |
| 8 | 合理（限 M3 過渡） | 保留舊角色檢查符合行為不變，M4 明列移除；不能因此宣稱已完成正式內容區 403。`src/shells/default/protected-layout.tsx:5`、`src/shells/default/forbidden.tsx:4`。 |
| 9 | 合理 | Navbar 明列在 Touches；re-export 維持不可修改的 pages imports。`src/components/shared/Navbar.tsx:2`。 |
| 10 | 合理 | 404 body 保留舊格式符合 M3 行為要求，guard 暫放 app/mock 也在 Touches。`src/app/mock/guard.ts:50`。 |
| 11 | **需補** | 使用原始 env 正確，但驗證與 guard 沒有共同正規化，且接受非 origin base，造成 C1。`src/app/mock/start-worker.ts:17`。 |
| 12 | 合理 | browser 啟動獨立、mount 動態載入，避免測試 import graph 立即依賴 browser entry。`src/app/kernel/create-app.tsx:58`。 |
| 13 | 合理（限 M3） | 現有 modules 未供應字典，舊 i18next 初始化仍保留，因此沒有遺失既有翻譯。`src/app/main.tsx:1`、`src/app/kernel/create-app.tsx:64`。 |
| 14 | 合理 | 符合 §5.1 入口搬遷，`index.html` 已同步。`src/app/main.tsx:1`。 |
| 15 | 需補 | test env 有必要且只影響測試；但 `vite.config.ts`、`CLAUDE.md` 確實不在列出的 Touches，應記錄 scope 例外。`vite.config.ts:19`、`CLAUDE.md:17`。 |
| 16 | 需補 | 文件仍禁止建立已正式使用的 modules，會誤導下一棒；可另棒同步，不應繼續當有效指示。`.claude/skills/add-module/SKILL.md` 的 M3 前限制。 |

**⚠ 路由段結論**

改成 pathless `id: "/"` 的方向正確；作者對舊 router 比對失敗的觀察成立，但「瀏覽器已壞」應保留為有原始碼與 probe 支持、尚未瀏覽器確認的推論。

實際安裝的是：

- `@tanstack/react-router` **1.170.46**
- 它使用的 `@tanstack/router-core` **1.171.39**

master 與 M2 的 `src/router/routes.tsx` 相同，相關 router 版本亦一致。獨立最小重現得到：

```text
parent path: "/"，/orders/9 → [__root__]
parent id:   "/"，/orders/9 → [__root__, /, /orders/$id]
                                           params.id = "9"
```

原始碼依據是 router-core `src/new-process-route-tree.ts:277` 對 index node 的建立，以及 `:976` 的終止匹配處理；`src/route.ts:1823` 起以 `customId`、parent id 組合 id，pathless route 則繼承 parent fullPath。官方亦將 `/` 定義為 index、以 `id` 定義 pathless layout。[TanStack code-based routing](https://tanstack.com/router/latest/docs/routing/code-based-routing)

不能說「所有 route id 都不變」：

| 項目 | base → HEAD |
|---|---|
| protected layout id | `/` → `/`；由有 path 改成 pathless |
| protected 子路由 id | 保留，例如 `/orders/$id`、`/users/` |
| login route id | `/login` → **`/_auth/login`** |
| 新增內部 id | `/_auth`、`/_index`、`/_index/` |
| `/` 的用途 | 舊 protected layout → 新 index redirect |

現有唯一有效的嚴格 `useParams({ from })` 位於 `src/pages/orders/order-details/index.tsx:13`，其 `/orders/$id` 已保留。其他頁面使用 `strict: false`；未找到有效 `useSearch` 消費者。既有絕對 `Link to`、navigate 目的路徑不因 pathless wrapper 改名。未發現現有消費者依賴舊 login id，因此該 id 變更目前沒有具體破壞情境。

**Touches 與行為紅線**

- **`build.ts` 在範圍內**：Touches 明列 `src/app/**`，不因檔案最初屬 M1 就排除。登入守衛、index redirect 與 mount 是必要接線。
- **Navbar re-export 在範圍內**：Touches 明列 `components/shared/Navbar.tsx`。它仍把 legacy pages 耦合到 default shell，屬過渡債務。
- **`vite.config.ts`、`CLAUDE.md` 在範圍外**：前者設定專用測試 origin，沒有 production env 副作用；後者為文件更新。應補 scope 記錄，未發現額外 runtime 影響。
- **Must-Not-Touch**：`src/pages/**`、`src/components/ui/**` 沒有 diff。

逐項比對結果：

| 紅線 | 結果 |
|---|---|
| URL patterns | 保留 `/login`；`/users`、`/users/edit/$id`；`/products`、`create`、`edit/$id`、`draft/$id`；`/orders`、`order-list`、`$id`；banners/articles 的 index、create、edit；`/customers`、`/team-members`、`/suppliers`、`/tags`。新增 `/` redirect 為 AC 明確要求。 |
| i18n keys | locale 檔未改；sidebar 八個標題與 orders 子項 key 保留；登入表單與 breadcrumb 搬遷亦未改 key。 |
| mock API paths | `src/services/mock/handlers.ts` 與 client 呼叫未改；`legacyOperations()` 直接導出原 `METHOD path`，四種前綴保留。`src/app/mock/legacy-adapter.ts:47`。 |
| sidebar 項目與順序 | customers → team-members → suppliers → tags → products → orders〔order-list〕→ banners → articles；users 仍沒有 sidebar 項目。icon 與目的 URL 保留。 |
| 實際行為 | **不能宣稱完全不變**：protected 路由由匹配失敗變為可匹配；`/` 新增導向；mock origin 按 R24 改動，且存在下列 guard 漏洞。 |

**Findings — critical**

**C1：啟動驗證與 guard URL 邊界不一致，已接受的 mock 設定可繞過 fail-closed。**

位置：[start-worker.ts:17](/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3/src/app/mock/start-worker.ts:17)、[guard.ts:42](/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3/src/app/mock/guard.ts:42)。

獨立 probe 載入實作，僅將延遲設為零、替換無關的權限依賴，再以 MSW `setupServer` 實發 request；空 operation 表後放置回 299 的偵測 handler：

| 通過啟動驗證的 base | client 產生的 request | 結果 |
|---|---|---|
| `http://mock-api.test` | `http://mock-api.test/nope` | 404，正確 |
| `http://mock-api.test/api` | `http://mock-api.test/nope` | **299，繞過 guard** |
| `http://MOCK-API.test:80` | `http://mock-api.test/nope` | **299，繞過 guard** |

第一個失敗情境是異源非根路徑被接受，但 client 用絕對 path 組 URL，離開 guard 字串範圍。第二個甚至是合法的專用 origin：Request 正規化 host 大小寫及預設 port，guard 卻用原始 env 做 `startsWith()`。

沒有後續 handler 時，browser 設定的 bypass 會讓 request 進入真實網路，而非規定的 404；未來非 public operation 也會跳過權限判定。這違反 R22/R24 的核心保證，應在 M3 修正：拒絕非 origin 設定，並讓 client、handler、guard 使用一致的正規化 origin，補上述回歸案例。

**Findings — warning**

**W1：規格與新實作的公開契約差異尚未同步。**

位置：`docs/specs/fsd-module-architecture.spec.md:1117`、`src/modules/users/model/routes.ts:25`、`src/modules/banners/model/routes.ts:35`。

下一棒照規格測 `/users/user-list` 或覆寫 `banners.form`／`articles.form`，會分別遇到非既有列表路徑、unknown override id。實作選擇合理，但應同步修正規格，避免把作者自行認定的筆誤與命名調整留成雙重契約。

**Findings — info**

- **依賴方向仍有過渡違規**：`src/shells/default/protected-layout.tsx:5` 直接取 legacy users hook；`src/components/shared/Navbar.tsx:2` 反向依賴 shell。它們未達 §3.1 終態，但分別受 M4 移除角色檢查、M6 搬 pages 的計畫約束，這次不列新增 critical。
- **正式內容區 403 尚未完成**：`src/shells/default/protected-layout.tsx:11` 對非 admin/superadmin 仍整頁返回 UnauthorizedPage；`src/shells/default/forbidden.tsx:4` 沿用 `h-screen`。這是原行為與明列的 M4 工作，不把 fixture 的 AC-3 通過解讀為所有角色已符合 R10。
- **驗證限制**：作者聲稱的 211 tests、build、破壞性驗證未由本次重跑確認。獨立確認的是 TypeScript 靜態檢查、路由 probe、guard bypass probe；worktree 未修改，未寫 verdict 檔。

REVIEW_VERDICT: FAIL
REVIEWED_COMMIT: 259e4c3da6cde5ccf5362a9788edc082e7a16ffa
REVIEWER: codex-oob