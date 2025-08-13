# 客製化登入表單實施計畫（方案二）

## 概述
此計畫提供完整的步驟，讓你可以在需要時快速啟用完全客製化的登入表單。這份文件作為備用方案，當確定需要時可以立即進行開發。

### 重要邏輯說明
- **登入成功**：只有當 `result.status === "complete"` 時才會跳轉到首頁
- **登入失敗**：所有錯誤情況都會保持在登入頁面並顯示錯誤訊息
- **多重驗證**：如需要二階段驗證，會保持在登入頁面並提示使用者

## 實施步驟

### 第一階段：建立客製化登入表單元件

#### 1. 建立 CustomSignInForm 元件
```typescript
// src/components/auth/CustomSignInForm.tsx
import { useState } from "react"
import { useSignIn } from "@clerk/clerk-react"
import { useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

// 表單驗證 schema
const signInSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(1, "請輸入密碼")
})

type SignInFormData = z.infer<typeof signInSchema>

export const CustomSignInForm = () => {
  const { t } = useTranslation()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  })

  const onSubmit = async (data: SignInFormData) => {
    if (!isLoaded) return

    setError("")
    setIsLoading(true)

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      })

      // 只有在登入完全成功時才進行跳轉
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        // 確保 session 已設置成功後才跳轉
        navigate({ to: "/" })
      } else if (result.status === "needs_second_factor") {
        // 處理多重驗證（如果未來需要）
        setError("需要進行多重驗證")
        // 保持在登入頁面
      } else {
        // 其他狀態也保持在登入頁面
        console.error("登入狀態異常:", result.status)
        setError("登入失敗，請重試")
      }
    } catch (err: any) {
      // 錯誤時保持在登入頁面
      const errorCode = err.errors?.[0]?.code
      let errorMessage = t('auth.loginFailed')
      
      // 根據錯誤碼提供更具體的錯誤訊息
      switch (errorCode) {
        case 'form_password_incorrect':
          errorMessage = t('auth.incorrectPassword')
          break
        case 'form_identifier_not_found':
          errorMessage = t('auth.userNotFound')
          break
        case 'user_locked':
          errorMessage = t('auth.accountLocked')
          break
        default:
          errorMessage = err.errors?.[0]?.message || t('auth.loginFailed')
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-96 space-y-6 rounded-lg bg-white/10 p-8 backdrop-blur-md">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{t('auth.adminLogin')}</h2>
        <p className="mt-2 text-sm text-gray-300">{t('auth.enterCredentials')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-200">
            {t('auth.email')}
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            className="mt-1 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="admin@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-200">
            {t('auth.password')}
          </label>
          <input
            {...register("password")}
            id="password"
            type="password"
            className="mt-1 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? t('auth.loggingIn') : t('auth.login')}
      </button>
    </form>
  )
}
```

#### 2. 建立載入狀態元件
```typescript
// src/components/auth/SignInSkeleton.tsx
export const SignInSkeleton = () => {
  return (
    <div className="w-96 space-y-6 rounded-lg bg-white/10 p-8 backdrop-blur-md animate-pulse">
      <div className="text-center space-y-2">
        <div className="h-8 bg-gray-700 rounded w-32 mx-auto"></div>
        <div className="h-4 bg-gray-700 rounded w-48 mx-auto"></div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="h-4 bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-10 bg-gray-800 rounded"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-700 rounded w-12 mb-2"></div>
          <div className="h-10 bg-gray-800 rounded"></div>
        </div>
      </div>
      
      <div className="h-10 bg-purple-600/50 rounded"></div>
    </div>
  )
}
```

### 第二階段：整合進階功能

#### 3. 加入記住我功能
```typescript
// 在 CustomSignInForm 中加入
const [rememberMe, setRememberMe] = useState(false)

// 在表單中加入
<div className="flex items-center">
  <input
    id="remember-me"
    type="checkbox"
    checked={rememberMe}
    onChange={(e) => setRememberMe(e.target.checked)}
    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
  />
  <label htmlFor="remember-me" className="ml-2 text-sm text-gray-300">
    {t('auth.rememberMe')}
  </label>
</div>
```

#### 4. 加入錯誤處理和重試機制
```typescript
// src/hooks/useSignInWithRetry.ts
import { useState, useCallback } from 'react'
import { useSignIn } from '@clerk/clerk-react'

export const useSignInWithRetry = (maxRetries = 3) => {
  const { signIn, setActive } = useSignIn()
  const [retryCount, setRetryCount] = useState(0)

  const signInWithRetry = useCallback(async (identifier: string, password: string) => {
    try {
      const result = await signIn?.create({ identifier, password })
      setRetryCount(0)
      return result
    } catch (error) {
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1)
        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        return signInWithRetry(identifier, password)
      }
      throw error
    }
  }, [signIn, retryCount, maxRetries])

  return { signInWithRetry, setActive, retryCount }
}
```

