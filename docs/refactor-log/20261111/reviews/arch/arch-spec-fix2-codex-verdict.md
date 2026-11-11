## Findings

1. **info** — spec:63–68, 351–355, 464–473, 686–733, 1205–1211：owner 裁決 6 已完整接入。operation→permission 唯一來源為 YAML `x-permission`；public operation 同時要求 `x-permission: public` 與 `security: []`；module 僅宣告完整 resource/action 目錄、角色 grants 與 ABAC conditions。`orders:typo` 的負例同時出現在 M1、M7 AC。

2. **info** — spec:314–315, 391, 473, 686–733, 1118–1126：a3 guard 規則已一致落實。`apiBaseUrl` 必填，非 API 放行、unknown route 404、未宣告 403、public 放行、無權限 403；M4 AC-2 覆蓋 base URL 邊界、手寫 handler 不得繞過 guard、path parameter 等情境。

3. **info** — spec:166–174, 183–205, 400–446, 509, 913, 1100：route composition 已移至 module `index.ts`。`model/routes.ts` 不 import UI，而由 `index.ts` 注入頁面元件；維持 `ui → model → api`，沒有 `model → ui` 反向依賴。

4. **info** — spec:60, 233–269, 357–358, 398–400, 931–934, 1273, 1283：OQ-16 route-id 格式已明確標為待 owner 裁；`${moduleId}.${name}` 僅為暫定 A，所有受影響的 validation、範例與 AC 均標示裁決後鎖定或調整。

5. **info** — spec:246–269, 358, 398, 931–934, 1012–1015：page route 的 `routeId` 與 `component` 已由 typed `ctx.page` 強制必填；`ctx.layout` 禁止 component。另有 runtime 負例與 AC 防止 `as any`／JS 呼叫繞過型別。

6. **info** — spec:1282–1283, 1306–1309, 1315：修正棒要求 surface 的項目均有明確處理：

   - OQ-15 core tag 與 OQ-16 route-id 格式列為未決。
   - `apiBaseUrl` 與同源設定衝突列出暫定方案及需 owner 同意的替代方案。
   - 未登入 API 從 401 改為 a3 的 403。
   - `getGranted` 改為 `getGrants + can()` 有 D5 wildcard 的具體理由。
   - R21 gen/build 分工明說限制及 owner 若要求更強 gen check 時的代價。
   - M3 全 public 明確限定為過渡，M4 起才啟用實質權限。

7. **info** — spec:922–1251：M1–M8 的依賴順序、Touches、Must-Not-Touch、AC 與 done command 自洽。master `package.json` 已有 `build`、`test`、`dev` scripts；`gen:api` 與 `verify-core-only.sh` 明確由相應 milestone 建立。命令引用的既有 master 路徑成立，未發現不可執行的驗收命令。

8. **info** — spec:72–110, 1307–1308：抽查 master anchors 成立，包括 `api-client.ts:44` 的同源 base URL、`handlers.ts:127` 的登入失敗 401、`handlers.ts:209–214` 的 404 fallback，以及路由、layout、nav、schema、i18n、測試設定等 anchor。送審 HEAD 與指定 SHA 相符，base diff 僅包含該 spec。

## 上一輪 finding 1–5

1. **closed** — spec:63–68, 351–355, 464–473, 686–733, 1205–1211：裁決 6 已正式列入 R21；public `security: []` 與完整 resource/action catalog membership 均有 extract/build 驗證及 AC。
2. **closed** — spec:68, 314–315, 391, 473, 686–733, 1118–1126：guard 已採 a3 的必填 `apiBaseUrl` 與完整 404/403/fall-through 判定。
3. **closed** — spec:166–174, 183–205, 400–446：route composition 位於 `index.ts`，`model/routes.ts` 不 import UI。
4. **closed** — spec:60, 233–234, 357, 398, 1273, 1283：route-id 格式已拆成 OQ-16 並明確待 owner 裁。
5. **closed** — spec:246–269, 358, 931–934：page/layout typed helpers、runtime validation 與負例 AC 已共同保證 page route 必有 routeId。

## 前一輪已關閉項目

- **C1 — remains closed**：spec:301–307, 351–355, 464–473, 579–618, 686–733；仍使用 `OperationPermissions + OperationRoute[]`，並完整接入 registry/build/guard。
- **C2 — remains closed**：spec:620–654, 1129–1130；shared 只提供 `ForbiddenError`／guard 邏輯，`ForbiddenBoundary` 留在 app，沒有 shared→app 依賴。
- **W1 — remains closed**：spec:471–472, 1212–1217, 1293–1300；固定 200、`onUnhandledFrame`、mutator unwrap 與未驗證限制仍保留。
- **W2 — remains closed**：spec:1087–1088；仍以 `grep -o '\.use(' | wc -l` 計算 occurrence。
- **W3 — remains closed**：spec:232–234, 308, 357–358, 398–454；route id 在實際 build route 時收集，未新增 module `pages`。
- **W4 — remains closed**：spec:279, 349, 390, 558–573, 935–938；module 提供裸字典，kernel 僅 scope 一次，並保留 validation 與 AC。

REVIEW_VERDICT: PASS
REVIEWED_COMMIT: 07dcae4c9f56e1cba548aa21ddee835ae63dddd7
REVIEWER: codex-oob