- **critical** — spec:217-226, 246-252, 308, 483-487, 574-597：API 權限中間格式違反 owner 裁決且無法完整組裝。Owner 明定 `OperationPermissions = Record<operationId, permission | "public">` 加 `OperationRoute[]`；spec 卻把 `"public"` 拆成另一個 `publicOperations` set。更嚴重的是 `TModule` 沒有 operation routes/public operations 欄位、`TRegistry` 也沒有 routes，§4.3 卻使用未定義的 `routes` 組 guard。因此 kernel 無法從 modules 建出 owner 要求的 fail-closed guard。應統一採 owner 指定格式，並在 module/registry/build 契約中加入及合併 `OperationRoute[]`。

- **critical** — spec:521-536：`guardedRoute` 被定義在 `shared/permission`，卻直接使用宣稱位於 `app/router` 的 `ForbiddenBoundary`。若 import 它會形成 `shared → app`，直接違反 D3 與 spec:167、719 的 domain-free boundary；不 import 則草案無法編譯。應由 app 注入 error component/boundary，或讓 shared 僅拋出 `ForbiddenError`、由 app router 負責捕捉。

- **warning** — spec:362-377, 799, 1032, 1117：spec 仍稱 api-chain PoC「尚未產出報告／待確認」，但 owner inbox 已提供完成報告並要求納入已知限制。Spec 沒有記錄三項指定風險：orval handler status 固定 200、MSW 3 的 `onUnhandledFrame`、fetch client 需要 mutator unwrap。這會讓 M2/M7 的設計與驗收漏掉已知整合風險。

- **warning** — spec:930-931：M3 AC-1 的命令不能驗證十個 `.use()`。`grep -c` 計算「含 match 的行數」而非 occurrence；依 spec:277-279 的鏈式排版會得到 `3`，不是 `10`。應改用逐 occurrence 計數，例如 `grep -o '\\.use(' ... | wc -l`。

- **warning** — spec:849, 1105, 1113：page-id 收集方式仍授權 M1 實作者自行選擇，但其中「新增 `pages` 欄位」會擴張 D2 已鎖定的 module contract。雖然 OQ-13 有 surface，正文卻允許 owner 裁決前實作擇一；M1 因此尚不具獨立 merge 所需的封閉契約。

- **warning** — spec:224, 289, 307, 836：module i18n 的資料形狀互相衝突。型別與 validation 要求每個 locale 已含頂層 module id，但合併流程又以 `{ [id]: dict }`／`scope(id, i18n)` 再包一層，可能形成 `orders.orders.*`。需明定 module 提供裸字典或已 scoped 字典，並讓型別、validation、merge pseudo code 一致。

- **info** — spec:52-91：抽查並逐段打開 master 上的路由、layout、nav、API/mock、schema、權限、i18n、測試設定與 domain-import anchors；所列行號及描述成立。`master` 也確為 `6029bf0e5f5e4e5317ce65015e0633ce7411943c`，指定 diff 僅包含該 spec。

REVIEW_VERDICT: FAIL
REVIEWED_COMMIT: 0e7b65bc51986d8df2be4e06513e5a9b44c052a2
REVIEWER: codex-oob