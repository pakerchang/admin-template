# T3 domain 型別錨定 Spec

狀態：**草稿，待 owner 裁決 OD-T3-1～7**。下方 AC / Touches / Done Command 依各 OD 的「建議」選項撰寫；owner 選了其他選項時，實作棒開工前先依該 OD 的「後果」欄修改對應 AC。

- 上位 spec：`docs/specs/typed-contracts-zod.spec.md`（以下稱「T1 spec」），本棒是其中「後續棒次」的 **T3 domain 型別錨定**，依據 OD-TYPE-3 = C（手寫 Zod 保留，在編譯期錨定到 orval 產物型別），以及 OD-TYPE-6 後果欄（users schema 與 YAML `UserRole` 要跟 `coreRoles` 保持一致）。
- 契約真相：repo 根目錄的 `openapi.yaml`（CLAUDE.md「API（M7 起）」）。本棒**不改 YAML 與 orval 產物**，只讓手寫層（`model/schema.ts`、mock seed、`createCollection`、users 角色 UI）在編譯期對齊產物。
- 基準：master `67a8aee`。下面的數字都是本棒起草時實測得到的：用 scratchpad 型別探針跑 `tsc --noEmit`（TypeScript 6.0.3、Zod 4.6.7、vitest `expectTypeOf`），加一個 vitest 執行期探針。探針放在 repo 外，沒有 commit。

## 1. 現況盤點

### 1.1 schema ↔ 產物型別（22 對，雙向實測）

判定方法：對每一對 schema 與產物型別，分別確認 `z.output<schema>` → 產物可以指派、產物 → `z.output<schema>` 可以指派，再做一次嚴格相等檢查（先把頂層交集攤平；原因見 §1.5 T3-K1）。

| module | schema（`model/schema.ts`） | 產物型別（`api/model`） | 結果 |
|---|---|---|---|
| articles | `articleSchema` | `Article` | 相等 |
| banners | `bannerSchema` | `Banner` | 相等 |
| consumers | `customerSchema` | `Customer` | 相等 |
| consumers | `orderDetailItemSchema` | `OrderItem` | 相等 |
| consumers | `transactionHistoryOrderSchema`（:50） | `Order` | **G1 落差**：兩個方向都不能指派 |
| consumers | `orderStatusEnum`（:66，3 值） | `OrderStatus`（7 值） | **G2 落差**：產物 → schema 失敗 |
| orders | `orderItemSchema` | `OrderItem` | 相等 |
| orders | `contactInfoSchema` | `ContactInfo` | 相等 |
| orders | `baseOrderSchema` | `Order` | **G3 落差**：產物 → schema 失敗 |
| orders | `orderStatusSchema`（:20，`z.enum(EOrderStatus)`） | `OrderStatus` | **G3 落差**：產物 → schema 失敗 |
| product | `productSchema` | `Product` | 相等 |
| product | `productTypeEnums` | `ProductType` | 相等 |
| suppliers | `supplierSchema` | `Supplier` | 相等 |
| suppliers | `createSupplierSchema` | `SupplierInput` | 相等 |
| suppliers | `updateSupplierSchema` | `UpdateSupplierBody` | 相等 |
| tags | `tagSchema` | `Tag` | 相等 |
| tags | `createTagSchema` | `CreateTagBody` | 相等 |
| tags | `deleteTagSchema` | `DeleteTagBody` | 相等 |
| team-members | `staffUserSchema` | `Staff` | 相等 |
| team-members | `createStaffUserSchema` | `StaffCreate` | 相等 |
| users | `userSchema` | `User` | 相等 |
| users | `userRoleEnum` | `UserRole` | 相等 |

小計：22 對中 **18 對相等、4 對有落差，歸成 3 個根因（G1～G3）**。auth module 沒有 `model/schema.ts`（只有產物 `LoginRequest` / `LoginResponse` / `UserRole`）。`updateTagSchema` 的形狀等於 `Tag`，沒有對應的產物 body 型別，所以沒有列入探針。

落差明細：

