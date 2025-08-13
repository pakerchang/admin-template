# Gemini Project Execution Guide

This document is the single, authoritative source of truth for Gemini's operations within this project. It synthesizes architectural analysis with mandatory development guidelines to ensure every action and output is consistent, idiomatic, and aligned with project standards.

## 🚨 1. Core Execution Principles & Workflow

These are the highest-priority rules that govern all my actions.

### 1.1. Staged Delivery Mandate

I will operate under a strict staged-delivery model:

1.  **Git Context Check**: Before starting, I will perform a "Smart Git Context Check" as described below.
2.  **Execute One Phase**: I will execute **only one** specific, named phase from the project documentation (e.g., "Phase 1.1").
3.  **STOP & Report**: Upon completion, I will immediately stop and report my progress using the specified communication format.
4.  **Await Permission**: I will **not** proceed to the next phase until I receive explicit approval from you.

### 1.2. Smart Git Context Check

To maintain context efficiently, I will use the following logic:

-   **Level 1 (Always)**: Check `git status` and `git branch --show-current`.
-   **Level 2 (Conditional)**: I will check for progress markers (`[x]`) in `docs/task/**/*.md`. 
    -   **If progress exists**: I will perform a deep analysis using `git log dev..HEAD --grep="Phase"` to understand the exact stage of development.
    -   **If no progress exists**: I will perform a light check with `git log dev..HEAD --oneline -3` to avoid unnecessary analysis.
-   **Level 3 (Always)**: Check `git diff --staged` and `git diff` for pending changes.

### 1.3. Communication Protocol

Upon completing a phase, I will use the following format to report:

```
✅ Phase X.Y Complete: [Exact Phase Name from Documentation]

📝 **Completed Content:**
- [Specific implementation details]

📋 **Documentation Updated:**
- [Path to requirement document]: Updated progress tracking with completion timestamp and commit reference.

🔍 **Please Review:**
- [Specific points for review]

⏳ Waiting for Permission to Enter Phase X.Y+1: [Next Phase Name]
```

## 🏛️ 2. Project Architecture & Technology Stack

This is a highly-structured **React (Vite) + TypeScript** backend management system.

- **Authentication & Authorization**: **`@clerk/clerk-react`** for authentication. A sophisticated Role-Based Access Control (RBAC) system is centered around the `useUserPermissions` hook.
- **API Layer**: **`@ts-rest/core`** with a centralized **`axios`** client (`src/services/client.ts`). Contracts are in `src/services/contracts/`.
- **State Management**: **`@tanstack/react-query`** for server state. No global client state manager (e.g., Redux) is used.
- **Forms & Validation**: **`react-hook-form`** with **`zod`** for validation.
- **Routing**: **`@tanstack/react-router`**.
- **UI & Styling**: **`shadcn/ui`** and **`tailwindcss`**.
- **Testing**: **Vitest** and **Testing Library**.

## ⚙️ 3. Development Commands & Environment

- **Package Manager**: **`pnpm`** is the exclusive package manager.
- **Install**: `pnpm install`
- **Run Dev Server**: `pnpm dev`
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Test**: `pnpm test`

## 📜 4. Naming & Commit Conventions

### 4.1. File Naming Conventions

I will strictly adhere to the following naming rules, prioritizing feature-based organization (`src/pages/{feature}/`) over type-based clustering.

| File Type | Convention | Example |
|---|---|---|
| React Components | `PascalCase` | `BannerForm.tsx` |
| Test Files | `kebab-case` | `banner-form.test.tsx` |
| Hooks | `camelCase` | `useBanner.ts` |
| Utilities/Constants | `kebab-case` | `format-date.ts` |

### 4.2. Git Commit Message Format

I will follow the Conventional Commits specification. Every commit **must** be associated with an issue number.

- **Format**: `<type>[optional scope]: #<issue-number> <description>`
- **Phase Format**: `<type>: #<issue-number> Phase <X.Y> - <description>`
- **Primary Types**: `feat`, `fix`, `chore`, `refactor`
- **Example**: `feat: #31 Phase 1.1 - implement ProductCreateForm component`

If an issue number is not provided, I will ask for it.

## 🗺️ 5. Key File & Directory Map

- `src/pages/`: **Feature Modules** (e.g., `products`, `orders`, `banners`). This is the primary location for new feature development.
- `src/components/`: **UI Components** (`ui/` for base, `shared/` for custom, `layouts/` for page structure).
- `src/hooks/`: **Global Reusable Logic**.
- `src/services/`: **API Layer** (`client.ts`, `contracts/`).
- `src/plugins/image-validation/`: The extensible image validation system.
- `docs/`: **Project Documentation**, including the definitive rule files.
- `locales/`: **i18n Translations** (en, th, zh).

## 🌐 6. Language & Communication

- All my responses and generated documentation will be in **Traditional Chinese (繁體中文)**.
- I will interpret the rules in `docs/rules/` based on their original English text for technical accuracy.
