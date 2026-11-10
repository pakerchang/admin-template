# i18n scope 搬遷 Spec

狀態：**已裁決（owner 2026-11-11），可派工**——OD-I18N-1～7 全部採建議方案：1A、2A（含刪除無引用的 117 個 key）、3A、4A、5A、6（70 個沿用 en 舊譯文 / 4 個新撰 / 硬寫中文另案）、7C

- 需求來源：`docs/specs/refactor/README.md` M6 follow-up「i18n 只搬了 en `users.*`；其餘 domain key（`pages.*`、`dashboard.menu.*`、`table.headers.*` 等，約 770 處 `t()`）與 nav label 尚未改成 `<id>.` scope，需改 key 名 + codemod，另案處理」，以及同表「`en.json` 比 zh 少 71 個 key」。
- 歸屬裁決：`docs/specs/typed-contracts-zod.spec.md` §3 與「明確排除」——**nav label 前綴強制**（module `<id>` 的 label 只能是 `<id>.*`）由 owner 2026-11-10 裁決歸本項；T2 只負責「label 是合法 `TransKey`」。`TranslationResources` augmentation 依 OD-I18N-1 = A（owner 2026-11-11）亦歸本項，typed-contracts spec 已同步。
- 上位 spec：`docs/specs/fsd-module-architecture.spec.md`（下稱「架構 spec」）§4.1（`TNavItem.label` 註解）、§4.3 步驟 4（kernel scope）、§5.4（i18n 型別、裸字典、augmentation）。本 spec 不改其 §0 鎖定決策。
- 基準：master `43c76a9`。盤點腳本放 session scratchpad、不進 repo；數字可用本文 §1 的定義重現。

## 1. 現況盤點（master `43c76a9`）

### 1.1 字典與載入路徑

| 項目 | 現況 | 出處 |
|---|---|---|
| core 字典 | `src/shared/i18n/locales/{en,zh}.json`，由 `shared/i18n/i18n.ts` 的 backend plugin 整份載入 | `src/shared/i18n/i18n.ts:10`、`types.ts:14` |
| module 字典 | 只有 `src/modules/users/locales/en.json`（7 個 leaf，`userForm.*`）；`users/index.ts:16` 宣告 `i18n: { en, zh: {} }` | |
| module 字典寫入 | `build()` 以 `{ [id]: dict }` scope 後與 core 深合併（core 既有 key 不被覆蓋），`createApp().mount()` 先 `loadLanguages` 再 `addResourceBundle` | `src/app/kernel/build.ts:205-215`、`create-app.tsx:61-66` |
| 裸字典檢查 | `assertI18nBare`：module 字典頂層含自己 id → throw | `build.ts:106-113` |
| `TransKey` | 只由 core `zh.json` 推導；`i18next.d.ts` 的 `TFunction` overload 只收 `TransKey` | `types.ts:25`、`i18next.d.ts:12-15` |
| fallback | `fallbackLng: zh` → en 缺 key 時畫面顯示中文 | `i18n.ts:38` |
| 既有測試 | `src/shared/i18n/__tests__/module-dictionaries.test.ts`：core 頂層不含 module id、module 字典為裸字典、kernel scope 正確 | |

### 1.2 key 數量與歸屬

歸屬判定（腳本）：在 `src/**/*.{ts,tsx}`（排除 `__tests__/`）掃字串字面值，與字典 leaf key 完全相等即算引用；template literal / 字串的靜態前綴（例 `` `pages.product.productTypes.${x}` ``）覆蓋其下所有 key；`shared/lib/gen-validate-message.ts` 的 `pages.${fieldPath}` 是透傳，不計（呼叫端字面值已計）。引用者以檔案所在 module（`src/modules/<id>/`）或 core 區（`app` / `shared` / `shells`）計。