- **G1** consumers `transactionHistoryOrderSchema` 與 consumers `Order` 有三處不同：`order_status` 一邊是 `z.string()`，一邊是 `OrderStatus`（7 值 union）；`created_at` / `updated_at` 在 schema 必填、在 YAML 選填；`remark` 在 schema 選填、在 YAML 必填。
- **G2** consumers `orderStatusEnum` 只有 `pending | completed | cancelled` 三個值，YAML 有 7 個。除了定義它的 `schema.ts`，`orderStatusEnum` 與 `TOrderStatus` 在 consumers 裡**沒有其他引用**（grep 實測）。
- **G3** orders `orderStatusSchema = z.enum(EOrderStatus)`（`orders/model/schema.ts:5`、`:20`）。`EOrderStatus` 是 TS `enum`，值跟 YAML `OrderStatus` 的 7 個值完全相同，但 TS enum 是名義型別，所以產物的字面值 `"pending"` 無法指派給 `EOrderStatus`。反方向（enum → 字面值）可以。`EOrderStatus` 在 orders 有 7 個檔案在用（seed、`order-status.ts`、`order-status-tag.tsx`、`OrderList.tsx`、`EditDialogContent.tsx`、`StatusColumnFilter.tsx`、`use-order.ts`）。

**單向 `satisfies z.ZodType<產物>` 只抓得到 4 個落差中的 1 個**。實測：`baseOrderSchema satisfies z.ZodType<Order>` 通過，`orderStatusEnum` 單向通過，只有 G1 的 `order_status: string` 會被擋。單向 satisfies 只檢查 schema output 能否指派給產物，下列幾種狀況都漏掉：schema 多出欄位、schema 必填而產物選填、schema 的值域比產物窄、TS enum 名義型別。這是 OD-T3-1 的依據。

### 1.2 query / response schema（7 個）

- 6 個 query schema（`customerQuerySchema`、`transactionHistoryQuerySchema`、`productQuerySchema`、`tagQuerySchema`、`supplierQuerySchema`、`staffQuerySchema`）的 output → 對應的 `List*Params` **單向全部通過**。這些 schema 帶 `.default()`，output 的必填欄位比 Params 多，本來就是單向關係，不適合做雙向相等。
- `transactionHistoryResponseSchema`（consumers `:73`）與 `ListTransactionHistory200` **兩個方向都失敗**：缺 `error` 欄位，`data` 一邊必填、一邊選填。目前它只在 `consumers/model/use-consumer.ts:103` 被 `as TTransactionHistoryResponse | null` 強轉使用，落差被這個 cast 蓋住了。

### 1.3 mock seed 與 `createCollection`

- seed 陣列一共 **10 個**，分布在 9 個 `mocks/seed.ts`（consumers 有 `customers` 與 `transactions` 兩個；auth 的 `seed.ts` 只有 `DEMO_ACCOUNT`，不在範圍內），型別註記都是 `: T<Name>[]`，`T<Name>` 取自本 module 的 `model/schema` 推導型別，沒有一個對到產物型別。改成 `satisfies 產物[]` 實測：**9 個通過，1 個失敗**（consumers `transactions`，原因同 G1 的 `order_status: string`）。
- users seed 的角色寫成 `role: role as TUser["role"]`（`users/mocks/seed.ts:24`），seed 裡的角色 typo（例如 `"admn"`）因此**不會被編譯期擋下**。
- `createCollection`（`src/shared/api/mock-db.ts:83`）**沒有泛型**：簽章是 `seed: readonly object[], idKey: string`，內部轉成 `TRecord[]`，`all()` 回傳 `TRecord[]`。呼叫點共 **10 個**，全部沒有型別。`idKey` 或 `searchField` 打錯不會報錯；seed 換成別的形狀也不會報錯（T1 spec P5 的缺口）。users handlers 讀 collection 時要靠 `as` 收型別（`users/mocks/handlers.ts:33` 的 `as string | undefined`、`:87` 的 `as unknown as User`）。

### 1.4 角色一致性與 `EditUserRoleDialogContent`

