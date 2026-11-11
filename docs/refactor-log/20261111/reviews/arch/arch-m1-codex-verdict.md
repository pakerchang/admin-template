判決：**PASS-with-fixes**。主要契約與負例驗證已實作；需修正 i18n 同名 key 合併，以及補強部分回歸測試。審查為靜態驗證，測試未能執行。

審查 HEAD 為指定的 `b445350f4d4f5758e90fe94ac280f4dbc15bfc07`，工作樹乾淨；未修改檔案、commit 或 push。

**Findings**

- [warning] src/app/kernel/build.ts:162 — `scopeAndMerge()` 以淺層展開覆蓋 core 同名頂層 key，違反 §4.3 步驟 4 的 `mergeDeep` 與 AC-4「core key 不被覆蓋」。例如 core 有 `common.save`，安裝 `id: "common"` 的 module，即使它沒有 i18n，也會以 `{}` 清掉 `common`。現有 `build.test.ts:408` 只測 `orders` 與 `common` 不同名的情況，抓不到此問題 — 依 §4.3 實作深層合併，補同名但不同子 key、module 無字典的測試；同步修正 spec:981 的淺層展開註解，消除 spec 內部歧義。

- [warning] src/app/kernel/__tests__/build.test.ts:250 — page/layout 驗證缺少「page 有 routeId、缺 component」的負例；刪除 `build.ts:217` 的 `!opts.component` 判斷，現有測試仍能通過。此外 protected fixture 全使用 `"authenticated"`，未驗證 kernel 組出的 permission route 確實經過 `guardedRoute`；把 `build.ts:240` 改成普通 `createRoute`，現有 kernel 測試也抓不到 — 補缺 component 負例，以及經 `build()` 取得實際 protected route、在無 grant 時執行 `beforeLoad` 並斷言 `ForbiddenError` 的測試。

- [warning] src/shared/permission/__tests__/can.test.ts:22 — 未測 `guardedRoute` 保留原 `beforeLoad` 的契約。刪除 `guarded-route.ts:30`，目前測試仍通過，但 module 的 loader 前置邏輯會被吞掉 — 補允許時 callback 收到原 context、回傳值保留，以及拒絕時 callback 不執行的測試。

- [info] src/app/kernel/create-app.ts:9 — 實際公開簽名新增必填 `core`，與 §4.2 的三參數簽名不同；雖符合 M1 pseudo code，但後續照 §4.2 接線會缺參數。`TRegistry` 也實際定義於 `build.ts:45`，非草案的 `create-app.ts` — 同步公開 API 文件與型別匯出位置。

**AC 逐條判定**

以下測試路徑簡寫：`K` = `src/app/kernel/__tests__/build.test.ts`；`P` = `src/shared/permission/__tests__/can.test.ts`。

| AC | 實作位置 | 測試位置 | 判定與測試有效性 |
|---|---|---|---|
| AC-1 | `src/shared/permission/can.ts:4` | `P:9` | **符合**。精確 grant、兩種 wildcard、空 grants 均有直接布林斷言，另測相近 resource 不匹配；未 mock 被測邏輯。 |
| AC-2 | `src/app/kernel/build.ts:59`、`:67`、`:91`、`:115` | `K:104` | **符合**。六類拒絕情況均有負例；requires 另有不依賴安裝順序的正例。cycle 測試僅斷言 `/cycle/`，未鎖定訊息中的 module id，但實作會列出環中 id。 |
| AC-3 | `src/app/kernel/build.ts:197`、`:223`、`:228`、`:279` | `K:293` | **符合**。三層覆寫以實際渲染結果斷言；未知 app id、未知 shell id、重複 id、錯誤前綴及集合內容均有有效檢查。 |
| AC-3b | `src/app/kernel/build.ts:201`、`:213` | `K:250` | **符合此 AC 明列的負例**。缺 routeId、layout 帶 component 均會失敗，public page 亦有負例；§4.3 額外要求的缺 component 防線缺測試，見 finding。 |
| AC-4 | `src/app/kernel/build.ts:162`、`:190`、`:255`、`:283` | `K:354`、`:394` | **部分符合**。route tree、穩定排序、scope 一次、guard 第一位均有實質斷言。core key 同名覆蓋未涵蓋，見 finding。 |
| AC-5 | `src/app/kernel/build.ts:128` | `K:176` | **符合**。缺 permission、孤兒 key、未安裝 resource、錯 action、public、有效 permission 均有正負例；另測 wildcard 拒絕及 method 大小寫正規化後重複。 |
| AC-6 | 指定 diff 與全域 import 搜尋 | 非單元測試；spec:959 定義整合命令 | **靜態部分符合**。既有 src 零修改、新碼未接線。build／全量測試未驗證，不能宣稱完整行為驗收通過。 |

