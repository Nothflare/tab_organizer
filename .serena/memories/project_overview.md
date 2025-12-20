# Tab Organizer - Project Overview

## Purpose
AI-powered Chrome extension that automatically organizes browser tabs into logical groups using OpenAI-compatible APIs.

## Key Features
- AI-powered tab grouping via OpenAI-compatible APIs
- One-click organization of all tabs in current window
- Auto-collapse groups (except active tab's group)
- Custom API support (OpenAI, Ollama, LM Studio, etc.)
- Debug mode for troubleshooting

## Tech Stack
- **Framework**: Plasmo (browser extension framework)
- **UI**: React 19
- **Styling**: Tailwind CSS 3.4 with dark mode
- **Language**: TypeScript 5.9 (strict mode)
- **Package Manager**: pnpm 10.24.0
- **Build Target**: Chrome MV3

## Project Structure
```
src/
├── background/           # Service worker and message handlers
│   ├── index.ts         # Background entry point
│   ├── taskManager.ts   # Task state management
│   └── messages/        # Plasmo message handlers
│       ├── organize.ts
│       ├── ungroup.ts
│       ├── cancelTask.ts
│       ├── getTaskStatus.ts
│       └── resetTask.ts
├── components/ui/        # Reusable UI components
│   ├── button.tsx
│   └── switch.tsx
├── lib/                  # Shared utilities and types
│   ├── api.ts           # AI API integration
│   ├── storage.ts       # Chrome storage helpers
│   ├── tabs.ts          # Tab manipulation utilities
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # General utilities (cn function)
├── options/             # Extension options page
│   └── index.tsx
├── popup/               # Extension popup UI
│   └── index.tsx
└── style.css            # Global Tailwind styles
```

## Chrome Permissions
- `tabs` - Access tab information
- `tabGroups` - Create and manage tab groups
- `storage` - Persist settings
- `<all_urls>` - Read tab URLs for AI categorization
