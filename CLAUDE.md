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
  - "docs/rules/*.md"
alwaysApply: true
---

<!--
CLAUDE.md Configuration Explanation:

- description: Project overview for Claude Code context
- globs: Files that Claude MUST automatically read as basic context before any task
  - All files listed in globs are treated as essential project knowledge
  - docs/rules/*.md files contain mandatory rules that override any other guidance
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
- **docs/rules/\*.md**: Contains mandatory rules that take precedence over other guidance

All files in the `globs` array should be treated as essential project knowledge that informs every decision and action.

## 🧠 MASTER SELF-CHECK PROTOCOL
**🔴 MANDATORY: Execute before ANY response or action**

### **Level 0: Context Bootstrap** (15 seconds)
- [ ] ✅ **Task Classification**: [Analysis/Planning/Implementation/Debug/Review]
- [ ] ✅ **Rules Domain Check**: Which docs/rules/ files apply? [List specific files]
- [ ] ✅ **Complexity Assessment**: [Simple/Medium/Complex/Multi-domain]
- [ ] ✅ **Information Completeness**: Do I have sufficient context? [Y/N]

### **Level 1: Rules Integration** (30 seconds)
- [ ] ✅ **Development Process**: IF involves phases/stages → Execute development-process.md self-check
- [ ] ✅ **Version Control**: IF involves git operations → Execute commit-rules.md self-check  
- [ ] ✅ **File Operations**: IF creates/modifies files → Execute naming-conventions.md self-check
- [ ] ✅ **Cross-Domain Conflicts**: Any conflicting rules identified? [Document and prioritize]

### **Level 2: Response Quality Gate** (15 seconds)
- [ ] ✅ **Accuracy Verification**: Facts checked, assumptions explicit
- [ ] ✅ **Completeness Validation**: All requirements addressed
- [ ] ✅ **Actionability Confirmation**: Next steps clear and achievable
- [ ] ✅ **Documentation Impact**: What needs updating?

**🔴 GATE RULE: ALL boxes must be checked before proceeding**

### **Rules Domain Mapping & Integration Protocol**
- **Development Tasks** → `docs/rules/development-process.md` (staged delivery, git context)
- **Git Operations** → `docs/rules/commit-rules.md` (commit standards, branch management)
- **File Creation** → `docs/rules/naming-conventions.md` (naming standards, structure)

### **Cross-Domain Integration Check**
When tasks involve multiple rule domains, execute ALL applicable self-checks:

**Example Scenarios:**
- **Creating new feature files + commits** → Execute naming-conventions.md + commit-rules.md self-checks
- **Development phases with file changes** → Execute development-process.md + naming-conventions.md self-checks
- **Multi-phase development with commits** → Execute ALL THREE self-checks

### **Rules Conflict Resolution Hierarchy**
When rules conflict across domains:
1. 🔴 **development-process.md** = HIGHEST (Process control and workflow)
2. 🟡 **commit-rules.md** = MEDIUM (Version control standards)  
3. 🟢 **naming-conventions.md** = STANDARD (Code organization standards)
4. 📋 **CLAUDE.md** = CONTEXT (Project guidance and integration)

## 🚨 MANDATORY: Rule Files Priority

**CRITICAL**: The Master Self-Check Protocol above determines which rule files to read based on task context. These rules take precedence over any conflicting information in this file.

### Required Reading Order (Context-Driven):

1. `docs/rules/development-process.md` - MANDATORY for all development tasks (defines staged delivery process)
2. `docs/rules/commit-rules.md` - MANDATORY before any git commit operations
3. `docs/rules/naming-conventions.md` - MANDATORY before creating/modifying files

**Failure to execute the Master Self-Check Protocol may result in incorrect implementation and violation of project standards.**

## Language Preference

### **Communication & Documentation Language**

- Always respond in Traditional Chinese (繁體中文) unless explicitly asked to use another language
- All user interactions must be in Traditional Chinese
- Development documents and implementation plans must be in Traditional Chinese
- Technical documentation and specifications must be in Traditional Chinese

### **Exception: Core Rule Files Only**

- Files in `docs/rules/` directory use English for precise technical specification understanding
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

Follow these strict naming rules:

- **React Components**: PascalCase (`BannerForm.tsx`, `ImageCard.tsx`)
- **Test Files**: kebab-case (`banner-form.test.tsx`, `use-banner.test.ts`)
- **Hooks**: camelCase starting with `use` (`useBanner.ts`, `useAuth.ts`)
- **Utilities/Constants**: kebab-case (`format-date.ts`, `api-client.ts`)

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

## 🤖 CLAUDE EXECUTION VALIDATION
**Self-verification before responding to user:**

### **Master Protocol Execution Check**
Before providing ANY response:
1. Did I execute Level 0: Context Bootstrap? [Y/N]
2. Did I execute Level 1: Rules Integration? [Y/N]  
3. Did I execute Level 2: Response Quality Gate? [Y/N]
4. Can I explicitly state which rules domains apply? [Y/N]

**If ANY answer is "No" → STOP and execute Master Self-Check Protocol first**

### **Response Quality Validation**
- [ ] My response addresses the user's specific request
- [ ] I have verified facts and made assumptions explicit
- [ ] I have identified what documentation needs updating (if any)
- [ ] I have provided clear, actionable next steps