### 第三階段：更新 AuthLayout（備用方案）

#### 5. 當確定需要使用客製化登入時的 AuthLayout.tsx
```typescript
// src/components/layouts/AuthLayout.tsx
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react"
import { lazy, Suspense } from "react"
import { SignInSkeleton } from "../auth/SignInSkeleton"

// 延遲載入以優化效能
const CustomSignInForm = lazy(() => 
  import("../auth/CustomSignInForm").then(module => ({ 
    default: module.CustomSignInForm 
  }))
)

export const AuthLayout = () => {
  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0e0c1f] to-[#1a1a22]">
          <div className="rounded-lg shadow-[0_0_10px_2px_#a855f7cc transition duration-300 hover:shadow-[0_0_20px_4px_#c084fc]">
            <Suspense fallback={<SignInSkeleton />}>
              <CustomSignInForm />
            </Suspense>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <RedirectToSignIn redirectUrl="/" />
      </SignedIn>
    </>
  )
}
```

### 第四階段：國際化支援

#### 6. 加入翻譯檔案
```json
// src/locales/zh/auth.json
{
  "auth": {
    "adminLogin": "後台登入",
    "enterCredentials": "請輸入您的管理員帳號",
    "email": "電子郵件",
    "password": "密碼",
    "rememberMe": "記住我",
    "login": "登入",
    "loggingIn": "登入中...",
    "loginFailed": "登入失敗，請檢查您的帳號密碼",
    "incorrectPassword": "密碼錯誤",
    "userNotFound": "找不到此使用者",
    "accountLocked": "帳號已被鎖定，請聯絡管理員",
    "tooManyAttempts": "登入嘗試次數過多，請稍後再試"
  }
}
```

### 第五階段：測試計畫

#### 7. 建立測試檔案
```typescript
// src/components/auth/__tests__/CustomSignInForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSignInForm } from '../CustomSignInForm'
import { vi } from 'vitest'

vi.mock('@clerk/clerk-react', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: vi.fn()
    },
    setActive: vi.fn()
  })
}))

describe('CustomSignInForm', () => {
  it('should render login form', () => {
    render(<CustomSignInForm />)
    expect(screen.getByLabelText(/電子郵件/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/密碼/i)).toBeInTheDocument()
  })

  it('should show validation errors', async () => {
    const user = userEvent.setup()
    render(<CustomSignInForm />)
    
    await user.click(screen.getByText(/登入/i))
    
    await waitFor(() => {
      expect(screen.getByText(/請輸入有效的電子郵件/i)).toBeInTheDocument()
    })
  })
})
```

## 啟用步驟

當你確定需要使用客製化登入表單時：

1. **安裝必要的依賴**（如果尚未安裝）：
   ```bash
   pnpm add @hookform/resolvers
   ```

2. **建立新的元件檔案**：
   - `/src/components/auth/CustomSignInForm.tsx`
   - `/src/components/auth/SignInSkeleton.tsx`
   - `/src/hooks/useSignInWithRetry.ts`

3. **更新國際化檔案**：
   - 在現有的翻譯檔案中加入認證相關的翻譯

4. **直接替換 AuthLayout.tsx**：
   - 將文件中的備用 AuthLayout 程式碼複製到實際檔案
   - 移除原本的 Clerk SignIn 元件

5. **測試和驗證**：
   - 執行測試確保功能正常
   - 檢查錯誤處理是否正確
   - 驗證登入成功才能跳轉
   - 確認登入失敗時保持在登入頁面

## 優勢

- **完全控制 UI/UX**：可以完全符合設計需求
- **更好的錯誤處理**：自訂錯誤訊息和重試機制
- **效能優化**：透過延遲載入和骨架畫面改善使用者體驗
- **擴充性**：容易加入新功能如生物識別登入、社交登入等
- **明確的登入狀態**：只有成功登入才會跳轉，失敗時保持在登入頁面

## 注意事項

1. **安全性**：確保所有錯誤訊息不會洩露敏感資訊
2. **無障礙性**：確保表單符合網頁無障礙標準
3. **效能**：監控登入時間和成功率
4. **相容性**：測試不同瀏覽器和裝置