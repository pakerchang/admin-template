判定：**FAIL**。發現一項會影響 demo 基本功能的行為退化：訂單狀態更新後，顧客購買紀錄仍顯示舊狀態。其餘主要是可記錄的架構限制與驗證缺口。

審查 HEAD 與指定 SHA 相符，工作樹乾淨；未改檔、未 commit。以下「報告」指指定的 `m6-impl-report.md`，base 檔案行號以 `96f1565` 為準。

驗證結果：

- **靜態驗證**：直接執行 `./node_modules/.bin/eslint "src/**/*.{js,jsx,ts,tsx}"`，exit 0、無輸出；`git diff --check` 通過。
- **獨立字典比對**：合併 core 與 module 字典後，zh 475、en 474 個 leaf key/value，均與 base 完全相同。
- 指定的兩條 `pnpm exec` 因 pnpm 建立暫存檔遭 EPERM，未執行到檢查。直接啟動 Vitest 仍因 Vite 無法寫入 `node_modules/.vite-temp` 而停止，**測試未執行，原因為 read-only sandbox**，不列 finding。
- build、瀏覽器操作及歷史 commit 的檢查未獨立重跑；報告中的成功結果以下均標為報告證據。

**a. AC 與 M5 遺留項**

| 項目 | 判定與證據 |
|---|---|
| AC-1 | 成立。獨立檢查確認 `pages`、`services`、`components` 均不存在，10 個 module 均有 `index.ts`；例如 `src/modules/users/index.ts:13`。 |
| AC-2 | 靜態成立。各 handler 使用本地 seed，例如 `src/modules/orders/mocks/handlers.ts:5`；跨 module 的 auth 查詢經公開入口，見 `src/modules/auth/mocks/handlers.ts:1`。相對路徑是否跨界由 boundaries 補足，見 d。 |
| AC-3 | 靜態符合；runtime 通過依報告。新增測試涵蓋實際 10 modules、core 頂層 key、裸字典與 scope，見 `src/shared/i18n/__tests__/module-dictionaries.test.ts:14`。報告 `:115` 記錄 50 tests 通過，本輪未重跑。 |
| AC-4 | 成立於移除 **legacy ignore** 的意義。`eslint.config.js:184` 仍保留測試 ignore，未保留 pages/services/components ignore；本輪直接 lint 通過。 |
| AC-5 | 報告支持，未獨立執行。報告 `:114` 記錄 34 檔／333 tests；測試搬遷及 handler 來源調整可見 `src/app/mock/__tests__/mock-handlers.test.ts:5`、`:268`。spec 的「14 檔」是舊數字，屬 info。 |
| AC-6 | **部分佐證充分，manual AC 尚未完成。** 字典比對足以證明翻譯資料未變；本輪也獨立得到完全相同結果。但不能單獨證明每頁 runtime 的語系、fallback、動態 key 與渲染都正確。報告 `:165` 明確承認未開瀏覽器；新增常駐測試也未呼叫 `mount`，見字典測試 `:15`。 |
| M5 遺留 | 搬遷成立：Card 至 product、LoginPage 至 auth、Navbar shim 刪除；例如 `src/modules/product/ui/components/Card.tsx:1`、`src/modules/auth/ui/LoginPage.tsx:1`。orders tag 改讀本地 schema，見 `src/modules/orders/ui/order-status-tag.tsx:3`；app mock 已移除 services handler 依賴，見 `src/app/mock/index.ts:1`。 |

英文缺漏未補，符合行為不變範圍；字典完全相同也表示既有 fallback 問題仍保留，並非新增回歸。

**b. 行為不變**

