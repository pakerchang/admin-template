# Banner 排序機制技術文檔

## 概述

本文檔詳細說明 Banner 排序系統的設計理念、架構實作與操作流程。該系統提供拖拽排序、狀態管理、操作鎖定等核心功能，確保 Banner 管理的穩定性與使用者體驗。

## 系統架構

### 核心組件結構

```mermaid
graph TB
    A[BannerList.tsx] --> B[useBannerSort Hook]
    A --> C[ImageCard Components]
    B --> D[useUpdateBanner API]
    B --> E[狀態管理系統]
    E --> F[操作鎖定機制]
    E --> G[拖拽狀態追蹤]
    E --> H[節流控制]

    subgraph "狀態管理"
        E1[operations Map]
        E2[reorderBanners]
        E3[isDragging]
        E4[pendingReorder]
    end

    E --> E1
    E --> E2
    E --> E3
    E --> E4
```

### 操作類型定義

系統支援三種主要操作類型：

- **reorder**: 拖拽排序操作
- **promote**: 提升為啟用狀態
- **demote**: 降級為停用狀態

## 拖拽排序流程

### 完整拖拽流程圖

```mermaid
sequenceDiagram
    participant U as 使用者
    participant UI as BannerList UI
    participant H as useBannerSort Hook
    participant T as 節流機制
    participant API as Banner API
    participant S as 狀態管理

    U->>UI: 開始拖拽 Banner
    UI->>H: handleReorder(newOrder)

    H->>H: 檢查 hasActiveOperation()
    alt 有其他操作進行中
        H->>UI: 忽略拖拽請求
    else 無其他操作
        H->>S: 立即更新 UI 狀態
        S->>UI: 顯示新排序
        H->>S: 設置 isDragging = true
        H->>S: 儲存 pendingReorder
        H->>T: 設置 500ms 延遲執行

        U->>UI: 繼續拖拽
        UI->>H: handleReorder(newOrder)
        H->>T: 清除舊延遲，設置新延遲

        U->>UI: 結束拖拽
        UI->>H: finalizeDragReorder()
        H->>T: 清除延遲
        H->>H: executeReorderUpdate()

        H->>S: 設置操作鎖定
        H->>API: 批次更新 sort_order
        API-->>H: 更新結果
        H->>S: 釋放操作鎖定
        H->>UI: 顯示成功/失敗訊息
    end
```

### 節流機制設計

```mermaid
graph LR
    A[拖拽事件] --> B{檢查延遲執行}
    B -->|存在| C[清除舊延遲]
    B -->|不存在| D[設置新延遲]
    C --> D
    D --> E[500ms 後執行]
    E --> F[executeReorderUpdate]

    G[拖拽結束] --> H[finalizeDragReorder]
    H --> I[立即清除延遲]
    I --> F
```

## 狀態管理機制

### 操作狀態追蹤

```mermaid
stateDiagram-v2
    [*] --> Idle: 初始狀態

    Idle --> Reordering: 開始拖拽排序
    Idle --> Promoting: 提升 Banner
    Idle --> Demoting: 降級 Banner

    Reordering --> Idle: 排序完成
    Promoting --> Idle: 提升完成
    Demoting --> Idle: 降級完成

    Reordering --> Blocked: 操作衝突
    Promoting --> Blocked: 操作衝突
    Demoting --> Blocked: 操作衝突

    Blocked --> Idle: 等待操作完成
```

### 操作鎖定機制

```mermaid
graph TD
    A[操作請求] --> B{檢查操作鎖定}
    B -->|已鎖定| C[顯示衝突訊息]
    B -->|未鎖定| D[設置操作鎖定]
    D --> E[執行操作]
    E --> F{操作結果}
    F -->|成功| G[顯示成功訊息]
    F -->|失敗| H[顯示錯誤訊息]
    G --> I[釋放操作鎖定]
    H --> I
    C --> J[操作被拒絕]
```

## Banner 狀態轉換

### 啟用/停用狀態流程

```mermaid
stateDiagram-v2
    [*] --> Inactive: 新建 Banner

    Inactive --> Active: promoteToActive()
    Active --> Inactive: removeFromActive()

    state Active {
        [*] --> Position1
        Position1 --> Position2: 拖拽排序
        Position2 --> Position3: 拖拽排序
        Position3 --> Position1: 拖拽排序
    }

    state "排序計算" as SortCalc {
        [*] --> CalcNext: 計算下一個位置
        CalcNext --> UpdateOrder: 更新 sort_order
        UpdateOrder --> Reposition: 重新排列其他項目
    }

    Inactive --> SortCalc: 提升時
    Active --> SortCalc: 移除時（遞補）
```

## API 操作策略