| 指標 | 數字 |
|---|---|
| core 字典 leaf key | en 478、zh 489、聯集 552 |
| 只有一個 module 引用（→ 應搬入該 module） | **361**（product 72、articles 63、banners 45、consumers 40、orders 39、team-members 26、suppliers 25、tags 19、auth 17、users 15） |
| 只有 core 引用 | 39（`breadcrumb.*`、`lng.*`、`logout.*`、`dialog.imgUpload.*`、`unauthorized.*`、`table.pagination.*` 部分、`validation.image.*` / `number` / `text` 等） |
| core 與 module 共用 | 18（`common.cancel/delete/edit/error/success`、5 個 nav label `dashboard.menu.*`（`shared/ui/navbar/use-breadcrumb.ts` 也用）、`table.pagination.*`、`validation.image.*`、`validation.required.field`） |
| ≥2 個 module 共用、core 未引用 | 17（`common.create/submit/update`、`status.*` 7 個（orders + consumers）、`table.headers.actions/createdAt/updatedAt/order.actions`、`validation.editor.image.uploading`、`validation.email.invalid`、`validation.url.invalid`） |
| 無任何引用 | **117**（含下列 en 孤兒 63 個） |
| `t(` 呼叫（非測試） | 796 處 / 66 檔；第一個參數為字面值者 772 處 |
| 待搬 key 的字面值出現次數 | 非測試 549 處（product 141、articles 85、banners 66、orders 56、team-members 55、consumers 49、suppliers 43、tags 29、users 18、auth 7）；測試 59 處 / 11 檔 |
| 動態組 key 處 | `auth/ui/LoginPage.tsx`（`login.demo.roles.` / `descriptions.`）、product 5 檔（`pages.product.productCreate.` / `productTypes.` / `status.`、`tables.product.`）、`team-members/ui/TeamMemberList.tsx`（`staff.roles.`）、`product/model/routes.ts`、`shared/lib/gen-validate-message.ts`（`TFieldPath = Extract<TransKey, \`pages.${string}\`>`） |

nav label：9 個（8 個 module 頂層 + `orders` 子項 `orderList`），全部是 `dashboard.menu.<x>.title` 形式（`articles`、`banners`、`products`、`orders`、`suppliers`、`teamMembers`、`customers`、`tags`；`orders.sub.orderList`）；`users`、`auth` 無 nav。`shared/ui/navbar/use-breadcrumb.ts:38-62` 另以硬寫 key 讀 5 個 nav label 與 `dashboard.menu.users.title`、`dashboard.menu.orders.sub.batchOrders`（架構主線 README 另一條 follow-up）。

### 1.3 en / zh 互缺

| 方向 | 數量 | 內容 |
|---|---|---|
| zh 有、en 缺 | **74** | `pages.supplier.*` 24、`pages.banner.*` 23、`pages.tag.*` 19、`pages.users.userForm.*` 7、`validation.email.invalid` 1；其中 **60 個有程式引用**（en 畫面 fallback 成中文），14 個無引用 |
| en 有、zh 缺 | **63** | `banner.*` 20、`supplier.*` 24、`tag.*` 19——**全部無引用**，是 en 留在舊路徑（無 `pages.` 前綴）的孤兒 |

對應關係：zh 缺的 74 個中，**70 個在 en 的舊路徑有對應譯文**（`pages.<x>.…` ↔ en `<x>.…` 63 個；`pages.users.userForm.*` ↔ `users/locales/en.json` 的 `userForm.*` 7 個——後者 UI 引用的是 `pages.users.userForm.*`，`users.userForm.*` 實際沒被用到）。**完全沒有 en 譯文的只有 4 個**：`pages.banner.confirmDelete`、`pages.banner.deleteConfirm`、`pages.banner.deleteDescription`、`validation.email.invalid`。

### 1.4 硬寫中文字串（非 i18n）

非測試 `.ts/.tsx` 中含中文的字串字面值 / JSX 文字：**75 處 / 17 檔**。

| 類別 | 處 | 檔 |
|---|---|---|
| mock seed 資料（不是 UI 文案） | 20 | `product/mocks/seed.ts` |
| module toast / 錯誤訊息 | 19 | `team-members/model/use-staff.ts` 13、`articles/model/use-article.ts` 4、`consumers/model/use-consumer.ts` 2 |
| module UI 文案 | 11 | `users/ui/components/EditUserRoleDialogContent.tsx` 9、`tags/model/use-tag.ts` 1、`product/ui/ProductDraftForm.tsx` 1（`（複製）`） |
| banners 圖片驗證規則訊息 | 16 | `banners/model/image-validation/*.rule.ts` |
| core 圖片驗證訊息 | 7 | `shared/lib/image-validation/**` |
| shell | 2 | `shells/default/app-sidebar.tsx`（語言切換「中文」「語言」） |

