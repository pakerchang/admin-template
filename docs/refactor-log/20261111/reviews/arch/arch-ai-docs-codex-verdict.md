## Findings

1. **warning** — `.claude/skills/add-module/SKILL.md:23`：M3–M7 過渡期指引不完整且範圍過廣。M3 到 M6 之間，新增 module 的頁面 UI、schema/model 等檔案同樣沒有明確落點，文件卻只列 `api/`、`mocks/`、`locales/`；反之 M6 落地後，spec §9 M6（L1194–1212）已明定 `model/ui/mocks/locales` 的位置，不應仍一概標成未定。應按 M3–M5、M6、M7 分期，所有未定落點都要求先問 owner。

2. **warning** — `docs/TRAPS.md:3,26-65`：第 4–9 條被統稱為「本 repo 已知陷阱」，但實際證據是目標 spec／PoC 風險，尚無本 repo 重構返工紀錄；部分甚至明載待 M7 首次驗證。來源行號本身皆可查證，但文件應明確區分「已在 master 發生」與「spec/PoC 預警、待 milestone 驗證」，不能把後者寫成已發生的 repo 經驗。

3. **warning** — `CLAUDE.md:24,37`：新增的第 37 行宣稱上方全部是 master 現況，但第 24 行稱 `src/locales/`「只有 `en.json`、`zh.json`」不正確；master 同目錄另有 `i18n.ts`、`types.ts`。應改成「語系字典為 `en.json`、`zh.json`」或列出其餘檔案。

4. **warning** — `CLAUDE.md:58`、`.claude/skills/add-module/SKILL.md:83-87`：文件引用 §7.2 的 boundaries lint，卻沒有保留該節的重要待定事項。Spec L811 明載設定使用 `rules` 還是 `policies`、以及 element 比對順序，要到 M5 AC-1 實測；AI-facing 文件應明示這部分待 M5 驗證，不得照草案直接定案。

## Rubric 結論

- **(a)** 大部分契約與 §／行號引用正確；未發現憑空新增的架構契約，但過渡期與 §7.2 待定範圍表達不精確。
- **(b)** 目標架構有清楚標成尚未落地，但 CLAUDE.md 對 master 的 locale 現況有一處錯誤。
- **(c)** 兩個 skill frontmatter 均只有 `name`、`description`，觸發描述清楚、主要 milestone 與操作步驟正確；add-module 的 M3–M7 過渡指引需修正。
- **(d)** TRAPS 全部採「症狀／真因／禁令」格式，引用均能查證；但第 4–9 條應標為尚未有 repo 返工紀錄的未來風險。
- **(e)** diff 恰好只有指定四個路徑，未建立 `.claude/agents/`、`.claude/rules/`，也未納入 `settings.local.json`。
- **(f)** 權限衝突有正確要求先問 owner；新 module 過渡落點僅部分處理，TRAPS 第 4–9 條與 boundaries key 的待定性未充分 surface。

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: 54b975a94256c9d482b218b8bab46997a4a5d501
REVIEWER: codex-oob