判決：PASS-with-fixes。前輪修正項均已處理；新增深層合併仍有兩項問題。審查限於 `b445350..c888b20` 與相關契約接縫，HEAD 符合送審 SHA，工作樹乾淨；未修改檔案、commit 或 push。

- [warning] src/app/kernel/build.ts:172 — `out[k] = ...` 對 `__proto__` 會觸發繼承的 setter。以含此鍵的 core 字典合併同名 module，結果物件的 prototype 被更換，該鍵也不再是 own property。已以從原檔擷取的合併函式重現；未觀察到全域 `Object.prototype` 污染。`constructor` 本身沒有在此次重現中造成全域污染 — 使用安全的 own-property 寫入方式及 own-property 判斷，補 `JSON.parse()` 產生之特殊鍵回歸測試。
- [warning] src/app/kernel/build.ts:162 — `isDict()` 將 Date、class instance 等非 plain object 視為可遞迴字典。當 module 同位置為物件、core leaf 為 Date 時，core Date 變成 module 物件；class instance 則失去 prototype／方法，違反 core leaf 優先語意。已以擷取函式重現；目前字典型別允許這些 `unknown` 值 — 僅遞迴合併 plain object，其他值視為 leaf；補 Date、class instance 與巢狀衝突測試。

前輪解決狀態如下。表中測試有效性為靜態判讀，未實際修改程式進行 mutation testing。

| 項目 | 狀態 | 實作／文件與測試位置 | 改壞時測試是否會抓到 |
|---|---|---|---|
| W1 淺層覆蓋 | resolved | `build.ts:166–185`；`build.test.ts:470–488`；spec:983 | 會。恢復原淺層展開會丟失 core `save`；反轉優先序會得到 `"Module Save"`；無字典案例也有完整結果斷言。特殊輸入問題另列上述新 finding。 |
| W2 缺 component／實際 protected guard | resolved | `build.ts:232、255、287`；`build.test.ts:280–317` | 會。移除 component 檢查後負例不再拋錯；換成普通 `createRoute` 後，metadata 或 `ForbiddenError` 斷言會失敗，普通 TypeError 無法滿足後者。 |
| W3 保留原 beforeLoad | resolved | `guarded-route.ts:27–30`；`can.test.ts:50–68` | 會。吞掉 callback、回傳值或傳錯 context 會破壞允許案例；拒絕前執行 callback 會破壞未呼叫斷言。 |
| I1 core 與 TRegistry 位置 | resolved | `create-app.ts:9–18、33–34`；`build.ts:27、44`；spec:314、329–336 | 文件已對齊；無文件自動測試，屬靜態核對。 |
| 選擇 6：actions 聯集 | resolved | `build.test.ts:435–452` | 會。精確陣列斷言涵蓋聯集及去重；跨 module nav 與 operation permission 同時驗證目錄可解析。 |
| 選擇 1：getGrants 文件 | resolved | spec:664；`build.ts:255`；`guarded-route.ts:21、28` | 注入來源已明文說明；`build.test.ts:307–317` 涵蓋不同 grants 輸入。尚未測同一路由建立後 grants 更新。 |

合併語意核對：

- 一般字典的同名不同子 key 均保留，衝突 leaf 由 core 勝出。
- 陣列、null、函式被視為 leaf，由 core 值取代，行為合理。
- 合併建立新物件，未見直接修改 core 或 module 輸入；未衝突子樹仍共享參考，並非完整深拷貝。隔離重現中的輸入保持不變，目前未有專門的不變性測試。

文件與範圍核對：

| 查核軸 | 結果 |
|---|---|
| 事實 | 新增測試確實呼叫 `build()` 取得 route，沒有 mock 被測 guard 組裝。 |
| 一致性 | docs delta 僅修改 §4.2、§6.2、M1 pseudo code；core 優先文字符合 AC-4。§6.2 明確說明注入方式取代上方 `getSession()` 範例，未新增與 §4.3／AC 的矛盾。 |
| 可行性 | 指定測試因 sandbox 限制未啟動；合併函式的特殊值與特殊鍵問題已獨立重現。 |
| 範圍／複雜度 | `fcc673a..c888b20 -- src` 共 11 個檔案，全部為 `A`，且均位於 `src/shared` 或 `src/app`；既有 src 零修改。未見此次 delta 擴張接線範圍。 |

已嘗試 `pnpm exec vitest run src/shared src/app/kernel`，exit code **1**。pnpm 建立 worktree `_tmp_…` 檔案時遭 `EPERM`，因此 **Vitest 未執行，通過／失敗數無法取得**；此環境限制不列 finding。

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: c888b200a1fa46813bc7855fa58447703e8ae5a4
REVIEWER: codex-oob