- **URL、route id、operation 路徑**：route factories 與 `operations.gen.ts` 在本次 diff 中沒有改動。例：`src/modules/orders/model/routes.ts:20`、`:24`、`:34`、`:41` 保留原路徑與 id。
- **搬遷、import、export**：未發現錯接。suppliers／tags 公開匯出對應 hooks，見 `src/modules/suppliers/index.ts:35`、`src/modules/tags/index.ts:35`；型別抽取見 `src/modules/product/model/field-comparison.ts:7`。lint 通過；但本輪沒有執行 build 或測試，不能以 lint 證明所有 `vi.mock` factory 的 runtime 正確。
- **handler 回應**：一般 CRUD 的過濾、排序、分頁、更新與 envelope 實作由 base 抽取至 `src/shared/api/mock-db.ts:19`、`:65`；各 module 的 method/path 對應維持原樣。報告的 34 個 GET 比對僅支持其捕捉到的初始狀態與 query，不能涵蓋全部寫入後行為。
- **確認的行為退化**：base `src/services/mock/handlers.ts:249` 直接查 `db.orders`；現在 `src/modules/consumers/mocks/handlers.ts:8` 建立另一個 transaction collection，`:16` 永遠查該副本。orders 更新只修改自己的 collection，見 `src/modules/orders/mocks/handlers.ts:7`、`:12`。顧客紀錄每次掛載會重新查詢，見 `src/modules/consumers/model/use-consumer.ts:120`，但回來的仍是舊資料；狀態直接顯示於 `src/modules/consumers/ui/components/OrderCard.tsx:64`。
- **登入、角色、C1/C2/W1**：靜態流程保留。登入查目前 users collection（auth handler `:18`）；角色修改原 collection（users handler `:60`），resolver 每次讀目前角色（`:16`）。token 格式、localStorage 與 caller 綁定見 `src/shared/api/mock/session-store.ts:24`、`:41`、`:59`。既有 W1/C1/C2 測試仍在 `src/app/mock/__tests__/mock-handlers.test.ts:228`、`:290`、`:317`；本輪未執行。
- **i18n runtime 順序**：未發現字典缺失的具體錯誤。入口先載入 i18n 初始化，見 `src/app/main.tsx:1`；backend 同步提供 core resources，見 `src/shared/i18n/i18n.ts:13`。`mount` 先載語系、再 deep merge module、最後 render，見 `src/app/kernel/create-app.tsx:63`。這避免先建立 module bundle 導致 backend 跳過 core；已安裝 i18next 實作的 bundle 存在檢查也支持此理由。瀏覽器結果仍未驗證。

**c. kernel 契約與註冊**

`mount` 改動屬**補上既定契約的實作**，不是新增或改變公開契約：spec `:411` 已要求 mount 寫入 scoped module 字典；`create-app.tsx:49` 的簽名及 build 介面未變。報告 `:124` 亦已回報此 touch，不以 Must-Not-Touch 單獨判阻擋。

註冊在目前單 app 啟動流程可成立：users 載入時註冊 resolver（users handler `:16`），build 組裝 guard 時註冊矩陣（`src/app/mock/index.ts:25`），之後才啟動 worker。

但存在 **warning**：login 使用全域最後一次矩陣，guard 使用各自 closure 的矩陣。第二個 app build 後，第一個 app 的 login grants 可能與其 guard 不一致。證據：`src/shared/api/mock/session-store.ts:74`、auth handler `:32`、`src/app/mock/index.ts:32`。resolver 也沒有 unregister/reset；ESM 正常重複 import 不會累加註冊，但重載會覆寫，測試間不能只靠 `server.resetHandlers()` 清除這些狀態。尚無目前單 app demo 壞掉的證據。

**d. R5 與邊界**

- **跨 module seed 的直接 import 確實有 lint 規則攔截**：`eslint.config.js:191` 預設禁止，`:235` 僅允許同 module 的 model/api，`:241` 跨 module 僅放行公開入口。alias 另由 `:258` 禁止。報告 `:99`～`:101` 的 alias／相對路徑破壞性驗證與設定一致；本輪未寫入破壞性 fixture。
- **auth requires users**：合理。走 `users/index.ts` 公開查詢，且宣告 `requires`，符合 §0 R8 與跨 module 公開 API 原則；與 §5.2 表格差異列 info。公開函式確實讀 live collection，不能將它描述成「完全沒有跨 module 資料查詢」，但沒有直接讀他 module seed。
- **Navbar 移入 shared**：解決 module→shell 依賴，現有功能可保留；但 `src/shared/ui/navbar/use-breadcrumb.ts:36` 仍硬編 domain segment，尚未做到 route metadata 驅動。列 info，不因搬動 shells 本身阻擋。
- **mocks→同 module model**：R15 將手寫 domain schema 放 model，現階段沒有 api 產物，這項放行合理；應保留報告承諾的後續檢討。
- **測試 import 放行**：白箱測試讀 seed 合理；`__tests__` 放行並未放寬 production import。相關設定見 `eslint.config.js:184`、`:251`。

**e. 報告逐條判定**

「自行決定」10 項：