AC-4 的 guard factory 是注入替身，但測試目標是**組裝位置與傳參**，沒有 mock 掉 `build()` 的組裝邏輯；實際 MSW guard 行為屬後續 milestone。

**Touches / Must-Not-Touch**

- `git diff --name-status fcc673a..b445350 -- src` 全部為 `A`；沒有修改或刪除既有 src。
- 搜尋新路徑引用，僅出現在此次新增檔案與測試內；既有程式未 import 新碼。
- `msw` 僅在 `shared/module/types.ts:4`、`app/kernel/build.ts:21` 以 `import type` 使用；未建立 runtime MSW 接線。
- `package.json` 唯一變動為新增 `"msw": "3.0.4"`。
- lockfile 新增 MSW 與其傳遞依賴；Vitest／mocker／coverage snapshot 的變動對應新出現的 MSW optional peer 解析，未見無關直接依賴升級。

**§4／§6 契約一致性**

| 契約 | 核對結果 |
|---|---|
| §4.1 module、nav、route context、typed route id | 欄位與 helper 簽名對上；`defineModule` 保留輸入型別。 |
| §4.2 shell、registry | 欄位對上；新增 `TCore` 注入介面、registry 定義位置不同。M1 未實作 `mount()`，符合接線留至 M3 的範圍。 |
| §4.3 驗證 1.1–1.8 | 均有對應實作，包含 nav 完整比對、operation 雙向存在性、wildcard 拒絕、method/path 重複、override 與 page/layout 檢查。 |
| route 組裝與覆寫 | public／protected 分開組裝，routeId 寫入 staticData，覆寫優先序正確。 |
| nav／i18n | nav 穩定排序正確；i18n scope 正確，但深層合併有上述偏移。 |
| handler／permissions | handler 次序正確；權限目錄彙整正確。mock grant 矩陣未組裝，依 M4 範圍延後合理。 |
| §6.1 permission 型別 | `TPermission`、`TGrant`、operation 表、module permissions 與 catalog 對上。 |
| §6.2 guard | 權限判斷、ForbiddenError、metadata、原 callback 接續均有實作；session 來源改注入。內容區 403 留待 M4。 |

**六項實作選擇**

| 選擇 | 判定 | 理由 |
|---|---|---|
| 1. `getGrants` 注入取代 `getSession()` | **合理但需補文件或測試** | 避免 M1 依賴尚未建立的 session store，保留 guard 判斷語意。應同步 §6.2，補 callback／grants 更新測試。 |
| 2. `createApp` 新增 `core` | **合理但需補文件或測試** | M1 pseudo code 已有 `core`；注入 root、字典及 guard factory 有助隔離接線。§4.2 公開簽名須同步。 |
| 3. auth／`/` redirect／ForbiddenBoundary 延後 | **合理** | §9 明列 M3 接線與 redirect、M4 內容區 403。`ponytail:` 註解如實標示尚未完成的部分，未將 stub 當成安全邊界。 |
| 4. core i18n 同名 key 不驗證且淺層覆蓋 | **違反 spec** | §4.3 要求深層合併，AC-4 要求保留 core key。僅加 collision 拒絕會新增限制；優先依 spec 修合併。 |
| 5. staticData routeId 使用 `string` | **合理** | runtime metadata 使用 string 可接受；對外 `ctx.page`、override、shell pages、registry 仍使用 `TRouteId`，建構時也驗前綴與唯一性。 |
| 6. 同 resource 的 actions 取聯集 | **合理但需補文件或測試** | 符合彙整所有已安裝 module 權限目錄的語意，spec 未要求 resource 單一擁有者。應補跨 module 聯集、去重及 permission 可解析的測試。 |

**文件一致性**

`CLAUDE.md`、`docs/TRAPS.md` 與兩份 skills 的新增 owner 裁決互相一致；nav 完整比對也已同步 spec、實作與測試，未將已裁決事項列為 finding。

有兩點需在收尾時處理：

- spec §4.3 深層合併與 M1 pseudo code 的淺層展開提示互有張力，應隨 i18n 修正統一。
- `CLAUDE.md:46` 已標「M1 完成」，但本次審查仍有待修項，且未能獨立確認 Done Command。此標記應在修正並取得驗收證據後確認；不能僅由這個標記推定已驗收。

**測試執行**

已嘗試：

`pnpm exec vitest run src/shared src/app/kernel`

命令 **exit code 1**：pnpm 在 worktree 建立 `_tmp_…` 檔案時收到 `EPERM: operation not permitted`。**Vitest 未啟動；通過／失敗數皆無法取得。** 這是 read-only sandbox 限制，不列 finding。build 與全量測試亦未驗證。

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: b445350f4d4f5758e90fe94ac280f4dbc15bfc07
REVIEWER: codex-oob