# Copilot Instructions for Dynamic UI Demo

This document provides guidance for AI agents working on this codebase.

## Project Overview

This is a **demonstration application** for the GitHub Copilot SDK. It showcases how to build AI-powered, dynamically updating user interfaces where users can modify the UI through natural language chat.

### Core Concept: Two-Layer Architecture

The codebase is split into two distinct layers:

| Layer | Location | Stability | Purpose |
|-------|----------|-----------|----------|
| **Core Framework** | `app/` | Stable | Provides the dynamic UI engine, chat integration, compilation, and UI primitives |
| **Sample Applications** | `samples/` | Swappable | Contains demo apps that showcase the framework - can be replaced without touching core |

This separation means:
- Adding a new sample app requires minimal changes to core code
- Core UI components and utilities are shared across all samples
- Each sample defines its own API schema and default template

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
├── app/                    # CORE FRAMEWORK (fixed)
│   ├── api/               
│   │   ├── chat/          # Copilot chat endpoint
│   │   ├── code/          # User code storage
│   │   ├── schema/        # Schema endpoint (merges core + sample)
│   │   ├── user/          # User management
│   │   └── samples/       # Sample app APIs (e.g., todos)
│   ├── components/        # React UI components
│   ├── contexts/          # React context providers
│   ├── lib/               # Core utilities
│   │   ├── compiler.ts    # Sucrase compilation
│   │   ├── component-scope.ts # Available UI components
│   │   ├── schema.ts      # Core component schemas
│   │   └── storage.ts     # Storage abstraction
│   ├── layout.tsx
│   └── page.tsx
│
└── samples/                # SAMPLE APPLICATIONS (swappable)
    └── todo-app/
        ├── template/      # Default code template
        │   ├── index.tsx  # Main UI (runtime compiled)
        │   └── manifest.json
        ├── schema.ts      # Sample-specific API schema
        └── README.md
```

### Key Separation

| Location | Purpose | Modify when... |
|----------|---------|----------------|
| `app/lib/` | Core components & utilities | Adding new UI primitives |
| `app/api/samples/` | Sample app APIs | Adding/changing sample features |
| `samples/*/template/` | Default user code | Changing starter template |
| `samples/*/schema.ts` | Sample API documentation | Adding sample endpoints |

## API Routes

Core routes (in `app/api/`):

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/chat` | POST, DELETE | Copilot chat streaming |
| `/api/code` | GET, POST, DELETE, PUT | User code CRUD |
| `/api/schema` | GET | Component/API schema for Copilot |
| `/api/user` | GET, POST, PATCH | User management |

Sample routes (in `app/api/samples/`):

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/samples/todos` | GET, POST, PATCH, DELETE | Todo app API |

## Component Scope

When modifying `app/lib/component-scope.ts`, remember:

1. Components here are **available to dynamic code** at runtime
2. They run in a sandboxed `Function()` context
3. Each component should be **self-contained** (no external imports)
4. Use **Tailwind CSS** for styling
5. Update `app/lib/schema.ts` when adding components

Current components: `Button`, `Card`, `Input`, `Select`, `Checkbox`, `Badge`, `List`, `ListItem`, `Header`, `Spinner`, `Flex`, `fetchAPI`

## Schema System

Schemas are split between core and sample:

| Schema | Location | Contents |
|--------|----------|----------|
| **Core** | `app/lib/schema.ts` | UI components, props, React hooks |
| **Sample** | `samples/todo-app/schema.ts` | API endpoints, data models |

The `/api/schema/route.ts` **merges both schemas** when providing context to Copilot. This allows:
- Core components to be reused across samples
- Each sample to define its own API documentation
- Clean separation between framework and application

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

## Sample System

Sample applications live in `samples/`:

```
samples/
└── todo-app/
    ├── template/
    │   ├── index.tsx      # Default UI (has @ts-nocheck)
    │   └── manifest.json  # Template metadata
    ├── schema.ts          # API schema for this sample
    └── README.md
```

### Creating a New Sample

1. Create `samples/your-app/` with template/, schema.ts, README.md
2. Add API routes to `app/api/samples/your-endpoint/`
3. Update `app/lib/storage.ts` constructor to use your sample
4. Update `app/api/schema/route.ts` to import your schema

### Modifying the Todo Sample

1. Edit `samples/todo-app/template/index.tsx` for UI changes
2. Edit `app/api/samples/todos/route.ts` for API changes
3. Update `samples/todo-app/schema.ts` when adding endpoints

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

1. Sending prompts to the Copilot API via `sendAndWait`
2. Extracting code from `<dynamic-code>` tags in responses
3. Dispatching `dynamic-code-update` events for the renderer
4. Persisting chat history to localStorage

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

1. Create `app/api/samples/[name]/route.ts`
2. Implement handlers (GET, POST, etc.)
3. Add to schema in `samples/[sample]/schema.ts`

### Modifying the Default Template

1. Edit `samples/todo-app/template/index.tsx`
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
