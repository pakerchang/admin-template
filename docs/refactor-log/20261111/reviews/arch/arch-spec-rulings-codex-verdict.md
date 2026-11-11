## Findings

1. **warning** — spec:77, 745, 1117：R24 的 fail-fast 條件未完整落實「專用絕對 origin」。目前只拒絕同源根目錄，會接受 `apiBaseUrl = location.origin + "/api"`。但 client 使用絕對路徑呼叫；依 `new URL("/users", baseUrl)` 語意，請求會成為 `location.origin + "/users"`，落在 `/api/` guard 範圍外並被放行。`/user`、`/users`、`/admin` 同樣如此。這是 fail-closed 漏洞。應改為 mock 模式直接拒絕任何 `new URL(apiBaseUrl).origin === location.origin`，並在 M3 AC-7 增加同源非根路徑負例。

2. **warning** — spec:1306–1308：§10.2「無未決項」不成立。上述同源非根路徑邊界尚未由 owner 明確裁決，且目前文字「專用 origin」與具體驗證條件互相矛盾。若「專用」確定代表不同 origin，可直接修正驗證條件；否則應列為待 owner 裁項。

3. **info** — spec:70–82 及各落點：除 R24 的驗證缺口外，R23–R29 均已接入相關契約、milestone AC 與風險段落；未發現本輪破壞 07dcae4 已 PASS 內容、刪除必要內容或造成跨段引用失效。增量只修改該 spec，`git diff --check` 無錯。

4. **info** — spec:1101–1128, 1132–1165, 1222–1248：新增 M3 AC-7 及相關 AC/done command 在語法和時序上可執行。master `package.json` 已有 `build`、`test` 且含 vitest；`src/app/mock` 等路徑由相應 milestone 建立。M7 的 `gen:api` 也明確由 M7 修改 `package.json` 時建立。問題是 AC-7 覆蓋不足，不是命令不可執行。

## Rubric (a)：7 項裁決寫回

1. **faithful** — spec:76, 246–248, 267, 464–468：採 `${moduleId}.${name}` typed key，並以 module-id 前綴驗證落實。

2. **partial** — spec:77, 745–750, 1114–1118：忠實保留四個既有 API 前綴並要求絕對 URL，但只拒絕同源根目錄，未拒絕同源非根路徑，弱於「專用 origin」裁決。

3. **faithful** — spec:78, 721, 1139–1147：未帶 token 打 non-public operation 明定回 403。

4. **faithful** — spec:79, 725–738, 744：guard 使用 `getGrants(request)` 加 `can()`，保留 wildcard 支援。

5. **faithful** — spec:80, 478–483, 1226–1232：gen 期檢查格式及双向 `security: []` 規則；catalog membership 留在 build/vitest。

6. **faithful** — spec:81, 1114–1118, 1132–1149：M3 legacy operation 全為 `"public"`，M4 起使用 fail-closed 權限表。

7. **faithful** — spec:82, 478–480, 1298：`/admin/images` 使用保留 tag `core`，client/mock 手寫，orval 跳過 `core`。

## Rubric (c)：master 實測

結論：四個前綴 `/api`、`/users`、`/user`、`/admin` 正確。

- `src/services/mock/handlers.ts:124`：`POST /api/auth/login`
- `handlers.ts:142`：`GET /users`
- `handlers.ts:143–144`：`GET|PUT /user/me/profile`
- `handlers.ts:148–198`：`/admin` 下的 role、domain CRUD 與 images operations
- `src/services/api-client.ts:44,54`：base URL 來自環境變數或同源 origin，API path 經 `new URL(path, baseUrl)` 組合

因此 spec 將 owner inbox 漏列的 `/users` 補入實測清單是證據修正，不構成越權擴 scope。

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: 7f3a795de5ed768a461549052122d5f4b46927dd
REVIEWER: codex-oob