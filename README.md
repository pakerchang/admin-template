# Admin Dashboard Framework

一個現代化的通用後台管理系統框架，基於 React 19、TypeScript 和現代化技術棧構建。提供完整的權限管理、國際化支援、響應式設計等企業級功能。

## ✨ 特色功能

### 🔐 完整權限系統
- 基於角色的存取控制 (RBAC)
- 全域權限快取與預載入
- 細粒度權限檢查
- 支援多種使用者角色：admin、superadmin、partner、premium、user、guest、support

### 🌍 國際化支援
- 支援繁體中文、英文
- 完整的多語言切換功能
- 所有 UI 元件都支援國際化

### 📱 響應式設計
- 現代化的 UI/UX 設計
- 支援桌面端和移動端
- 暗色模式支援
- 基於 Tailwind CSS 的設計系統

### 🔧 技術架構
- **前端框架**: React 19 + TypeScript
- **路由系統**: TanStack Router 
- **狀態管理**: TanStack Query + React Hook Form 
- **驗證系統**: 自製登入頁 + mock 登入 API（純 UI 展示，無真實後端）
- **UI 框架**: Tailwind CSS + Radix UI + shadcn/ui
- **測試框架**: Vitest + Testing Library
- **建置工具**: Vite
- **套件管理**: pnpm

## 🚀 快速開始

### 環境需求
- Node.js 18+
- pnpm 8+

### 安裝依賴
```bash
pnpm install
```

### 設定環境變數
```bash
cp .env.example .env
```

`.env` 為選用（不建立也能直接 `pnpm dev`）：
- `VITE_API_BASE_URL`: API 基礎 URL（目前資料由本地 mock 回應，僅接真後端時需要）

展示帳號：`admin@example.com` / `admin123`

### 開發伺服器
```bash
pnpm dev
```

### 建置專案
```bash
pnpm build
```

### 執行測試
```bash
pnpm test
```

### 程式碼檢查
```bash
pnpm lint
```

## 📂 專案結構

```
src/
├── components/           # 可重用 UI 元件
│   ├── layouts/         # 布局元件
│   ├── shared/          # 業務共用元件
│   └── ui/              # 基礎 UI 元件 (shadcn/ui)
├── pages/               # 功能頁面
│   ├── banners/         # 橫幅管理
│   ├── orders/          # 訂單管理
│   ├── product/         # 商品管理
│   ├── customers/       # 客戶管理
│   ├── team-members/    # 團隊成員管理
│   └── users/           # 使用者管理
├── services/            # API 層
│   ├── api-client.ts    # 原生 fetch 封裝（apiFetch），唯一資料存取入口
│   ├── mock/            # mock 資料與 method+path handler 表
│   └── schemas/         # zod schema / domain 型別
├── hooks/               # 自定義 React hooks
├── utils/               # 工具函數
├── locales/             # 國際化翻譯檔案
├── constants/           # 常數定義
└── types/               # TypeScript 型別定義
```

## 🔑 核心功能模組

### 商品管理
- 商品 CRUD 操作
- 多語言商品資訊
- 圖片上傳與管理
- 商品狀態管理
- 供應商與標籤關聯

### 訂單管理
- 訂單列表與篩選
- 訂單詳情檢視
- 訂單狀態追蹤
- 批次操作支援

### 客戶管理
- 客戶資料管理
- 交易歷史檢視
- 客戶消費統計

### 權限管理
- 使用者角色管理
- 權限矩陣設定
- 存取控制驗證

### 橫幅管理
- 輪播圖管理
- 拖拽排序功能

## 🛠️ 開發指南

### API 整合
所有資料存取經 `src/services/api-client.ts` 的 `apiFetch`（原生 fetch 寫法），目前由 `src/services/mock/handlers.ts` 依「method + path」回應本地 mock 資料；接真後端時把 `mockFetch` 換成 `fetch` 即可：

```typescript
// feature hook 內
const response = await apiFetch<TGetResponseContent<TProduct[]>>(
  "/admin/products",
  { query: { page: 1, limit: 10 } }
)

// 在元件中使用
const { data: products } = useGetProductList({
  page: 1,
  limit: 10,
})
```

### 權限檢查
```typescript
import { useUserPermissions } from '@/pages/users/hooks/use-user'

const MyComponent = () => {
  const { canManageProducts, isAdmin } = useUserPermissions()

  return (
    <div>
      {canManageProducts && <ProductActions />}
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

### 國際化
```typescript
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  const { t } = useTranslation()

  return <h1>{t('pages.dashboard.title')}</h1>
}
```

### 表單處理
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const MyForm = () => {
  const form = useForm({
    resolver: zodResolver(mySchema),
    defaultValues: {...}
  })

  return (
    <Form {...form}>
      {/* 表單內容 */}
    </Form>
  )
}
```

## 🔧 自定義與擴展

### 新增頁面模組
1. 在 `src/pages/` 下建立新模組目錄
2. 建立對應的 API 合約檔案
3. 實作 hooks 和元件
4. 設定路由檔案
5. 新增翻譯內容

### 自定義主題
修改 `tailwind.config.js` 來自定義顏色、字型等：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
      }
    }
  }
}
```

### 新增語言支援
1. 在 `src/locales/` 新增語言檔案
2. 更新 `src/constants/locales.ts`
3. 在 `src/locales/i18n.ts` 註冊新語言

## 🧪 測試策略

- **單元測試**: 元件和工具函數的獨立測試
- **整合測試**: API hooks 和表單流程測試
- **E2E 測試**: 完整使用者流程測試

執行測試：
```bash
# 執行所有測試
pnpm test

# 執行覆蓋率報告
pnpm test:coverage

# 監視模式
pnpm test:watch
```

## 📋 最佳實踐

### 程式碼組織
- 使用功能導向的目錄結構
- 保持元件的單一職責
- 適當抽象共用邏輯

### 效能優化
- 使用 React.memo 避免不必要的重新渲染
- 實作適當的快取策略
- 使用 Code Splitting 減少初始載入時間

### 型別安全
- 充分利用 TypeScript 的型別系統
- 使用 Zod 進行執行時驗證
- 避免 `any` 型別的使用

### 提交規範
使用 Conventional Commits 規範：
- `feat:` 新功能
- `fix:` 錯誤修復
- `docs:` 文檔更新
- `style:` 程式碼格式調整
- `refactor:` 重構
- `test:` 測試相關
- `chore:` 建置工具、依賴更新等

## 🙋‍♂️ 支援與協助
- 📖 文檔：查看 `docs/` 目錄下的詳細文檔
- 💬 討論：歡迎在 GitHub Discussions 中交流