### 批次更新機制

```mermaid
graph TD
    A[收到新排序] --> B[比較 sort_order 差異]
    B --> C{有變更項目?}
    C -->|否| D[跳過更新]
    C -->|是| E[建立更新 Promise 陣列]
    E --> F[順序執行更新]
    F --> G{全部成功?}
    G -->|是| H[顯示成功訊息]
    G -->|否| I[回滾到原始狀態]
    I --> J[顯示錯誤訊息]
```

### 遞補機制設計

```mermaid
graph LR
    A[移除 Banner] --> B[找出受影響項目]
    B --> C[sort_order > 目標位置]
    C --> D[批次更新: sort_order - 1]
    D --> E[並行執行更新]
    E --> F[完成遞補]
```

## 使用者體驗設計

### 即時反饋機制

```mermaid
journey
    title Banner 拖拽排序使用者體驗
    section 開始拖拽
      使用者抓取 Banner: 5: 使用者
      游標變為抓取狀態: 4: 系統
      Banner 開始浮起動畫: 5: 系統
    section 拖拽過程
      Banner 跟隨滑鼠移動: 5: 系統
      其他 Banner 即時重排: 5: 系統
      提供視覺反饋: 4: 系統
    section 結束拖拽
      Banner 落下動畫: 4: 系統
      顯示載入狀態: 3: 系統
      API 更新完成: 2: 系統
      顯示成功訊息: 5: 系統
```

### 錯誤處理流程

```mermaid
graph TD
    A[操作失敗] --> B{錯誤類型}
    B -->|網路錯誤| C[顯示重試提示]
    B -->|權限錯誤| D[顯示權限訊息]
    B -->|操作衝突| E[顯示等待訊息]
    B -->|資料錯誤| F[回滾到原始狀態]

    C --> G[提供重試按鈕]
    D --> H[引導至登入]
    E --> I[自動重試機制]
    F --> J[顯示錯誤詳情]
```

## 效能優化策略

### 渲染優化

```mermaid
graph LR
    A[狀態變更] --> B[useMemo 計算]
    B --> C[避免不必要渲染]
    C --> D[動畫配置快取]
    D --> E[條件式動畫]
    E --> F[最佳化使用者體驗]
```

### 記憶體管理

```mermaid
graph TD
    A[組件掛載] --> B[設置 Timeout Ref]
    B --> C[註冊清理函數]
    C --> D[組件使用中]
    D --> E[組件卸載]
    E --> F[清除 Timeout]
    F --> G[釋放記憶體]
```

## 國際化支援

### 多語系訊息管理

```mermaid
graph LR
    A[Toast 訊息] --> B[useTranslation Hook]
    B --> C{當前語系}
    C -->|zh| D[繁體中文]
    C -->|en| E[英文]
    C -->|th| F[泰文]
    D --> G[顯示本地化訊息]
    E --> G
    F --> G
```

## 故障排除指南

### 常見問題診斷流程

```mermaid
flowchart TD
    A[拖拽無反應] --> B{檢查操作鎖定}
    B -->|已鎖定| C[等待操作完成]
    B -->|未鎖定| D{檢查網路連線}
    D -->|正常| E[檢查 API 回應]
    D -->|異常| F[重新連線]

    G[排序錯亂] --> H[檢查 sort_order 衝突]
    H --> I[重新整理頁面]

    J[操作失敗] --> K{檢查錯誤類型}
    K -->|權限| L[重新登入]
    K -->|網路| M[檢查連線]
    K -->|資料| N[聯絡技術支援]
```

## 維護指南

### 程式碼維護重點

1. **狀態管理**: 確保操作狀態的一致性
2. **記憶體清理**: 及時清除 timeout 和事件監聽器
3. **錯誤處理**: 完善的錯誤捕獲和使用者提示
4. **效能監控**: 關注拖拽操作的流暢度

### 擴展建議

```mermaid
graph LR
    A[當前功能] --> B[批次操作]
    A --> C[拖拽預覽]
    A --> D[操作歷史]
    A --> E[自動儲存]

    B --> F[多選 Banner]
    C --> G[拖拽軌跡顯示]
    D --> H[復原/重做功能]
    E --> I[離線支援]
```

## 技術規格

- **框架**: React 19 + TypeScript
- **拖拽庫**: Framer Motion Reorder
- **狀態管理**: React Hooks + useCallback
- **國際化**: react-i18next
- **樣式**: Tailwind CSS + shadcn/ui

## 結論

Banner 排序機制透過精心設計的狀態管理、操作鎖定和節流機制，提供了穩定可靠的拖拽排序體驗。系統具備良好的擴展性和維護性，能夠滿足複雜的業務需求。
