# Todo App Sample

This is a sample application for the Dynamic UI Demo framework. It provides a simple todo list application with category filtering.

## Structure

```
todo-app/
├── template/
│   ├── index.tsx      # Main UI component (runtime compiled)
│   └── manifest.json  # Template metadata
├── schema.ts          # API schema definitions
└── README.md          # This file
```

## API Endpoints

The todo API is available at `/api/samples/todos`:

| Method | Description |
|--------|-------------|
| GET | Get all todos, with optional category/date filters |
| POST | Create a new todo |
| PATCH | Update a todo (toggle complete, change title, etc.) |
| DELETE | Delete a todo by ID or all in a category |

## How to Modify

### Changing the UI

Edit `template/index.tsx`. This file is compiled at runtime and has access to:
- React hooks: `useState`, `useEffect`, `useCallback`, `useMemo`
- UI components: `Button`, `Card`, `Input`, `Select`, `Checkbox`, `Badge`, `List`, `ListItem`, `Header`, `Spinner`, `Flex`
- API helper: `fetchAPI(url, options)`

### Changing the API

1. Edit the route handler in `app/api/samples/todos/route.ts`
2. Update the schema in `schema.ts` to reflect changes

### Adding Features

Common modifications users might request via chat:
- "Add a priority field to todos"
- "Add a due date picker"
- "Add a dark mode toggle"
- "Show completed todos in a separate section"
- "Add drag and drop reordering"
