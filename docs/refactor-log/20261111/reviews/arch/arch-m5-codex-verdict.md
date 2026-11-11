`arch-m5-codex-verdict.md` 審查內容如下；依只讀要求，未建立檔案、未修改或 commit。

本輪未發現 critical，也未發現會讓 build／test／demo 基本功能壞掉的回歸。依 owner 原則，可併入；以下邊界防護缺口應記入已知問題。測試受 sandbox 限制，未能獨立確認報告宣稱的 316 tests 通過。

**Findings**

| 等級 | 發現與具體情境 | 證據 | 會讓 build／test／demo 基本功能壞掉 |
|---|---|---|---|
| warning | `**/__tests__/**` 不只免查測試來源，也讓正式碼指向測試目標的依賴免於 boundaries 檢查。若把正式實作放入此目錄，可繞過 shared→app 等限制。未發現本次程式使用此繞道；列後續防護問題，不要求本棒修正。 | `eslint.config.js:186`；記憶體探針在 `src/shared/lib/utils.ts` 加入 `import "@/app/kernel/__tests__/build.test"`，boundaries 訊息為 `[]`；同來源 import `@/app/core` 則報錯。 | 否 |
| warning | 未上線 `createRoute`／`useCan`／`use-user-permissions` 限制，未來 module 或 shell 可直接建 route、使用命令式判權。報告以合法 `useCan` 消費者解釋整組延期不充分：草案限制範圍是 modules／shells，不含那些 app／shared 消費者。本次搜尋 modules／shells 未發現現存違規，因此記後續事項。 | `eslint.config.js:248` 的限制只有 deep import；spec `docs/specs/fsd-module-architecture.spec.md:890` 起另列 syntax 限制；`rg -n 'createRoute|useCan' src/modules src/shells` 無輸出。 | 否 |
| info | legacy 仍可 deep import module，且新目錄可依賴被 ignore 的 legacy 目標；目前是 M5 明示過渡安排。M6 必須連同搬遷清除，不能只刪 ignore。 | `eslint.config.js:26`、`:186`、`:248`；`src/pages/banners/BannerForm.tsx:14`、`src/modules/orders/ui/order-status-tag.tsx:1`。 | 否 |

上述 warning 均為後續已知問題，不開本 milestone 修正棒；純 spec 文字差異不作阻擋依據。

**a. AC 與 jsdom**

| 項目 | 判定 | 核對證據 |
|---|---|---|
| AC-1 | 成立 | plugin 載入於 `eslint.config.js:2`、`:162`，預設拒絕於 `:193`。以 ESLint `lintText` 注入 shared→orders import，實際得到 `boundaries/dependencies`。未建立 fixture 檔。 |
| AC-2 | 成立，限 M5 搬遷範圍 | `rg -n '@/(app|shells|modules)/|EOrderStatus' src/shared` 無輸出。訂單 enum 已移到 `src/modules/orders/ui/order-status-tag.tsx:1`；shared Tag 僅接受 tone（`src/shared/ui/tag.tsx:3`）。domain 字典／型別仍待 M6，見下文。 |
| AC-3 | 成立 | 所列六類舊目錄及自訂 jsdom env 的存在性檢查輸出 `REMOVAL_CHECK_OK`；搬遷落點亦與 git rename diff 一致。 |
| AC-4 | 成立 | 直接執行 `node node_modules/eslint/bin/eslint.js "src/**/*.{js,jsx,ts,tsx}"`：exit 0、無輸出。 |
| jsdom 項 | 部分成立 | env 檔已刪，`vite.config.ts:16` 為 `"jsdom"`，MSW setup 保留於 `src/test/setup.ts:20`。測試在載入設定時因 `.vite-temp` 寫入被 sandbox 拒絕，未開始執行，無法獨立確認 MSW／AbortSignal 測試通過。 |

**b. 行為不變**