## 2. 設計原則

- **歸屬依引用者決定，不依語意**：只被一個 module 引用的 key 搬進該 module；被 core（`app` / `shared` / `shells`）引用或被 ≥2 個 module 引用的留 core（OD-I18N-3）。判準可由測試機械檢查。
- **行為不變**：搬遷後每個被引用的 key，zh 值與搬遷前逐字相同；en 值與搬遷前相同，或為 §1.3 補齊的譯文。畫面文字只在「en 原本 fallback 成中文」處改變（變成英文）。
- **D4（拔 module）對齊**：domain 文案隨 module 目錄移除；core 字典不得殘留只屬某個 module 的 key。
- **型別不退步**：`t()` 寫錯 key 仍在 `tsc` 失敗（module key 以架構 spec §5.4 augmentation 進 `TransKey`，OD-I18N-1）。

### User Story

身為 admin-template 的開發者，我要每個 module 的文案住在自己的 `modules/<id>/locales/{en,zh}.json`、全域 key 一律是 `<id>.*`、nav label 只能是自己 module 的 key；core 字典只剩真正共用的文案；en 與 zh 的 key 集合相同。這樣拔掉一個 module，它的文案跟著消失、不殘留在 core；換語系時不再出現 fallback 的中文。

### Milestones

依 OD-I18N-5 = A（owner 2026-11-11 裁決：單棒單 PR）。done 基線：`pnpm build && pnpm exec vitest run && pnpm verify:core-only` exit 0。

- **I1 scope 搬遷（單棒）**：
  1. 型別前置（OD-I18N-1 A）：`shared/i18n/types.ts` 落地 `TranslationResources` 擴充介面，`TransKey = RecursiveKeyOf<typeof coreZh & TranslationResources>`；每個有字典的 module 以 `modules/<id>/locales/augment.d.ts`（或等價檔）augment `{ <id>: typeof zh }`（架構 spec §5.4 原樣）。
  2. key 對照表（OD-I18N-2 A、OD-I18N-3 A）：依 §1.2 判準與 OD-I18N-2 A 命名規則產生 old → new 對照，存成測試 fixture（AC-6）。
  3. codemod（OD-I18N-4 A）：依對照表改寫非測試與測試碼的字串字面值；動態組 key 的 7 處與 `gen-validate-message.ts` 的 `TFieldPath` 手改。
  4. 字典搬移：361 個 module key（含 9 個 nav label）從 core `en.json` / `zh.json` 移到 `modules/<id>/locales/{en,zh}.json`（裸字典），`defineModule({ i18n: { en, zh } })`；`users/locales/en.json` 既有 `userForm.*` 與 UI 改用的 key 對齊。
  5. 補齊互缺（OD-I18N-6）：70 個 en 譯文從 en 舊路徑搬到新路徑；4 個無譯文的補英文；無引用的 117 個 key（含 63 個 en 孤兒）依 OD-I18N-2 裁決從 core en / zh 字典刪除。
  6. nav label 前綴強制（OD-I18N-7 = C，本棒落 A）：`build()` 新增檢查——module `<id>` 的每個 nav 項目（含 `children`）`label` 必須以 `<id>.` 開頭，否則 throw（同 `assertI18nBare` 形式）。
  7. 測試掛載 module 字典：測試環境的 i18next 能讀到 module 字典（例：`src/test/` 提供 helper，或 setup 以 registry 寫入），原以畫面文字斷言的測試照過。

### Acceptance Criteria

#### I1 scope 搬遷

