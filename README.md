# Dynamic UI with GitHub Copilot SDK

A demonstration application showcasing the **GitHub Copilot SDK** for building AI-powered, dynamically updating user interfaces. Users can chat with GitHub Copilot to modify the UI in real-time through natural language commands.

![Dynamic UI Demo](https://img.shields.io/badge/Next.js-16.1-black) ![Copilot SDK](https://img.shields.io/badge/Copilot_SDK-0.1.18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Overview

This application demonstrates a **two-layer architecture** that cleanly separates concerns:

### Core Framework (`app/`)
Stable infrastructure that powers the dynamic UI system:
- Chat integration with GitHub Copilot
- In-browser TypeScript compilation
- User management and storage
- Sandboxed UI component library

### Sample Applications (`samples/`)
Swappable demo apps that showcase the framework:
- UI templates (what users can modify)
- Sample-specific API schemas
- Self-contained and easily replaceable

Users interact with GitHub Copilot through a chat interface to request UI changes like "make the header blue" or "add a priority field to todos". Copilot generates new React/TypeScript code that is compiled and rendered instantly in the browser.

### Key Features

- **AI-Powered UI Modifications** - Chat with Copilot to change the UI
- **Instant Compilation** - In-browser TypeScript/JSX compilation using Sucrase
- **Multi-User Support** - Each user has their own code sandbox
- **Persistent Storage** - User code persists across sessions
- **Syntax Highlighting** - View generated code with proper highlighting
- **Reset Capability** - Restore to default template anytime

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **GitHub Copilot** subscription with API access
- **GitHub Personal Access Token** with Copilot scope

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd ghcp-cli
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
GITHUB_TOKEN=your_github_personal_access_token
```

> **Note**: Your GitHub token needs the `copilot` scope to access the Copilot API.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Start Chatting

1. Click the **"Chat with Copilot"** button in the bottom-right corner
2. Ask Copilot to modify the UI (e.g., "Add a dark mode toggle")
3. Watch the UI update instantly!

## Project Structure

```
├── app/                    # CORE FRAMEWORK (fixed)
│   ├── api/               
│   │   ├── chat/          # Copilot chat endpoint
│   │   ├── code/          # User code storage CRUD
│   │   ├── schema/        # Component schema (merges core + sample)
│   │   ├── user/          # User management
│   │   └── samples/       # Sample app APIs
│   │       └── todos/     # Todo sample API
│   │
│   ├── components/        # React UI components
│   │   ├── ChatFlyout.tsx
│   │   ├── DynamicRenderer.tsx
│   │   └── UserProfile.tsx
│   │
│   ├── contexts/          # React contexts
│   │   └── UserContext.tsx
│   │
│   ├── lib/               # Core utilities
│   │   ├── compiler.ts    # Sucrase-based compiler
│   │   ├── component-scope.ts # UI components for dynamic code
│   │   ├── schema.ts      # Core component schemas
│   │   └── storage.ts     # Storage abstraction
│   │
│   ├── layout.tsx
│   └── page.tsx
│
└── samples/                # SAMPLE APPLICATIONS (swappable)
    └── todo-app/
        ├── template/      # Default UI code
        │   ├── index.tsx
        │   └── manifest.json
        ├── schema.ts      # Sample API schema
        └── README.md
```

### Core vs Sample Separation

This architecture makes it easy to create new sample applications without touching the core framework.

| Layer | Location | Contains | Modify when... |
|-------|----------|----------|----------------|
| **Core** | `app/lib/schema.ts` | UI component definitions | Adding new UI primitives |
| **Core** | `app/lib/component-scope.ts` | Sandboxed components | Implementing new components |
| **Core** | `app/api/` | Framework APIs (chat, code, user) | Changing framework behavior |
| **Sample** | `samples/*/schema.ts` | API endpoint documentation | Adding sample-specific APIs |
| **Sample** | `samples/*/template/` | Default user code | Changing starter UI |
| **Sample** | `app/api/samples/*/` | Sample API implementations | Adding sample endpoints |

The `/api/schema` endpoint automatically merges core component schemas with sample API schemas, providing Copilot with complete context.

## Architecture

### How It Works

1. **User Request**: User types a modification request in chat
2. **Copilot Processing**: Request is sent to GitHub Copilot with schema context
3. **Code Generation**: Copilot generates new React/TypeScript code
4. **Compilation**: Sucrase compiles the code in-browser (~5ms)
5. **Rendering**: DynamicRenderer executes and displays the component
6. **Persistence**: Code is saved to user's storage

### Component Scope

Dynamic code has access to a sandboxed set of UI components:

| Component | Description |
|-----------|-------------|
| `Button` | Styled button with variants |
| `Card` | Container with shadow and padding |
| `Input` | Text input field |
| `Select` | Dropdown select |
| `Checkbox` | Checkbox input |
| `Badge` | Status/label badge |
| `List` / `ListItem` | List containers |
| `Header` | Section headers |
| `Spinner` | Loading indicator |
| `Flex` | Flexbox layout helper |
| `fetchAPI` | Fetch wrapper for API calls |

### Schema System

The `/api/schema` endpoint **merges two schema sources**:

1. **Core Schema** (`app/lib/schema.ts`)
   - UI components available to dynamic code
   - Component props and types
   - React hooks (useState, useEffect, etc.)

2. **Sample Schema** (`samples/todo-app/schema.ts`)
   - Sample-specific API endpoints
   - Request/response formats
   - Data models

This separation allows you to swap sample applications without modifying core framework code.

## Enhancing the Starter App

### Adding New UI Components

1. Add your component to `app/lib/component-scope.ts`:

```tsx
function MyComponent({ title, onClick }: { title: string; onClick?: () => void }) {
  return (
    <div className="p-4 bg-blue-100 rounded" onClick={onClick}>
      {title}
    </div>
  );
}
```

2. Export it in the `componentScope` object:

```tsx
export const componentScope = {
  // ... existing components
  MyComponent,
};
```

3. Update the schema in `app/lib/schema.ts`:

```tsx
{
  name: "MyComponent",
  description: "A custom component for...",
  props: [
    { name: "title", type: "string", required: true },
    { name: "onClick", type: "() => void", required: false },
  ],
}
```

### Adding New API Endpoints

1. Create a new route in `app/api/samples/your-endpoint/route.ts`

2. Add the endpoint to the sample schema in `samples/todo-app/schema.ts`:

```tsx
{
  path: "/api/samples/your-endpoint",
  method: "GET",
  description: "What this endpoint does",
  response: { /* response shape */ },
}
```

### Modifying the Default Template

Edit `samples/todo-app/template/index.tsx` to change what users see initially. This template is loaded for new users or when they reset.

### Adding Multiple Files to Templates

1. Add new files to `samples/todo-app/template/`
2. Update `samples/todo-app/template/manifest.json`:

```json
{
  "name": "My Template",
  "version": "1.0.0",
  "entrypoint": "index.tsx",
  "files": ["index.tsx", "components.tsx", "utils.ts"]
}
```

### Creating a New Sample Application

1. Create `samples/your-app/` with template/, schema.ts, README.md
2. Add API routes to `app/api/samples/your-endpoint/`
3. Update `app/lib/storage.ts` constructor to use your sample name
4. Update `app/api/schema/route.ts` to import your schema

## Storage

User data is stored in `.user-data/` directory:

```
.user-data/
└── {userId}/
    ├── user.json       # User metadata
    ├── bundle.json     # Code bundle metadata
    └── files/
        └── index.tsx   # User's code files
```

The storage layer (`app/lib/storage.ts`) uses a provider abstraction that can be extended to support:
- Git-based storage (branch per user)
- Database storage
- Cloud storage (S3, Azure Blob, etc.)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: GitHub Copilot SDK
- **Compilation**: Sucrase (in-browser)
- **Syntax Highlighting**: react-syntax-highlighter

## Future Enhancements

- [ ] Git integration for version control per user
- [ ] Checkpoint/rollback system
- [ ] Multi-page dynamic applications
- [ ] Real authentication (OAuth, etc.)
- [ ] Collaborative editing

## License

MIT