- **import 與同名 symbol：未發現錯接。** 對三個 commit 的 git tree 掃描 import／re-export／動態 import／mock 內部路徑，結果分別為 `799 / 805 / 805` 個 specifier，`unresolved: []`。目前 app、node 兩個 TypeScript project 以 compiler API 做不寫檔檢查，均為 `0 diagnostics`。
- **全 repo mock：未發現漏改。** AST 掃描共 `44` 個 `vi.mock`，其中 `29` 個內部模組目標皆可解析，並有對應實際消費路徑。例如 fetcher mock 在 `src/pages/product/hooks/__tests__/use-get-all-products.test.tsx:23`，受測 hook import 在 `src/pages/product/hooks/use-product.ts:8`；upload mock 在 `src/pages/banners/__tests__/form/banner-form.test.tsx:99`，消費者在 `src/pages/banners/BannerForm.tsx:16`。DataTable 測試的 `vi.mock("..")` 解析為新 barrel，與 `src/shared/ui/data-table/data-table.tsx:31` 相同。
- **barrel：未發現消費者所需 export 遺漏。** DataTable exports 保留於 `src/shared/ui/data-table/index.ts:1`；通用 image-validation exports 在 `src/shared/lib/image-validation/index.ts:1`，banner factory 改由 `src/modules/banners/model/image-validation/index.ts:29`、`:56` 提供。這是刻意分離 domain export；消費者已改指新位置（`src/pages/banners/BannerForm.tsx:11`）。`DotTag` 是明示刪除，非搬遷遺漏。
- **Tag：七種狀態與 default 一致。** base `src/components/shared/Tags.tsx:16` 起的 NEW／PENDING／SHIPPED／PAID／CANCELLED／REFUNDED／COMPLETED，分別對應 warning／info／accent／accent／danger／danger／success（`src/modules/orders/ui/order-status-tag.tsx:6`），CSS 字串逐一一致（`src/shared/ui/tag.tsx:5`）。未知值不加色彩 class，保留 base default 無色行為；外層 class 與文字亦一致。
- **API／session：未發現行為變更。** `fetcher.ts` 相對 base 僅抽出 session，URL、query 過濾、Bearer header、JSON body、response status/body 均保留（`src/shared/api/fetcher.ts:25`）。storage key 仍是 `"auth"`，parse 失敗回 null，set／clear 原樣保留（`src/shared/api/session.ts:3`、`:20`、`:29`）。base 本來就沒有統一 401 清 session；目前仍回傳 status，由登入流程處理非 200（`src/components/layouts/LoginPage.tsx:25`）。grants 注入與讀取保留（`src/app/mock/index.ts:24`、`src/app/core.ts:14`）。
- **`role: string`：無新增執行期差異。** 這是型別放寬，符合 spec `:548`；base getAuth 原本也是 JSON assertion，沒有 role runtime validation。前端判權仍取 grants（`src/app/core.ts:14`）。
- **i18n：初始化與資源路徑一致。** 啟動仍先 side-effect import（`src/app/main.tsx:1`）；字典改從 `./locales/{en,zh}.json` 載入（`src/shared/i18n/types.ts:1`），兩份 JSON 的 rename diff 均為 `0/0`。初始化、`currLng`、fallback、事件處理未改（`src/shared/i18n/i18n.ts:8`、`:33`、`:52`）。
- **路徑設定：自洽。** `@/*` 仍指 src，include 仍覆蓋所有 src，typeRoots 更新到 shared/types（`tsconfig.app.json:28`、`:36`、`:38`）；test config 繼承它（`tsconfig.test.json:2`）。Vite alias 未變（`vite.config.ts:11`）；shadcn CSS／aliases 已同步（`components.json:8`、`:14`）。
- **pages：成立。** 49 個變動檔經 AST 移除 imports、正規化 mock 路徑後，輸出 `nonImportChangesAfterMockPathNormalization: []`。三處 `OrderStatusTag as Tag` 僅換 import，沒有 JSX／業務邏輯改動（例如 `src/pages/orders/OrderList.tsx:9`）。

另對 77 個 rename 的 TS／TSX 檔比對，非 import／export 差異只出現在預期的 API、schema、i18n 拆分，以及三個 DataTable 測試 mock 路徑。未做瀏覽器目視或 CSS 產物重建，因此 UI 外觀僅能給靜態核對結論。

**c. boundaries 設定**

| 檢查 | 判定與證據 |
|---|---|
| shared→app／shells／modules | 三個記憶體探針皆被 `boundaries/dependencies` 擋；符合 `eslint.config.js:205`。 |
| 跨 module deep import | product→suppliers/model/routes 同時命中 boundaries 與 no-restricted-imports（`:221`、`:255`）。 |
| shell→module | default shell 探針被 policy index 3 拒絕（`:213`）。其他 shell 可讀 module index，這符合 spec `:202`、`:212`，不應一律禁止。 |
| elements 順序 | 四個 segment 排在 module fallback 前（`:166`～`:181`）；model→同 module ui 探針被正確辨識並拒絕，未被泛用 module 吞掉。 |
| policies 順序 | default-shell disallow 在 shell allow 後（`:209`、`:213`）；後面的 module policies 不匹配 shell，未發現覆蓋漏洞。 |
| LEGACY_PATHS | 只涵蓋 pages／services／components（`:26`），沒有整批排除 app／shared／shells／modules。 |
| 常駐測試 ignore | 有正式碼經測試目標繞過的缺口，見 finding。 |
| deep-import 限制只套新目錄 | 是明示過渡缺口。現有 pages 的 banner／orders deep imports 可通過；新目錄仍受限制（`:248`），未發現本次非預期使用。 |

