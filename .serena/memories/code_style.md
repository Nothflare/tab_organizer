# Code Style and Conventions

## TypeScript
- **Strict mode** enabled
- Use `interface` for object types (e.g., `Settings`, `TabInfo`)
- Use `type` for unions and complex types (e.g., `Status`, `TaskState`)
- Use discriminated unions for state machines (status/type field)
- Path alias: `~/*` maps to `./src/*`

## Naming Conventions
- **Files**: camelCase for utilities (`taskManager.ts`), PascalCase for components (`Button.tsx`)
- **Functions**: camelCase (`getSettings`, `organizeTab`)
- **Interfaces/Types**: PascalCase (`Settings`, `TabInfo`, `TaskState`)
- **React Components**: PascalCase, use `forwardRef` for forwarding refs
- **Constants**: camelCase for variants (`buttonVariants`)

## React Patterns
- Functional components only
- Use `React.forwardRef` for components that need ref forwarding
- Use `displayName` for forwardRef components
- Import React explicitly: `import * as React from "react"`

## Styling
- Tailwind CSS with custom dark theme
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes
- Use `class-variance-authority` (cva) for component variants
- Dark mode by default (background: #0a0a0a)
- Font stack: Geist, Inter, system-ui, sans-serif

## Plasmo Patterns
- Background scripts in `src/background/`
- Message handlers in `src/background/messages/` (named exports)
- Use `@plasmohq/messaging` for inter-component communication
- Entry points: `popup/index.tsx`, `options/index.tsx`, `background/index.ts`

## No Linter/Formatter Configured
- No ESLint or Prettier config files present
- Follow existing code style in the codebase
- TypeScript compiler provides type checking
