---
description: Admin Dashboard - Multi-purpose administration system
globs:
  - "package.json"
  - "src/services/client.ts"
  - "src/services/types/*.ts"
  - "src/services/contacts/*.ts"
  - "src/components/layouts/*.tsx"
  - "src/types/*.ts"
  - "vite.config.ts"
  - "tsconfig.json"
  - ".claude/rules/*.md"
alwaysApply: true
---

<!--
CLAUDE.md Configuration Explanation:

- description: Project overview for Claude Code context
- globs: Files that Claude MUST automatically read as basic context before any task
  - All files listed in globs are treated as essential project knowledge
  - .claude/rules/*.md files contain mandatory rules that override any other guidance
  - These files provide architectural understanding and constraints
- alwaysApply: true - This configuration is ALWAYS active and cannot be overridden

Claude MUST read all glob files at the start of each session to establish proper context.
-->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 Configuration Context

This CLAUDE.md file uses the following configuration:

- **globs**: Lists essential files that Claude MUST read automatically as basic context
- **alwaysApply: true**: This configuration is permanently active and cannot be overridden
- **.claude/rules/\*.md**: Contains mandatory rules that take precedence over other guidance

All files in the `globs` array should be treated as essential project knowledge that informs every decision and action.

## Rules Integration Protocol

### Task-Based Rule Application
- **Development Tasks**: Apply `.claude/rules/development-process.md` and `.claude/rules/phase-workflow.md`
- **Git Operations**: Apply `.claude/rules/commit-rules.md`
- **File Creation**: Apply `.claude/rules/naming-conventions.md`
- **Documentation**: Apply `.claude/rules/phase-workflow.md`

### Rule Priority Hierarchy
1. **development-process.md** - Process control and workflow
2. **commit-rules.md** - Version control standards
3. **naming-conventions.md** - Code organization standards
4. **phase-workflow.md** - Cross-agent coordination
5. **CLAUDE.md** - Project context and integration

## Rule Files Usage

Rules in `.claude/rules/` take precedence over guidance in this file. Apply rules based on task context:
- Development work: `development-process.md` + `phase-workflow.md`
- Git commits: `commit-rules.md`
- File creation: `naming-conventions.md`

## Language Preference

### **Communication & Documentation Language**

- Always respond in Traditional Chinese (繁體中文) unless explicitly asked to use another language
- All user interactions must be in Traditional Chinese
- Development documents and implementation plans must be in Traditional Chinese
- Technical documentation and specifications must be in Traditional Chinese

### **Exception: Core Rule Files Only**

- Files in `.claude/rules/` directory use English for precise technical specification understanding
- These are low-level execution principle files that Claude must interpret accurately
- This exception applies ONLY to core rule files, not to development documents or user communication

## Development Commands

### Core Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm build` - Build for production (includes TypeScript compilation)
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm test` - Run tests with Vitest
- `pnpm test:coverage` - Run tests with coverage report

### Environment Setup

- Copy `.env.example` to `.env` for environment configuration

## Architecture Overview

This is a React admin dashboard built with modern TypeScript stack:

### Core Technologies

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: TanStack Router with file-based routing
- **State Management**: TanStack Query for server state, React Hook Form for forms
- **Authentication**: Clerk for user authentication
- **UI Framework**: Tailwind CSS + Radix UI components
- **Testing**: Vitest + Testing Library
- **Package Manager**: pnpm

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── layouts/         # Layout components (AuthLayout, ProtectedAppLayout)
│   ├── shared/          # Business-specific shared components
│   └── ui/              # Generic UI components (shadcn/ui)
├── pages/               # Feature-based page components
│   ├── banners/         # Banner management
│   ├── orders/          # Order management
│   ├── product/         # Product management
│   └── users/           # User management
├── services/            # API layer with ts-rest contracts
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
└── locales/             # i18n translations (en, th, zh)
```

### Key Architectural Patterns

#### API Layer

- Uses `@ts-rest/core` for type-safe API contracts
- Centralized API client in `src/services/client.ts`
- Contract definitions in `src/services/contacts/`

#### Authentication & Authorization

- Global user role management with prefetching in `ProtectedAppLayout`
- Permission-based access control via `useUserPermissions` hook
- Comprehensive role system (admin, superadmin, agent, vip, user, new, cservice)

#### Form Management

- React Hook Form with Zod validation
- Consistent form patterns across features
- Centralized validation message generation

#### State Management

- TanStack Query for server state with strategic caching
- Long-term cache strategy for user roles (staleTime: 1hr, gcTime: 24hr)
- Optimistic updates where appropriate

#### Component Organization

- Feature-based folder structure under `pages/`
- Each feature has its own components, hooks, and utilities
- Shared components in `components/shared/`

## File Naming Conventions

Follow naming conventions as detailed in `.claude/rules/naming-conventions.md`

## Development Guidelines

### Testing

- Test files use kebab-case naming
- Tests located in `__tests__/` directories within feature folders
- Comprehensive test coverage for banner functionality exists as reference

### Internationalization

- Three languages supported: English, Thai, Chinese
- Translation files in `src/locales/`
- Use `react-i18next` for translations

### Code Quality

- ESLint configuration enforces consistent code style
- Prettier for code formatting
- Husky for pre-commit hooks
- TypeScript strict mode enabled

### Permission System

- Use `useUserPermissions()` hook for role-based access control
- Prefer semantic permission checks (`canManageUsers`) over direct role comparison
- Global prefetching of user roles for immediate availability

## Important Notes

- This is a multi-purpose admin system - ensure compliance with relevant regulations
- User role management is implemented as a global cold data system with prefetching
- The codebase uses mixed languages (English code, Chinese documentation)
- Banner management includes drag-and-drop sorting functionality
- Order management supports batch operations

## Version Control & Deployment

### Git Repository

- **Main Branch**: `master`
- Uses standard Git workflow with feature branches

### Deployment

- Framework supports various deployment platforms
- Environment configuration via `.env` files
- Build artifacts generated with `pnpm build`

### Pull Request Guidelines

- Target branch is typically `master`
- Run build and lint checks before creating PR
- Use descriptive titles and comprehensive descriptions
- Follow conventional commit message format