- `coreRoles`（`src/app/mock/permission-matrix.ts:4`，T1 落地）、YAML `UserRole`（`openapi.yaml:1063`，orval 產出兩份：`users/api/model/userRole.ts` 與 `auth/api/model/userRole.ts`）、users `userRoleEnum`（`users/model/schema.ts:3`）三者**目前一致**：都是同樣的 7 個值，tsc 雙向指派實測通過。可是三者之間**沒有任何編譯期連結**，以後改了其中一份，另外兩份不會報錯。
- 依賴方向：module 不能 import `app`（`eslint.config.js` boundaries 的 policies），所以 users 不能直接引用 `coreRoles`。但 T1 已經把 `coreRoles` 經 `TRoleRegistry` augment 進 `shared/permission`，再匯出成 `TRole`（`src/shared/permission/types.ts:22`）。module 可以 import `shared`，所以錨定點用 `TRole`。
- **`EditUserRoleDialogContent` 的選項值與 `userRoleEnum` 不一致（已實測）**：
  - 靜態：`users/ui/components/EditUserRoleDialogContent.tsx:46-79` 寫死了 7 個 `RadioGroupItem`，值是 `new, user, vip, agent, cservice, admin, superadmin`；`:43` 用 `value as TUserRole` 強轉，tsc 因此沒有報錯。
  - 執行期探針（vitest，用 `userRoleEnum.safeParse` 逐值檢查，再呼叫 mock API）的實際輸出：`{"invalid":["new","vip","agent","cservice"],"missing":["guest","premium","partner","support"],"res":{"code":200,...,"data":{"role":"vip"}},"storedRole":"vip"}`。
  - 後果：7 個選項裡有 **4 個值不合法**；`guest / premium / partner / support` 這 **4 個角色在 UI 上選不到**。如果使用者原本的角色是這 4 個之一，對話框開啟時 `defaultValue` 對不到任何選項，畫面上沒有任何一項被選中。選了 `vip` 送出後，mock 回 200，並把 `"vip"` 寫進記憶體 collection；這個角色不在 grant 矩陣裡，該使用者重新登入後只會拿到空的 grants。mock 沒有驗證 request body（全專案的 mock 都沒有做 body 驗證）。
  - 標籤是寫死的中文字串（`新使用者`、`VIP會員`…），不經過 i18n。

### 1.5 實作注意（探針踩到的事）

- **T3-K1**：orval 會把 YAML 的 `allOf` 產成交集型別，例如 `Article = ArticleInput & {...}`，`Banner`、`Product`、`Supplier`、`UpdateSupplierBody` 也一樣。vitest `expectTypeOf<z.output<S>>().toEqualTypeOf<Article>()` 直接比較交集型別會**誤報不相等**（TS2554）。先用 `type Flat<T> = { [K in keyof T]: T[K] }` 把頂層攤平再比，就能正確判定相等（實測 exit 0）。G3 的名義 enum 差異在攤平後照樣會被擋下（實測）。

## 2. Owner Decisions

#### OD-T3-1 錨定斷言的形式

| 選項 | 內容 | 後果 |
|---|---|---|
| A 只用 `satisfies` | `model/schema.ts` 每個 schema 加 `satisfies z.ZodType<產物>` | 單向檢查，現有 4 個落差只擋得下 1 個（§1.1）；以後 schema 多欄位、選填變必填、值域變窄都不會報錯 |
| B 雙向型別測試 | 每個 module 新增 `src/modules/<id>/__tests__/schema-anchor.test.ts`，用 `expectTypeOf<z.output<S>>().toEqualTypeOf<Flat<P>>()`；`Flat` 放在 `src/test/type-utils.ts` | 4 個落差全擋；`__tests__/` 在 `tsconfig.app.json` 的 program 內，`pnpm build` 就會擋；`schema.ts` 本身不用動（相等的 18 對 0 行改動）；刪掉 module 時測試跟著消失，core-only 不受影響 |
| C A + B 並用 | 兩者都做 | 錯誤會在 schema 定義處就地顯示，但同一件事有兩套機制；擋得住的範圍跟 B 一樣 |