- [ ] AC-1 [cmd] 歸屬：新增 `src/shared/i18n/__tests__/key-ownership.test.ts`，以 `import.meta.glob("/src/**/*.{ts,tsx}", { query: "?raw" })`（排除 `__tests__`）掃字串字面值（判準同 §1.2，動態前綴以測試內白名單列出），斷言 (a) `src/modules/<id>/**` 引用的每個 key 不是 `<id>.*` 就必須存在於 core 字典；(b) 不存在「只被單一 module 引用」的 core key；(c) core 字典與每個 module 字典都沒有無引用的 key（OD-I18N-2 裁決刪除無引用 key）。此測試只讀檔案系統與 core 字典，不寫死 module id，core-safe。`pnpm exec vitest run src/shared/i18n/__tests__/key-ownership.test.ts` exit 0。
- [ ] AC-2 [cmd] en / zh 對齊：同檔或 `module-dictionaries.test.ts` 新增案例，斷言 core 字典 en / zh 的 leaf key 集合相等，且每個 `modules/*/locales/` 的 en / zh leaf key 集合相等（每個有字典的 module 兩個語系檔都存在）。`pnpm exec vitest run src/shared/i18n/__tests__/` exit 0。
- [ ] AC-3 [cmd] nav label 前綴：`build()` 對 module `<id>` 的 nav（含 `children`）label 不以 `<id>.` 開頭時 throw，錯誤訊息含 module id 與 label；案例寫在 `src/app/kernel/__tests__/build.test.ts`（一個違規 → throw、全部合法 → 不 throw）。另斷言實際 10 個 module 的 nav label 全部以自身 id 開頭且在 `registry.i18n.zh` / `.en` 可解析為字串（寫在 `src/app/__tests__/` 下的既有或新測試檔，引用完整安裝 → 補進 `scripts/verify-core-only.sh` 的 `FULL_INSTALL_TESTS`，除非檔案已被 domain 字面值 grep 排除）。`pnpm exec vitest run src/app/kernel/__tests__/build.test.ts` exit 0。
- [ ] AC-4 [cmd] 型別：module key 進 `TransKey`。型別測試 `src/modules/tags/__tests__/i18n-types.test.ts` 以 `expectTypeOf` / `// @ts-expect-error` 鎖住：`t("tags.<存在的 key>")` 合法；`t("tags.<typo>")`、搬遷前的舊 key（例 `pages.tag.addTag`）`tsc` 失敗；core key（例 `common.cancel`）合法。`pnpm exec tsc -b tsconfig.app.json` exit 0。
- [ ] AC-5 [cmd] core-only：`pnpm verify:core-only` exit 0、輸出含 `core-only build: OK`（拔掉 7 個 domain module 後 `TransKey` 只含 core 與 generic module 的 key，build 照過）。
- [ ] AC-6 [cmd] 行為不變（值）：對照表 fixture `src/shared/i18n/__tests__/fixtures/scope-keymap.json`（每列 `{ old, new, zh, en }`，`zh` / `en` 為 `43c76a9` 時該 old key 的值；en 原本缺的 70 列填 en 舊路徑譯文、4 列填新譯文並標 `"enSource": "new"`）由 codemod 產生；`src/shared/i18n/__tests__/scope-migration.test.ts` 以 `makeApp().build().registry.i18n` 斷言每列 `zh[new] === zh`、`en[new] === en`。此檔引用 domain key → 補進 `FULL_INSTALL_TESTS`（若未被 grep 排除）。`pnpm exec vitest run src/shared/i18n/__tests__/scope-migration.test.ts` exit 0。
- [ ] AC-7 [cmd] 舊 key 歸零：`git grep -nE "[\"'\`](pages|dashboard\.menu|staff|consumer|login|toast\.(banner|article|order|product|user)|table\.headers\.(article|order|product|supplier|tag|user))\." -- 'src/**/*.ts' 'src/**/*.tsx'` 只剩對照表判定留 core 的 key（實作棒把預期殘留清單寫進交付報告；理想為 0 筆）；`git grep -n "dashboard.menu" -- src/modules` 0 筆。
- [ ] AC-8 [cmd] 既有行為：`pnpm build && pnpm exec vitest run` exit 0；原以畫面文字（中文）斷言的測試不改斷言文字即通過（只允許改 key 字面值與測試的字典掛載方式）。
- [ ] AC-9 [cmd] `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` 0 error（boundaries 規則不放寬）。
- [ ] AC-10 [manual] 瀏覽器 zh / en 各走 17 條路由，畫面文字與 `43c76a9` 逐字相同；例外只有 en 原本顯示中文 fallback 的地方（suppliers、tags、banners 頁、user 編輯表單）改為英文。agent 驗收後記錄於交付報告；**owner 親驗 pending，不阻擋交付**（同 M6 AC-6 慣例）。