**d.「自行決定」10 項**

| # | 判定 | 理由與依據 |
|---|---|---|
| 1 Card 留 legacy | 合理 | stock／price／product 翻譯 key 明確屬商品（`src/components/shared/Card.tsx:23`、`:54`）；優先遵守 §0 D4，勝過搬遷表文字。 |
| 2 Navbar shim 保留 | 合理 | pages 仍使用它（`src/pages/product/ProductList.tsx:8`），避免提前擴大 M6 範圍。 |
| 3 kebab-case | 合理 | import 已同步，TypeScript 無診斷；新落點如 `src/shared/ui/data-table/data-table.tsx:1`。 |
| 4 upload hook 不再拆 | 合理 | hook 包含上傳／刪除與狀態管理（`src/shared/api/upload.ts:17`、`:34`、`:89`）；符合 R29 手寫 core client 落點。 |
| 5 刪 DotTag | 合理 | base export 無 repo 消費者；其餘使用者已導至 OrderStatusTag。屬明示、無消費者的 API 清理。 |
| 6 tone 命名 | 合理 | 不含 domain，且配色完整保留（`src/shared/ui/tag.tsx:3`、`:5`）。 |
| 7 TransKey／TranslationResources 延後 | 合理 | M6 明列字典重整；目前資源與推導保留原行為（`src/shared/i18n/types.ts:8`、`:25`）。須保留同名不同義提醒。 |
| 8 API 測試留 services | 合理 | 測試仍依賴 legacy mock data（`src/services/__tests__/api-client.test.ts:4`）；不影響本次搬遷。 |
| 9 不加 syntax／權限 hook 限制 | 需修正，列後續 | 延期理由不充分，但現存 modules／shells 未使用違規呼叫，故不開本棒修正；見 finding。 |
| 10 deep-import 限制只套新目錄 | 合理，限過渡期 | M5 允許 legacy ignore；現存必要消費者見 `src/pages/banners/BannerForm.tsx:14`。M6 應收斂。 |

**「spec 差異」逐條判定**

| 差異 | 判定 |
|---|---|
| `rules` 改 `policies`、補充比對順序 | 合理；實際設定可執行且探針報錯（`eslint.config.js:194`）。文字更新記 info。 |
| legacy ignore／deep-import 範圍／syntax 未上線 | 前兩者合理過渡；syntax 限制需後續補齊，見決定 #9。 |
| default shell 拒絕所有 module element | 合理；符合 core 不依賴 domain，探針命中拒絕（`:217`）。 |
| Card 留 legacy | 合理；§0 D4 優先，見決定 #1。 |
| shared UI 改檔名 | 合理；import、型別檢查均自洽。 |
| upload hook 只落 shared/api | 合理；符合 R29，見決定 #4。 |
| fetcher 暫不作 orval unwrap | 合理；M7 才驗 mutator，現在保留 base response 形狀（`src/shared/api/fetcher.ts:45`），避免提前破壞 hooks。 |
| 刪自訂 jsdom env | 變更本身合理；測試通過部分未獨立驗證（`vite.config.ts:16`）。 |

**e. 逐 commit 自洽性與執行結果**

| Commit | 靜態核對 | build／test |
|---|---|---|
| `2cdc3ac` | dependency、lockfile、lint 設定同 commit 加入；待搬目錄暫時 ignore。799 個內部路徑無缺檔。 | 未獨立執行歷史版本。 |
| `8189942` | 搬遷與設定同步，暫時 ignore 已移除；805 個內部路徑無缺檔。fetcher mock 已修正。 | 未獨立執行歷史版本。 |
| `43dfba8` | 僅刪 env 與改 environment，沒有懸空設定；805 個內部路徑無缺檔。 | HEAD lint 通過、型別檢查無診斷；Vitest 未開始。 |

報告的逐 commit build／test 結果只能標為「實作方自述，未獨立重現」，不能由靜態自洽直接推定通過。

執行證據：兩個指定 `pnpm exec` 命令皆在 pnpm 建立 `_tmp_*` 時因 `EPERM` 結束；直接 ESLint 成功；直接 Vitest 在寫入 `node_modules/.vite-temp/vite.config.ts.timestamp-*.mjs` 時因 `EPERM` 結束。完整 build 未執行，因其會寫入 build info／dist。這些限制不列 finding。`git diff --check` 通過，最終 `git status --porcelain` 無輸出。

REVIEW_VERDICT: PASS
REVIEWED_COMMIT: 43dfba8562165ee6d56fdf51c2ef0c826d24add9
REVIEWER: codex-oob