**建議：B**。OD-TYPE-3 C 的原文允許「或等價雙向相容斷言」。B 比 A 嚴格，只用一套機制，改動也最少。

#### OD-T3-2 落差 G1 / G2 / 1.2 response schema 以哪一邊為準

| 選項 | 內容 | 後果 |
|---|---|---|
| A 以 YAML 為準，改手寫 schema | G1：`transactionHistoryOrderSchema` 改成跟 consumers `Order` 相等（`order_status` 用 consumers 自己產物的 `OrderStatus`，`created_at` / `updated_at` 選填，`remark` 必填），`transactions` seed 跟著改；G2：刪掉沒人用的 `orderStatusEnum` / `TOrderStatus`；1.2：刪掉 `transactionHistoryResponseSchema` / `TTransactionHistoryResponse`，`use-consumer.ts:103` 的 cast 拿掉，直接用產物回傳型別 | 符合「契約真相是 `openapi.yaml`」；`OrderCard.tsx:38` 的 `dayjs(order.created_at)` 會碰到選填欄位，要處理 `undefined`（實作棒決定怎麼顯示，但不能用 `!` 硬壓） |
| B 以手寫 schema 為準，改 YAML | 改 `openapi.yaml` 再重跑 `gen:api` | 會動到契約與產物，超出 T3「只錨定、不改契約」的範圍；mock handler 也要跟著改 |

**建議：A**。

#### OD-T3-3 orders `EOrderStatus`（G3）

| 選項 | 內容 | 後果 |
|---|---|---|
| A 保留 TS enum，schema 改從產物取值 | `orderStatusSchema = z.enum(OrderStatus)`（orval 的 `as const` 物件，model → api 是允許的依賴方向），`baseOrderSchema` 因此等於 `Order`；另外加一條型別斷言 `` `${EOrderStatus}` `` ≡ `OrderStatus`，避免 enum 跟 YAML 脫節 | 7 個使用 `EOrderStatus` 的檔案都不用改（enum 成員可以指派給字面值 union）；改動只在 `orders/model/schema.ts` 加上錨定測試 |
| B 移除 TS enum | 7 個檔案改用產物的 `OrderStatus` 常數 | 全部收斂成單一來源，但 diff 大，而且型別錨定用不到這麼大的改動 |
| C 不修 | 只做單向錨定 | 跟 OD-T3-1 B 衝突（雙向測試會失敗） |

**建議：A**。

#### OD-T3-4 `EditUserRoleDialogContent` 選項不一致（§1.4）

| 選項 | 內容 | 後果 |
|---|---|---|
| A 在 T3 修，選項從 `userRoleEnum` 推導 | 選項改由 `userRoleEnum.options` 產生；標籤用 `Record<TUserRole, string>` 型別化對照表（少任何一個角色 tsc 就報錯），標籤文字沿用寫死的中文（i18n 歸 i18n scope 搬遷，本棒不動字典）；`onValueChange` 移除 `as TUserRole`，改用 `userRoleEnum.safeParse` 篩掉不合法的值；新增行為測試 | 角色清單變成單一來源，跟 §1.4 的錨定一起完成；改動限縮在一個元件加一個測試 |
| B 另開 bug 修正 spec | T3 只記錄問題 | 現況的功能錯誤（4 個角色選不到、可以寫入不合法的角色）繼續留著，等下一棒處理 |
| C 只改 4 個值 | 把字串改成合法值，cast 保留 | 修好現況，但以後再出現同樣的不一致仍然不會被擋 |

**建議：A**（OD-TYPE-6 後果欄點名的「角色列舉一致性錨定」，UI 是最後一個沒有錨定的地方）。

#### OD-T3-5 mock `updateUserRole` 要不要驗證 role

| 選項 | 內容 | 後果 |
|---|---|---|
| A 不驗證 | 維持現狀 | 全專案的 mock 都不驗證 body；OD-T3-4 A 落地後，前端在編譯期與執行期都送不出不合法的角色 |
| B 加 422 | 在 `users/mocks/handlers.ts` 手寫 `http.post`，role 不在 `userRoleEnum` 時回 422，排在 orval handler 前面（TRAPS K1） | 多一條手寫 handler 和一個測試；整個 mock 只有這一個地方會驗證 body |