承諾 → AC 對照：歸屬判準（AC-1）；en / zh 補齊（AC-2、AC-6）；nav label 前綴強制（AC-3）；型別（AC-4）；D4 拔 module（AC-5）；行為不變（AC-6、AC-8、AC-10）；codemod 完整（AC-7）。

### Touches

- `src/shared/i18n/locales/{en,zh}.json`（移出 module key、補齊、刪除無引用的 117 個 key）
- `src/shared/i18n/types.ts`（`TranslationResources`、`TransKey`）；`src/shared/i18n/i18next.d.ts`（若 overload 需調整）
- `src/shared/i18n/__tests__/`（`key-ownership.test.ts`、`scope-migration.test.ts`、`fixtures/scope-keymap.json`、`module-dictionaries.test.ts` 新增案例）
- `src/modules/<id>/locales/{en,zh}.json` 與 augmentation 檔（10 個 module）；`src/modules/<id>/index.ts`（`i18n`、nav `label`）
- `src/modules/<id>/**/*.{ts,tsx}` 與其 `__tests__/`（key 字面值、動態組 key 前綴）；`src/modules/tags/__tests__/i18n-types.test.ts`（新增）
- `src/shared/lib/gen-validate-message.ts`（`TFieldPath`）；`src/shared/ui/navbar/use-breadcrumb.ts`（只換 key 字面值）
- `src/app/kernel/build.ts`（nav label 前綴檢查）與 `src/app/kernel/__tests__/build.test.ts`；`src/app/__tests__/` 的 nav label 完整安裝斷言
- `src/test/`（測試字典掛載 helper / setup）及需要它的測試檔
- `scripts/verify-core-only.sh`（`FULL_INSTALL_TESTS` 補新增的完整安裝型測試）
- `.claude/skills/add-module/`（module 文案放 `locales/`、nav label `<id>.*`、augmentation）、`CLAUDE.md` i18n 段、`docs/TRAPS.md`（若出現新陷阱）、`docs/specs/refactor/README.md`（M6 follow-up 該列與「en 少 71 個 key」列標記完成）

### Must-Not-Touch

