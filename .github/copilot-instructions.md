# Copilot Instructions for Dynamic UI Demo

This document provides guidance for AI agents working on this codebase.

## Project Overview

This is a **demonstration application** for the GitHub Copilot SDK. It showcases how to build AI-powered, dynamically updating user interfaces where users can modify the UI through natural language chat.

### Core Concept

- **Fixed Layer**: API routes and infrastructure are stable and rarely change
- **Dynamic Layer**: UI code is generated/modified at runtime via Copilot

## Code Philosophy

### Readability First

This is a **demonstration and teaching codebase**. Prioritize:

1. **Clear, readable code** over clever optimizations
2. **Explicit types** - always use TypeScript types, avoid `any`
3. **Descriptive names** - functions and variables should be self-documenting
4. **Comments for "why"** - explain reasoning, not what the code does
5. **Small functions** - each function should do one thing well

### Avoid

- Complex abstractions that obscure the flow
- Deeply nested callbacks or conditionals
- Magic numbers or strings without constants
- Overly DRY code that sacrifices readability

## Project Structure

```
app/
├── api/           # Backend API routes (Next.js App Router)
├── components/    # React UI components
├── contexts/      # React context providers
├── lib/           # Utility libraries and helpers
├── templates/     # Default code templates for new users
├── layout.tsx     # Root layout
└── page.tsx       # Main page (dynamic UI host)
```

### Key Files

| File | Purpose |
|------|---------|
| `app/lib/compiler.ts` | In-browser TypeScript/JSX compilation using Sucrase |
| `app/lib/component-scope.ts` | UI components available to dynamic code |
| `app/lib/schema.ts` | Schema definitions sent to Copilot for context |
| `app/lib/storage.ts` | Storage abstraction (file-system, extensible) |
| `app/components/DynamicRenderer.tsx` | Compiles and renders user code |
| `app/components/ChatFlyout.tsx` | Chat interface with Copilot |
| `app/api/chat/route.ts` | Copilot API integration endpoint |
| `app/templates/default/index.tsx` | Default starter template |

## API Routes

All API routes are in `app/api/` using Next.js App Router conventions:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/chat` | POST, DELETE | Copilot chat streaming |
| `/api/code` | GET, POST, DELETE, PUT | User code CRUD |
| `/api/schema` | GET | Component/API schema for Copilot |
| `/api/todos` | GET, POST, PATCH, DELETE | Sample Todo API |
| `/api/user` | GET, POST, PATCH | User management |

## Component Scope

When modifying `app/lib/component-scope.ts`, remember:

1. Components here are **available to dynamic code** at runtime
2. They run in a sandboxed `Function()` context
3. Each component should be **self-contained** (no external imports)
4. Use **Tailwind CSS** for styling
5. Update `app/lib/schema.ts` when adding components

Current components: `Button`, `Card`, `Input`, `Select`, `Checkbox`, `Badge`, `List`, `ListItem`, `Header`, `Spinner`, `Flex`, `fetchAPI`

## Storage System

The storage layer (`app/lib/storage.ts`) uses a **provider pattern**:

```typescript
interface StorageProvider {
  getUser(userId: string): Promise<User | null>;
  createUser(name: string): Promise<User>;
  // ... more methods
}
```

Currently uses `FileSystemStorageProvider`. The interface is designed to support:
- Git-based storage (one branch per user)
- Database storage
- Cloud storage

User data is stored in `.user-data/{userId}/`.

## Template System

Default templates live in `app/templates/default/`:

- `manifest.json` - Template metadata (name, entrypoint, files list)
- `index.tsx` - Main template file (has `@ts-nocheck` as it's runtime-compiled)

To add multi-file templates, update both the files and `manifest.json`.

## Dynamic Code Compilation

The compilation flow:

1. User code (TypeScript/JSX) is received as a string
2. `compiler.ts` uses Sucrase to transpile to JavaScript
3. Import statements are stripped (components come from scope)
4. `DynamicRenderer.tsx` creates a `Function()` with the scope injected
5. The function is executed to get a React component
6. Component is rendered with error boundary protection

## Chat Integration

The chat system (`ChatFlyout.tsx`) handles:

1. Streaming responses from Copilot via Server-Sent Events
2. Extracting code from `<dynamic-code>` tags in responses
3. Dispatching `dynamic-code-update` events for the renderer
4. Tool execution display (when Copilot uses tools)

## Event System

Custom events for cross-component communication:

| Event | Dispatched By | Listened By | Purpose |
|-------|--------------|-------------|---------|
| `dynamic-code-update` | ChatFlyout | page.tsx | New code from Copilot |
| `clear-chat-session` | UserProfile | ChatFlyout | Clear chat on user switch |
| `user-switched` | UserProfile | page.tsx | Reload code for new user |

## Common Tasks

### Adding a New UI Component

1. Add component function to `app/lib/component-scope.ts`
2. Export in `componentScope` object
3. Add schema entry in `app/lib/schema.ts`

### Adding a New API Endpoint

1. Create `app/api/[name]/route.ts`
2. Implement handlers (GET, POST, etc.)
3. Add to schema in `app/lib/schema.ts`

### Modifying the Default Template

1. Edit `app/templates/default/index.tsx`
2. Keep `@ts-nocheck` at top (runtime-compiled code)
3. Only use components from `componentScope`

### Adding Storage Providers

1. Implement `StorageProvider` interface in `storage.ts`
2. Create factory/config to select provider
3. Update the exported `storage` singleton

## Testing Changes

1. Run `npm run dev` for development server
2. Test UI changes by using the chat interface
3. Test API changes with the browser network tab or curl
4. Check for TypeScript errors with `npm run lint`

## Dependencies

Key packages:

- `@github/copilot-sdk` - GitHub Copilot API client
- `sucrase` - Fast TypeScript/JSX compiler
- `react-syntax-highlighter` - Code display
- `react-markdown` - Markdown rendering in chat

## Conventions

- Use `"use client"` directive for client components
- Prefer `async/await` over `.then()` chains
- Use early returns to reduce nesting
- Keep state as local as possible
- Use React hooks correctly (dependency arrays)