**建議：A**（YAGNI；之後要讓 mock 全面驗證 body 時再一起做）。

#### OD-T3-6 orval 產 Zod（OD-TYPE-3 B）

| 選項 | 內容 | 後果 |
|---|---|---|
| A 列為 follow-up，本棒不評估也不實作 | 觸發條件：owner 希望 YAML 成為表單驗證規則的唯一來源 | T3 落地後，手寫 schema 與產物在編譯期相等，B 原本要解決的「靜默漂移」已經被 T3 擋住；B 剩下的價值只有「驗證規則單一來源」，前置條件是 YAML 先補齊 `minLength` / `pattern` 等規則（T1 spec P3：產物以 operation 為單位、規則不完整） |
| B 在 T3 內評估 | 本棒加一個 PoC | 擴大範圍；評估結論已經在 T1 spec P3 |

**建議：A**。

#### OD-T3-7 錨定範圍

| 選項 | 內容 | 後果 |
|---|---|---|
| A 只錨定 entity / body / enum schema（§1.1 的 22 對）與 seed / collection / 角色 | query schema 與 `ui/` 內的表單 schema（`useCreate*Schema`，含 i18n 訊息）不在範圍內 | 範圍跟 OD-TYPE-3 C 原文一致；6 個 query schema 現況單向通過（§1.2） |
| B 加上 query schema 的單向錨定 | 6 個 query schema 各補一條單向斷言 | 多 6 條斷言，可以防 Params 改名；目前沒有落差 |
| C 加上 `ui/` 表單 schema | 錨定到產物 body 型別 | 表單 schema 從 `.omit` / `.extend` 衍生，形狀本來就跟 body 不同（例如 `password` 確認欄位），要另外設計比對規則 |

**建議：A**，B 列為 follow-up。

## 3. 規格

### User Story

身為 admin-template 的開發者，`openapi.yaml` 調整欄位名稱、必填性或列舉值並重跑 `pnpm gen:api` 之後，手寫的 domain Zod schema、mock seed、mock collection 與角色選單只要跟產物對不上，`tsc`（`pnpm build`）就要失敗，而不是靜默通過，等到執行期才拿到錯誤形狀的資料，或寫進一個沒有任何權限的角色。

### Acceptance Criteria

型別測試沿用 T1 慣例：寫在 vitest `.test.ts` 裡，用 `expectTypeOf`；錯誤案例一律用 `// @ts-expect-error` 標記，若指令沒有觸發錯誤會得到 TS2578，tsc 就失敗，所以錯誤案例不可能空跑通過。一行放不下時，抽出型別別名，避免 prettier 折行後指令失效（TRAPS「`@ts-expect-error` 被 prettier 換行後失效」）。產物型別一律先用 `Flat` 攤平再比（T3-K1）。

