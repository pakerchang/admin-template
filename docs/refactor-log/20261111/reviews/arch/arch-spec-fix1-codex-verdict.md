## Findings

1. **critical** — spec:47, 54–56, 319–323, 414, 418, 535–543, 637–665, 1120–1123, 1212：未納入 owner 裁決 6，且把已裁事項誤列為待裁。Owner 已明定：

   - operation→permission 唯一來源是 YAML `x-permission`
   - public operation 同時需要 `x-permission: public` 與 `security: []`
   - `x-permission` 必須完整存在於 module 的 resource/action catalog

   Spec 雖實際選用 YAML，卻在 §11.2 仍稱「若 owner 原意……需改」，且 build 驗證只檢查 resource 存在，不檢查 action。如此 `orders:typo` 只要 `orders` resource 存在便可能通過，無法達成裁決 6 的 typo／刪 module 殘留偵測。全文也沒有要求 public operation 必帶 `security: []`。應把裁決 6正式列入 R 表、刪除未決文字，並將驗證改為完整 permission catalog membership。

2. **critical** — spec:423–424, 647–660, 663–664；對照 owner inbox 裁決 6 指向的 a3 PoC：MSW guard 契約不符合已裁 a3 規則。Spec 的 guard 使用全域 `http.all("*")`，沒有必填 `apiBaseUrl`；任何無法對到 route 的 request 都直接 fall through。a3 已裁行為是：

   - 非 API base URL：放行
   - API base URL 內但無 route：404
   - route 有、permission 缺：403

   現 spec 會讓契約外但碰巧有手寫 MSW handler 的 API request 穿透，破壞 fail-closed。M4 AC-2 也未驗證非 API 放行、API unknown route 404 或 base URL 邊界。

3. **critical** — spec:166–168, 184–185, 357, 362–376, 459, 489–500, 743–777, 845, 1019：route ownership 與依賴方向無法同時成立。Spec 把 `routes.ts` 放在 module `model/`，範例中的 `model/routes.ts` 卻直接把 `OrderListPage`、`OrderDetailsPage` 傳給 route component；這需要 `model → ui`。但架構及 lint 均只允許 `ui → model → api`，`module-model` 不允許 import `module-ui`。照正文實作會 lint 失敗；照 lint 實作則 route factory 無法取得預設頁面。需明定 route composition 位於 `index.ts`／獨立 composition segment，或改變依賴規則。

4. **critical** — spec:218–220, 237, 325, 359–375, 404, 863, 943, 1185：owner OQ-13 只裁定「直接使用 route id，不新增 pages 欄位」，沒有裁定 route id 必須是 `${moduleId}.${name}`。修正棒應 surface 的這項解讀沒有列為待 owner 裁，反而已被型別註解、runtime validation、範例與 AC 當成硬契約。這會自行擴張 owner 裁決，且影響既有 route id 的命名與 override API。

5. **warning** — spec:235–238, 324–325, 359, 400–404, 863–868：正文稱「有 component 的 route 必須有 routeId」，但型別仍是 `routeId?`，build 驗證只檢查已提供 id 的前綴／重複，AC 也沒有驗證 component 缺 routeId 必須失敗。因此 module 可建立無法覆寫的畫面而所有 AC 仍通過，D1 的逐頁替換保證不完整。應增加 runtime validation 與 AC，或拆成 typed helpers 分別表示 layout route 和 page route。

6. **info** — spec:135–174, 406–441, 821–831, 1113–1163：裁決 5 的單一根目錄 `openapi.yaml`、tag 分流、`api/` 全產物、手寫 `model/`、mock 命名限制、`app/operations.gen.ts`、刪 module 流程，均已一致納入。目錄逐節點比對未發現另一套 per-module YAML 或 common YAML 殘留。

7. **info** — spec:439, 1192：OQ-15 core tag 有正確標為「暫定／未決」，沒有假稱 owner 已裁。不過 M7 實作前仍須取得 owner 決定。

8. **info** — master anchors 與命令環境抽查成立：送審 HEAD 正是指定 SHA、diff 僅含 spec；master 的路由、layout、nav、API/mock、schema、權限、i18n、測試設定 anchors 存在且描述吻合。master `package.json` 有 `dev`、`build`、`test`、`lint` scripts；`gen:api` 與 core-only script 明確由相應 milestone 建立。除上述 findings 外，各 milestone done command 的命令與預期建立路徑可執行。

## 上一輪 finding 關閉狀態

- **C1 — closed**：spec:270–289、319–323、352–353、535–543、633–665 已統一為 `OperationPermissions` + `OperationRoute[]`，並透過 `TOperationTable`、registry、build、guard 完整接線；不再有獨立 public set。裁決 6 的新問題另列 finding 1。
- **C2 — closed**：spec:575–600、1041–1042 將 shared 限制為只拋 `ForbiddenError`，`ForbiddenBoundary` 位於 app 並由 kernel 注入，沒有 shared→app 依賴。
- **W1 — closed**：spec:421–424、986–990、1124–1130、1198–1208 已納入固定 200、MSW 3 `onUnhandledFrame`、fetch mutator unwrap，並分配至 M2/M7 AC。
- **W2 — closed**：spec:1008–1009 已改成 `grep -o '\.use(' | wc -l`，可逐 occurrence 計算十個 `.use()`。
- **W3 — closed**：spec:218–220、277、324–325、359–404、1185 已採 route build 時收集 route id，明確不新增 module `pages` 欄位。route id 命名格式仍有未經裁決問題，另列 finding 4。
- **W4 — closed**：spec:248、317、351、508–523、861–868、946–952、1094–1095 已統一為 module 提供裸字典、kernel 僅 scope 一次，並有 validation 與 AC 防止 `orders.orders.*`。

REVIEW_VERDICT: FAIL
REVIEWED_COMMIT: 44f52cc9ddcde816730cdd14e7ae0763b26dccf9
REVIEWER: codex-oob