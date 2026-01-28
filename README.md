# Dynamic UI with GitHub Copilot SDK

A demonstration application showcasing the **GitHub Copilot SDK** for building AI-powered, dynamically updating user interfaces. Users can chat with GitHub Copilot to modify the UI in real-time through natural language commands.

![Dynamic UI Demo](https://img.shields.io/badge/Next.js-16.1-black) ![Copilot SDK](https://img.shields.io/badge/Copilot_SDK-0.1.18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Overview

This application demonstrates a hybrid architecture where:

- **Fixed Components**: API routes and core infrastructure remain stable
- **Dynamic Components**: UI elements can be modified in real-time via chat

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
app/
├── api/                    # Backend API routes (fixed)
│   ├── chat/              # Copilot chat endpoint
│   │   └── route.ts       # Streaming chat with code generation
│   ├── code/              # User code storage CRUD
│   │   └── route.ts       # GET/POST/DELETE/PUT for code bundles
│   ├── schema/            # Component schema for Copilot context
│   │   └── route.ts       # Returns available components/APIs
│   ├── todos/             # Sample Todo API
│   │   └── route.ts       # CRUD operations for todos
│   └── user/              # User management
│       └── route.ts       # User CRUD operations
│
├── components/            # React components
│   ├── ChatFlyout.tsx     # Chat interface with Copilot
│   ├── ChatInput.tsx      # Message input component
│   ├── ChatMessage.tsx    # Message display with syntax highlighting
│   ├── ChatToggleButton.tsx # Floating chat button
│   ├── DynamicRenderer.tsx # Runtime code compilation & rendering
│   └── UserProfile.tsx    # User profile dropdown
│
├── contexts/              # React contexts
│   └── UserContext.tsx    # User state management
│
├── lib/                   # Utility libraries
│   ├── compiler.ts        # Sucrase-based TypeScript/JSX compiler
│   ├── component-scope.ts # UI components available to dynamic code
│   ├── schema.ts          # Schema definitions for Copilot
│   └── storage.ts         # File-system storage abstraction
│
├── templates/             # Default code templates
│   └── default/
│       ├── index.tsx      # Default Todo app template
│       └── manifest.json  # Template metadata
│
├── layout.tsx             # Root layout with providers
└── page.tsx               # Main dynamic UI page
```

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

### API Schema

The `/api/schema` endpoint provides Copilot with context about:
- Available UI components and their props
- API endpoints and their request/response formats
- Current code structure

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

1. Create a new route in `app/api/your-endpoint/route.ts`

2. Add the endpoint to the schema in `app/lib/schema.ts`:

```tsx
{
  path: "/api/your-endpoint",
  method: "GET",
  description: "What this endpoint does",
  response: { /* response shape */ },
}
```

### Modifying the Default Template

Edit `app/templates/default/index.tsx` to change what users see initially. This template is loaded for new users or when they reset.

### Adding Multiple Files to Templates

1. Add new files to `app/templates/default/`
2. Update `app/templates/default/manifest.json`:

```json
{
  "name": "My Template",
  "version": "1.0.0",
  "entrypoint": "index.tsx",
  "files": ["index.tsx", "components.tsx", "utils.ts"]
}
```

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