- [ ] AC-1 [cmd] 雙向錨定（OD-T3-1 B）：9 個有 `model/schema.ts` 的 module 各新增 `src/modules/<id>/__tests__/schema-anchor.test.ts`，對 §1.1 表中屬於該 module 的每一對做 `expectTypeOf<z.output<typeof S>>().toEqualTypeOf<Flat<P>>()`，22 對全部要寫；`Flat` 定義在 `src/test/type-utils.ts`。驗收：`pnpm exec tsc -b tsconfig.app.json` exit 0，且 `ls src/modules/*/__tests__/schema-anchor.test.ts | wc -l` 輸出 `9`。
- [ ] AC-2 [cmd] 錨定不會空跑：`src/modules/tags/__tests__/schema-anchor.test.ts` 另外放 3 個 `@ts-expect-error` 反例，對象是 `Flat<Tag>`：(a) `tagSchema.extend({ extra: z.string() })`（schema 多欄位）、(b) `tagSchema.partial()`（必填變選填）、(c) 一個本地 TS enum 的 `z.enum` 與等值字面值 union 比較（G3 型態）。驗收：`pnpm exec tsc -b tsconfig.app.json` exit 0。
- [ ] AC-3 [cmd] 落差修正（OD-T3-2 A、OD-T3-3 A）：
  - G1：consumers `transactionHistoryOrderSchema` 等於 consumers `Order`，由 AC-1 的測試涵蓋；`ui/components/OrderCard.tsx` 處理 `created_at` 為 `undefined` 的情況，不可用 non-null assertion。
  - G2：`orderStatusEnum` / `TOrderStatus` 從 consumers `schema.ts` 移除。
  - 1.2：`transactionHistoryResponseSchema` / `TTransactionHistoryResponse` 移除，`use-consumer.ts` 不再強轉。
  - G3：`orders/model/schema.ts` 的 `orderStatusSchema` 改從產物 `OrderStatus` 取值；`src/modules/orders/__tests__/schema-anchor.test.ts` 加上 `` expectTypeOf<`${EOrderStatus}`>().toEqualTypeOf<OrderStatus>() ``。
  
  驗收：`pnpm exec tsc -b tsconfig.app.json` exit 0，且 `! grep -rnE "TTransactionHistoryResponse|transactionHistoryResponseSchema|orderStatusEnum" src/modules/consumers` exit 0。
- [ ] AC-4 [cmd] seed 錨定：10 個 seed 陣列都以 `satisfies <產物型別>[]` 收尾，產物型別從本 module 的 `../api/model` import；users seed 移除 `as TUser["role"]`，改成讓角色字面值保持字面型別（例如 tuple 加 `as const`），角色 typo 要能被 tsc 擋下。驗收：`grep -rhoE "satisfies [A-Za-z]+\[\]" src/modules/*/mocks/seed.ts | wc -l` 輸出 `10`、`! grep -n 'as TUser\["role"\]' src/modules/users/mocks/seed.ts` exit 0、`pnpm exec tsc -b tsconfig.app.json` exit 0。
- [ ] AC-5 [cmd] `createCollection` 泛型：簽章改成 `createCollection<T extends object>(seed: readonly T[], idKey: keyof T & string, opts?: { searchField?: keyof T & string })`，`all()` 回傳 `T[]`；執行期行為不變。型別測試寫在 `src/shared/api/__tests__/mock-db-types.test.ts`，只用本地型別，屬 core-safe。內容：`expectTypeOf(c.all()).toEqualTypeOf<T[]>()`；`@ts-expect-error` 反例有 idKey typo、searchField typo、seed 元素不符合顯式泛型 T 三種。10 個呼叫點都帶顯式產物型別泛型；users handlers 以 `all()` / `byId()` 的型別取代 `:33`、`:87` 的 `as`，body 欄位寫入時要先收窄。驗收：`grep -rhoE "createCollection<[A-Za-z]+>" src/modules/*/mocks/handlers.ts | wc -l` 輸出 `10`、`pnpm exec tsc -b tsconfig.app.json` exit 0、`pnpm exec vitest run src/shared/api src/modules/tags/mocks src/modules/users/mocks src/modules/orders/mocks src/modules/auth/mocks` exit 0。
- [ ] AC-6 [cmd] 角色一致性：`src/modules/users/__tests__/schema-anchor.test.ts` 斷言 `TUserRole`、`TRole`（`@/shared/permission`）、users 產物 `UserRole` 三者兩兩相等；新增 `src/modules/auth/__tests__/role-anchor.test.ts`，斷言 auth 產物 `UserRole` 等於 `TRole`。驗收：`pnpm exec tsc -b tsconfig.app.json` exit 0。
- [ ] AC-7 [test] 角色對話框（OD-T3-4 A）：新增 `src/modules/users/ui/components/__tests__/edit-user-role-dialog.test.tsx`，檢查三件事：(a) radio 值的集合等於 `userRoleEnum.options`（7 個）；(b) `defaultRole="support"` 時，該項處於選取狀態；(c) 改選 `partner` 後送出，`onSubmit` 收到 `"partner"`。驗收：`pnpm exec vitest run src/modules/users/ui/components/__tests__/edit-user-role-dialog.test.tsx` exit 0，且 `! grep -n "as TUserRole" src/modules/users/ui/components/EditUserRoleDialogContent.tsx` exit 0。
- [ ] AC-8 [cmd] 契約與產物不動：`git diff --exit-code $(git merge-base HEAD origin/master) -- openapi.yaml orval.config.ts src/app/operations.gen.ts src/app/mock/permission-matrix.ts 'src/modules/*/api' 'src/modules/*/mocks/*.msw.ts'` exit 0。
- [ ] AC-9 [cmd] 基線：`pnpm build && pnpm exec vitest run && pnpm verify:core-only` exit 0，且輸出含 `core-only build: OK`；`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` exit 0（boundaries：model → api、mocks → api 都是允許方向，不得新增 module → app 的 import）。