- 架構 spec 本體與其 §0 鎖定決策；`build()` 既有執行期檢查（含 `assertI18nBare`、core key 不被 module 覆蓋）不得移除
- `openapi.yaml`、`orval.config.ts`；orval 產物（`src/modules/*/api/**`、`*.msw.ts`）不手改
- zh 文案內容（只搬位置，不改字）；en 既有譯文內容（只搬位置）；新增譯文只限 §1.3 的 4 個
- 不新增 module；`app/modules.ts` 的 `.use(` 數量不變；`kind` 不變
- §1.4 硬寫中文字串（OD-I18N-6 裁決不在本棒，另案；實作棒在 `docs/specs/refactor/README.md` follow-up 新增一列）
- `use-breadcrumb.ts` 改由 route `staticData.breadcrumb` 驅動（另一條 follow-up）；shell `app-sidebar.tsx` 的 `as TransKey` 強轉移除（T2）
- T2 其餘範圍（module id / route id / nav `to` registry、`TNavItem.label: TransKey`）

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm exec vitest run src/shared/i18n/__tests__/ src/app/kernel/__tests__/build.test.ts && pnpm verify:core-only
```

expected: exit 0；輸出含 `core-only build: OK`

### Owner Decisions

每點附選項、後果與建議。**全部已裁決（owner 2026-11-11），皆採建議方案**；Milestones / AC / Touches 已對齊。

#### OD-I18N-1 型別前置：`TranslationResources` augmentation 放哪一棒

前提：`i18next.d.ts` 的 `TFunction` 只收 `TransKey`，而 `TransKey` 只由 core `zh.json` 推導。key 一旦移出 core 字典，模組內 549 處字面值全部 `tsc` 失敗——**沒有 augmentation，本 spec 無法單獨落地**。但 typed-contracts spec 把「`i18n` 字典 `TranslationResources` augmentation（架構 spec §5.4 落地）」列在 T2（spec 間的範圍交疊，surface 給 owner）。

| 選項 | 內容 | 後果 |
|---|---|---|
| A 本棒先做 augmentation | I1 第 1 步落地 §5.4 原樣的 `TranslationResources` + per-module augment；T2 的 i18n 部分縮為「`TNavItem.label: TransKey`、去掉 shell 強轉」 | 本 spec 自足；需同步改 typed-contracts spec「後續棒次 T2」一句 |
| B 等 T2 先做 | 本 spec 排在 T2 之後，I1 不碰型別 | T2 要先處理一個幾乎只有 `users` 有字典的狀態，augmentation 驗不到實際規模；本 spec 被 T2 整棒卡住 |
| C 暫時放寬 | `TransKey` 暫加 `` `${string}.${string}` `` | 搬遷期間 typo 不再被 `tsc` 擋，違反「型別不退步」 |

已裁決（owner 2026-11-11）：**A**。

**建議：A**。augmentation 本身小（types.ts 一處 + 每 module 一個 d.ts），且是搬遷的必要條件；放在這裡可以用 10 個 module 的實際字典驗證。

#### OD-I18N-2 key 命名規則

| 選項 | 例（`pages.banner.bannerCreate.title`、`toast.banner.create.success`、`dashboard.menu.banners.title`） | 後果 |
|---|---|---|
| A 去掉 domain 段、保留其餘路徑 | `banners.bannerCreate.title`、`banners.toast.create.success`、`banners.nav.title` | 規則可機械套用（去 `pages.<x>.` / `<x>.` / `dashboard.menu.<x>.` 前綴，其他頂層如 `toast` / `table.headers` / `validation` 去掉 domain 段後保留類別名）；key 變短；nav label 統一為 `<id>.nav.title`（orders 子項 `orders.nav.orderList`） |
| B 原路徑整段搬到 `<id>.` 下 | `banners.pages.banner.bannerCreate.title` | codemod 最簡單；key 冗長且重複 domain 名，失去搬遷的整理價值 |
| C 重新設計分區 | `banners.list.*` / `banners.form.*` / `banners.toast.*` | 最整齊；需逐 key 人工判斷，361 個 key 無法機械產生，review 成本高 |

已裁決（owner 2026-11-11）：**A**，且刪除無引用的 117 個 key（含 en 孤兒 63 個），AC-1 (c) 保留。

**建議：A**。對照表由規則產生、可審；nav label 固定 `<id>.nav.*` 讓前綴檢查（AC-3）與 T2 補全一致。

附帶：**無引用的 key（117 個，含 en 孤兒 63）是否刪除**——建議刪除（AC-1 (c) 守住不再累積）；風險是漏判動態 key，已由 §1.2 的動態前綴掃描與 AC-8 全量測試兜底。若 owner 想保守，改為「只刪 en 孤兒 63 個」，AC-1 (c) 拿掉。

#### OD-I18N-3 共用 key 留 core 的判準

| 選項 | 內容 | 後果 |
|---|---|---|
| A 引用者判準 | 被 core 引用或被 ≥2 個 module 引用 → 留 core；只被一個 module 引用 → 搬（即使語意通用，如 `common.noData` 只有 articles 用 → `articles.common.noData`） | 機械、可測（AC-1）；留 core 74 個。代價：之後第二個 module 想用同一字，要把 key 移回 core |
| B 語意判準 | 通用詞（`common.*`、`status.*`、`table.pagination.*`、`validation.*` 通用規則）一律留 core，其他依引用者 | 比較符合直覺；但「通用」要人判，AC-1 只能以白名單表達 |
| C A + 頂層白名單 | A 為主，`common.*` 整個頂層固定留 core | `common.createArticle`、`common.insert`、`common.noData` 留 core；其餘同 A |

已裁決（owner 2026-11-11）：**A**。

**建議：A**。另需注意 `status.*`（orders + consumers 共用）依 A 留 core——core 字典會留有訂單狀態文案；consumers 沒有 `requires: ["orders"]`，若要搬進 orders 須先改依賴，不在本 spec。

#### OD-I18N-4 codemod 工具

| 選項 | 內容 | 後果 |
|---|---|---|
| A 一次性腳本 + 對照表 | Node / tsx 腳本讀對照表，只替換「整個字串字面值等於 old key」的出現處（key 是帶點號的唯一字串，誤傷面小）；動態前綴 7 處手改；腳本放 scratchpad 不進 repo，對照表以 fixture 進 repo（AC-6） | 最少程式碼；對照表本身就是 review 物件 |
| B ast-grep 規則 | 每個 key 一條 rewrite rule，或 YAML 規則 + 外部對照 | 結構精準，但 361 條規則或需外掛腳本，與 A 等價卻更長 |
| C 手改 | 逐檔編輯 | 549 + 59 處，漏改由 `tsc` 抓但成本高 |

已裁決（owner 2026-11-11）：**A**。

**建議：A**。ast-grep 用來**查**殘留（`t($KEY)` 的非字面值呼叫）即可，不用來改。

#### OD-I18N-5 是否分棒

| 選項 | 內容 | 後果 |
|---|---|---|
| A 單棒單 PR | 10 個 module 同棒搬完 | diff 大（約 600 處字面值 + 字典），但 key-ownership / 對齊測試只需寫一次且一次到位；中途不存在「一半 module 已 scope」的混合狀態 |
| B 每 module 一棒 | 10 個 PR | 每 PR 小；AC-1 (b) 在全部搬完前會失敗，需暫時白名單；共用 key 判準要在第一棒就定死 |
| C 兩棒 | I1a 型別前置 + 互缺補齊（不動 key 名）；I1b 全量搬遷 | I1a 可先修 en fallback 中文的可見缺陷；但補齊的 70 個 key 會在 I1b 再搬一次 |

已裁決（owner 2026-11-11）：**A**。

**建議：A**。改動幾乎全是機械替換，由 `tsc` + AC-6 對照表測試完整兜底；拆棒反而要維護過渡白名單。

#### OD-I18N-6 缺翻譯的來源與硬寫中文範圍

已裁決（owner 2026-11-11）：三個子題皆採建議——70 個沿用 en 舊路徑譯文（A）、4 個由實作棒撰寫並標 `"enSource": "new"`（A）、§1.4 硬寫中文不在本 spec（A）。

| 子題 | 選項 | 建議 |
|---|---|---|
| 70 個 en 有舊路徑譯文的 key | A 沿用 en 舊路徑譯文 / B 重譯 | **A**：既有譯文，不改字 |
| 4 個完全無 en 譯文的 key（`pages.banner.confirmDelete` / `deleteConfirm` / `deleteDescription`、`validation.email.invalid`） | A 實作棒參照同類 key（`pages.tag.*` 的 en 對應）撰寫，fixture 標 `"enSource": "new"` 供 review / B owner 提供 | **A**：同類 key 有現成句型，交付報告逐條列出 |
| §1.4 硬寫中文（不含 seed 共 55 處 / 16 檔） | A 不在本 spec（另案）/ B 納入（新增 key + en 譯文） | **A**：本 spec 是「搬位置不改字」，納入會新增約 55 個 key 與譯文、改到 `shared/lib/image-validation` 的錯誤訊息機制；建議在 README follow-up 新增一列 |

#### OD-I18N-7 nav label 前綴的強制層級

| 選項 | 內容 | 後果 |
|---|---|---|
| A 執行期 `build()` throw + 測試 | 同 `assertI18nBare` 形式；`pnpm build` 不擋、vitest / 啟動時擋 | 現在就能做；與 T1 前的權限檢查同級 |
| B 型別層 | `label: \`${Id}.${string}\``，需 module id 泛型 | 需要 T2 的 module id registry，本 spec 做不到 |
| C A 現在做，B 留給 T2 | 本 spec 落 A；T2 的 `TNavItem.label: TransKey` 若能帶 module id 泛型再收窄 | 不卡 T2 |

已裁決（owner 2026-11-11）：**C**（本 spec 範圍即 A，型別層收窄留給 T2）。

**建議：C**（本 spec 範圍即 A）。
