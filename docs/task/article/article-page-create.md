# 文章編輯管理系統頁面

開始前依照設定分析專案 context 與 project 的設定，並且依照設定撰寫 task 的內容

## 概述

- router 結構上共有兩頁
  - 文章列表頁面
  - 文章編輯頁面
- 文章列表頁面
- 以 Table Layout 形式呈現文章列表
- 每筆文章資料包含以下欄位
  - 文章編號
  - 文章標題
  - 文章摘要
  - 文章狀態
  - 文章標籤
  - 文章作者
  - 文章發布時間
  - 文章更新時間
- 文章編輯頁面
- 以 Form Layout 形式呈現文章編輯頁面
- 每筆文章資料包含以下欄位
  - 文章封面圖片
  - 文章標題
  - 文章摘要
  - 文章內容
  - 文章標籤

## 頁面技術選型

- RichText Editor 使用 [Tiptap](https://tiptap.dev/)
- Editor 輸出後的內容使用 [DOMPurify](https://github.com/cure53/DOMPurify) 進行 XSS 攻擊防護
- 文章列表沿用專案其他頁面的 table layout 沿用
- 文章編輯頁面沿用專案其他頁面的 form layout 沿用
- 圖片上傳採用專案設計的圖文上傳系統串接

## 實作細節

### type 設計

- 資料型別定義以 zod 為主
- 以 zod 定義的 type 為基礎，進行 ts-rest 的 api 設計，可以參考其他業務設計的流程
- 基本型別命名如下

```ts
article_id: string // 由後端提供，前端不需處理
user_id: string // 由後端提供，前端不需處理
nick_name: string // 由後端提供，前端不需處理
title: string // 文章標題
tags?: string[] // 文章標籤
describe?: string // 文章摘要
image_url?: TImageResponseSchema // 專案內現有專案格式，可以搜尋參考
content_html: string // Editor 輸出後的內容，輸出結構以 HTML 格式
created_at: string // 文章發布時間
updated_at: string // 文章更新時間
```

### API 設計

- 主要技術使用以 ts-rest, zod 為主，可以參照其他的串接設計
- 圖片上傳系統的 api 設計可以參照專案其他頁面的串接設計
- 基本 methods 設計如下
   - GET
   - POST
   - PUT
   - DELETE
- url: /api/v1/admin/articles


### 資料流

- 創建文章
  1.  使用 form 表單收集資料
  2.  Editor 輸出後的內容使用 DOMPurify 進行 XSS 攻擊防護
  3.  將 image file input 上傳的 base64 內容，透過 api 串接至圖文上傳系統
  4.  將圖片 api 回傳的內容存至 form 表單中，並顯示於 form 表單用於 Image Preview
  5.  將 form 表單資料透過 api 串接至後端
  6.  上傳成功後，跳轉至文章列表頁面
  7.  更新文章列表資料
- 編輯文章
  1.  讀取 api 取得文章資料
  2.  將圖片 api 回傳的內容存至 form 表單中，並顯示於 form 表單用於 Image Preview
  3.  使用 Editor 解析 api 文章內容還原顯示
  4.  待使用者修改後，將 form 表單資料透過 api 串接至後端
  5.  上傳成功後，跳轉至文章列表頁面
  6.  更新文章列表資料
- 刪除文章
  1.  使用 api 刪除文章
  2.  刪除成功後，呼叫 api 取得文章列表資料
  3.  更新文章列表資料

### i18n

- 攸關狀態通知 User 的文字，使用 i18n 進行多國語系支援

### UI

- 文章列表的點擊呈現需要顯示在 Navbar
- 其餘參考顯示可以分析其他頁面處理