### Touches

- `src/test/type-utils.ts`（新增，放 `Flat`）
- `src/modules/{articles,banners,consumers,orders,product,suppliers,tags,team-members,users}/__tests__/schema-anchor.test.ts`（新增 9 檔）、`src/modules/auth/__tests__/role-anchor.test.ts`（新增）
- `src/modules/consumers/model/schema.ts`、`src/modules/consumers/model/use-consumer.ts`、`src/modules/consumers/ui/components/OrderCard.tsx`（G1 / G2 / 1.2）
- `src/modules/orders/model/schema.ts`（G3）
- `src/modules/*/mocks/seed.ts`（9 檔，10 個陣列）
- `src/modules/*/mocks/handlers.ts`（10 個 `createCollection` 呼叫點；users 移除 `as`）
- `src/shared/api/mock-db.ts`、`src/shared/api/__tests__/mock-db-types.test.ts`（新增）
- `src/modules/users/ui/components/EditUserRoleDialogContent.tsx`、`src/modules/users/ui/components/__tests__/edit-user-role-dialog.test.tsx`（新增）
- 其他 module 的 `model/schema.ts`：只有在 AC-1 實測出新落差時才改，並要在 PR 說明逐項列出
- `docs/specs/typed-contracts-t3.spec.md`（狀態、AC 勾選）

### Must-Not-Touch

- `openapi.yaml`、`orval.config.ts`、`src/modules/*/api/**`、`src/modules/*/mocks/*.msw.ts`、`src/app/operations.gen.ts`：契約與產物；本棒只讓手寫層對齊產物（OD-T3-2 A）
- `src/app/mock/permission-matrix.ts`（`coreRoles`、`coreGrants`）、`src/shared/permission/**`：T1 定稿，本棒只讀 `TRole`
- `src/shared/i18n/**`、`src/modules/*/locales/**`：角色標籤的 i18n 歸 i18n scope 搬遷
- `src/modules/*/ui/**` 內的表單 schema（`useCreate*Schema` 等）與各 query schema：OD-T3-7 A 範圍外
- `eslint.config.js`、`scripts/verify-core-only.sh`：新測試要嘛放在 module 內（core-only 時會跟著 module 一起刪除），要嘛屬 core-safe，不需要改清單
- users mock handler 的 role 驗證（OD-T3-5 A）

### Done Command

```bash
pnpm build && pnpm exec vitest run && pnpm verify:core-only && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && git diff --exit-code $(git merge-base HEAD origin/master) -- openapi.yaml orval.config.ts src/app/operations.gen.ts src/app/mock/permission-matrix.ts 'src/modules/*/api' 'src/modules/*/mocks/*.msw.ts' && test "$(ls src/modules/*/__tests__/schema-anchor.test.ts | wc -l | tr -d ' ')" = 9 && echo T3_DONE_OK
```
expected: 最後一行輸出 `T3_DONE_OK`（前面會有 `core-only build: OK`），exit 0

## 4. Follow-up（不在本棒）

- query schema 單向錨定（OD-T3-7 B）。
- orval 產 Zod（OD-T3-6 A 的觸發條件成立時再開）。
- mock body 驗證（OD-T3-5 B，要做就全專案一起做）。
- 角色標籤 i18n：`EditUserRoleDialogContent` 的寫死中文，歸 i18n scope 搬遷。
