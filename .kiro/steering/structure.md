---
inclusion: always
---

# Project Structure

## Root Level Organization

```
├── src/                    # Main source code
├── docs/                   # Documentation and task specifications
├── dist/                   # Build output
├── node_modules/           # Dependencies
└── config files            # Various config files (.eslintrc, etc.)
```

## Source Code Structure (`src/`)

### Core Application

- `main.tsx` - Application entry point
- `vite-env.d.ts` - Vite environment types

### Components (`src/components/`)

- `ui/` - shadcn/ui components (Button, Dialog, Table, etc.)
- `shared/` - Reusable business components (DataTable, Navbar, etc.)
- `layouts/` - Layout components

### Pages (`src/pages/`)

Feature-based organization with consistent structure:

```
pages/
├── products/
│   ├── ProductList.tsx
│   ├── ProductForm.tsx
│   ├── components/        # Page-specific components
│   ├── hooks/            # Page-specific hooks
│   └── utils/            # Page-specific utilities
├── orders/
├── banners/
├── users/
└── ...
```

### Services (`src/services/`)

- `client.ts` - HTTP client configuration
- `contracts/` - API contract definitions and types
- `types/` - Shared service types and schemas

### Shared Utilities

- `hooks/` - Reusable React hooks
- `lib/` - Utility functions and helpers
- `utils/` - General utility functions
- `constants/` - Application constants
- `types/` - TypeScript type definitions

### Internationalization (`src/locales/`)

- `i18n.ts` - i18next configuration
- `en.json`, `th.json`, `zh.json` - Translation files
- `types.ts` - i18n type definitions

### Plugins (`src/plugins/`)

- `image-validation/` - Modular image validation system with presets

### Styling

- `styles/global.css` - Global styles and Tailwind imports

### Testing

- `test/` - Test configuration and setup files

## Documentation Structure (`docs/`)

- `rules/` - Development guidelines and conventions
- `task/` - Feature specifications organized by domain
- `user-role-management.md` - User management documentation

## Key Patterns

### Feature Organization

Each major feature (products, orders, etc.) follows a consistent structure:

- Main list/form components at feature root
- `components/` for feature-specific UI components
- `hooks/` for feature-specific business logic
- `utils/` for feature-specific helper functions
- `__tests__/` for feature-specific tests

### Import Conventions

- Use `@/` alias for all internal imports
- Organize imports by: builtin → external → internal → parent → sibling → index → types
- Prefer type-only imports where applicable

### Component Patterns

- Shared components in `src/components/shared/`
- UI primitives in `src/components/ui/`
- Feature-specific components co-located with their pages
- Consistent export patterns through index files
