# Technology Stack

## Core Framework & Build System

- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **pnpm** as package manager (required version 9.11.0+)
- **Node.js 20+** required

## Key Libraries & Dependencies

- **@tanstack/react-router** - File-based routing
- **@tanstack/react-query** - Server state management
- **@tanstack/react-table** - Data table functionality
- **@clerk/clerk-react** - Authentication and user management
- **react-hook-form** + **@hookform/resolvers** + **zod** - Form handling and validation
- **@radix-ui** components - Headless UI primitives
- **tailwindcss** - Utility-first CSS framework
- **shadcn/ui** - Pre-built component system
- **i18next** + **react-i18next** - Internationalization
- **axios** - HTTP client
- **@tiptap** - Rich text editor
- **framer-motion** - Animations

## Development Tools

- **ESLint** with TypeScript, React, and Tailwind plugins
- **Prettier** for code formatting
- **Husky** + **lint-staged** for git hooks
- **Vitest** for testing with jsdom environment
- **@testing-library/react** for component testing

## Common Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm test             # Run tests
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm lint             # Run ESLint with auto-fix
pnpm prettier         # Format code with Prettier

# Setup
pnpm install          # Install dependencies
cp .env.example .env  # Setup environment variables
```

## Path Aliases

- `@/*` maps to `./src/*` for clean imports

## Build Configuration

- Manual chunk splitting for optimized vendor bundles
- Separate chunks for React, Router, UI components, Forms, Query, and Utils
