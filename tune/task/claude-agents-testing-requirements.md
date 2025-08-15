# Claude Agents 簡化測試需求

## 🎯 測試目標
**測試三個 Claude agents 是否能協作完成一個簡單的 React 組件開發任務**

## 📝 測試任務：SimpleButton 組件

### User Story
**作為** 開發者  
**我需要** 一個可重用的按鈕組件  
**以便** 在 admin dashboard 中保持一致的 UI 風格

### 技術要求
- **位置**：`src/components/ui/SimpleButton.tsx`
- **技術**：React + TypeScript + Tailwind CSS
- **功能**：支援不同尺寸 (sm, md, lg) 和樣式 (primary, secondary)

## 🤖 三個 Agents 測試流程

### Phase 1: docs-agent 測試
**輸入**：上述 User Story  
**期待**：產出組件開發文件  
**驗證點**：
- ✅ 建立技術規格文件
- ✅ 定義 TypeScript 介面
- ✅ 規劃實現步驟

### Phase 2: dev-agent 測試  
**輸入**：docs-agent 的文件  
**期待**：實現 SimpleButton 組件  
**驗證點**：
- ✅ 創建組件檔案
- ✅ 實現所需功能
- ✅ 通過 TypeScript 檢查

#### 開發計畫
**Phase 1: 組件核心實現**
- [x] **Phase 1.1**: 分析專案 UI 架構並設計 TypeScript 介面 - Completed on 2025-08-15
- [x] **Phase 1.2**: 實現 SimpleButton 組件基礎結構與樣式系統 - Completed on 2025-08-15  
- [x] **Phase 1.3**: 實現尺寸變體 (sm/md/lg) 與樣式變體 (primary/secondary) - Completed on 2025-08-15

**Phase 2: 測試與品質保證**
- **Phase 2.1**: 建立測試檔案並驗證功能
- **Phase 2.2**: 執行品質檢查 (lint/test/build)
- **Phase 2.3**: 建立使用範例與文件

**技術規格**：
- 位置：`src/components/ui/SimpleButton.tsx`
- 基於 shadcn/ui 設計系統，使用 CVA 樣式管理
- 支援 React.forwardRef 和完整 TypeScript 型別定義

### Phase 3: context-agent 測試
**輸入**：已完成的開發狀態  
**期待**：分析實現結果  
**驗證點**：
- ✅ 識別實現進度
- ✅ 檢查文件與代碼一致性
- ✅ 提供完成狀態報告

## 📊 成功標準
- 三個 agents 順利完成各自任務
- 最終產出可用的 SimpleButton 組件
- 每個階段的交接順暢無誤

## 🚀 執行方式
1. 使用 `@agent-docs-agent` 開始需求分析
2. 使用 `@agent-dev-agent` 進行組件開發  
3. 使用 `@agent-context-agent` 進行最終驗證

---
**簡化版本** - 2025-08-15  
**測試重點**：三 agents 基本協作能力驗證