| # | 判定與證據 |
|---|---|
| 1 | adapter 移 shared 合理，避免 module→app；`src/shared/api/mock/legacy-adapter.ts:35`。 |
| 2 | auth→users 公開查詢合理，依賴有宣告；`src/modules/auth/index.ts:12`、users index `:24`。 |
| 3 | 全域註冊可支援現行流程，但有多 app／測試狀態污染 warning；session-store `:74`。 |
| 4 | Navbar 搬遷可接受；breadcrumb domain 字面仍是已知架構限制；use-breadcrumb `:36`。 |
| 5 | 僅搬 en `users.*` 保持翻譯資料不變，但 module colocation 尚未完整；users index `:19`、product index `:28`。不以文字差異升級嚴重度。 |
| 6 | 測試豁免、同 module model 放行及宣告式權限 lint 均可接受；eslint `:231`、`:251`、`:277`。 |
| 7 | 公開 hooks、本地格式化／schema／型別合理；suppliers index `:35`、consumers schema `:10`、articles use-article `:23`。 |
| 8 | FieldChange 移 model 正確，消除 model→ui；field-comparison `:7`。 |
| 9 | 保留檔名、schema 命名沒有功能問題；例如 `src/modules/product/model/schema.ts:1`。 |
| 10 | collection helper 簽名差異可接受，沒有需要 name 的行為契約；mock-db `:65`。 |

「spec 差異」八項依報告原順序：

1. domain 字典與 nav label 未完整 scope：記錄為 info；字典值未變，product index `:28`。
2. adapter 位置：合理，legacy-adapter `:35`。
3. Navbar／breadcrumb 位置：可接受但保留硬編限制，use-breadcrumb `:36`。
4. auth requires：合理，auth index `:12`。
5. collection 簽名：實作細節，mock-db `:65`。
6. lint 放行：合理的階段性差異，eslint `:231`、`:251`。
7. Touches 超出：報告已揭露；kernel 判斷見 c，shell 搬遷見 d。
8. 14 與實際 33 個既有測試檔：文件過時；報告 `:114` 記錄最終 34／333，不構成功能問題。

「已知問題」八項依報告原順序：

1. **購買紀錄不同步：屬 demo 基本功能壞掉。** 使用者完成訂單狀態修改後再開顧客紀錄，會看到同一訂單的舊狀態。R5 要求自帶 seed，沒有明確授權取消這項可見一致性；初始 GET 相同不能證明更新後等價。證據見 consumers handler `:8`、`:16`。
2. operations 舊來源註解：info，`src/app/operations.gen.ts:3`。
3. README 過時連結：既有 info，`src/shared/ui/data-table/examples/README.md:38`。
4. grep 不涵蓋相對 import：已有 boundaries 補足，eslint `:191`。
5. breadcrumb domain 字面：info，use-breadcrumb `:36`。
6. seed 重複：R5 下可接受，惟更新一致性另計；consumers seed `:84`。
7. 預設 server 沒有 module handlers：測試使用契約限制，已揭露；`src/app/mock/index.ts:43`、`src/test/setup.ts:26`。
8. manual／browser 未驗：驗證缺口，不能宣稱 AC-6 manual 完成；報告 `:165`。

**f. 逐 commit 獨立驗證**

報告 `:19`～`:27` 記錄 commit 1、2、3 的 lint/build/test；commit 2 漏 import 已在該 commit 前修正重跑。commit 3 驗證後只改註解，commit 4 只改文件，且 HEAD 再跑完整 Done Command（報告 `:107`～`:116`）。

**可接受此次一行註解未立即重跑**，不開 finding。但精確說法是「commit 3 驗證內容與提交內容差一行註解，HEAD 已補驗」，不能說四個 SHA 都逐一獨立重跑過。本輪僅獨立完成 HEAD lint。

**Findings**

| 嚴重度 | file:line | 說明 | 會讓 build／test／demo 基本功能壞掉 |
|---|---|---|---|
| warning | `src/modules/consumers/mocks/handlers.ts:8` | 購買紀錄改用獨立且不接收更新的 collection；訂單頁更新狀態後，顧客紀錄重新查詢仍顯示舊狀態。需保留自帶 seed 的同時恢復更新一致性。 | **是** |
| warning | `src/shared/api/mock/session-store.ts:74` | 全域矩陣最後寫入者勝；多 app build 可造成 login grants 與既有 guard 矩陣不一致，且沒有 reset 生命週期。 | 否 |
| info | `src/shared/i18n/__tests__/module-dictionaries.test.ts:15` | 字典／build 測試沒有涵蓋 browser mount；資料比對支持文字不變，但 AC-6 manual 仍未完成。 | 否 |
| info | `src/shared/ui/navbar/use-breadcrumb.ts:36` | shared breadcrumb 仍含 domain 路徑與翻譯 key，尚未完成 metadata 驅動的解耦。 | 否 |
| info | `src/modules/product/index.ts:28` | domain 翻譯與 nav key 尚未完整搬入 module scope；目前保持原文字，記錄為後續 colocation 工作。 | 否 |

REVIEW_VERDICT: FAIL
REVIEWED_COMMIT: 60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4
REVIEWER: codex-oob