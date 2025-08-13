# Project Context & Architecture

**Note**: This is a normative specification file written in English for precise technical understanding, as per Claude.md requirements.

## Project Overview

This is a React admin dashboard framework for general business management:

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: TanStack Router with file-based routing
- **State Management**: TanStack Query for server state, React Hook Form for forms
- **Authentication**: Clerk user authentication
- **UI Framework**: Tailwind CSS + Radix UI components
- **Testing**: Vitest + Testing Library
- **Package Manager**: pnpm

## Project Structure

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
└── locales/             # i18n translations (en, zh)
```

## Core Architectural Patterns

### API Layer

- Uses `@ts-rest/core` for type-safe API contracts
- Centralized API client in `src/services/client.ts`
- Contract definitions in `src/services/contacts/`

### Authentication & Authorization

- Global user role management with prefetching in `ProtectedAppLayout`
- Permission-based access control via `useUserPermissions` hook
- Comprehensive role system (admin, superadmin, partner, premium, user, guest, support)

### Form Management

- React Hook Form with Zod validation
- Consistent form patterns across features
- Centralized validation message generation

### State Management

- TanStack Query for server state with strategic caching
- Long-term cache strategy for user roles (staleTime: 1hr, gcTime: 24hr)
- Optimistic updates where appropriate

## File Naming Conventions

Strictly follow these naming rules:

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

- Two languages supported: English, Chinese
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

- This is a generic admin system framework - ensure compliance with relevant business regulations
- User role management is implemented as a global cold data system with prefetching
- The codebase uses mixed languages (English code, Chinese documentation)
- Banner management includes drag-and-drop sorting functionality
- Order management supports batch operations
