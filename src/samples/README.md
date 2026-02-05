# Sample Applications

This folder contains sample applications that demonstrate the Dynamic UI framework.

## Available Samples

| Sample | Description |
|--------|-------------|
| [todo-app](./todo-app/) | A simple todo list with categories and filtering |

## Creating a New Sample

To create a new sample application:

### 1. Create the folder structure

```
samples/
└── your-sample/
    ├── template/
    │   ├── index.tsx      # Main UI component
    │   └── manifest.json  # Template metadata
    ├── schema.ts          # API schema definitions
    └── README.md          # Documentation
```

### 2. Create the API route

Add your API route to `app/api/samples/your-endpoint/route.ts`.

### 3. Create the template

The `template/index.tsx` file should:
- Start with `// @ts-nocheck` (runtime compiled)
- Export a default function component
- Use only components from the component scope
- Use `fetchAPI()` for API calls

### 4. Define the schema

Create `schema.ts` with:
- `sampleName` - Identifier for the sample
- `sampleDescription` - Human-readable description
- `apiEndpoints` - Array of API endpoint definitions
- `dataTypes` - TypeScript interfaces as a string
- `generateApiDocumentation()` - Function to generate docs

### 5. Update configuration

Update `app/lib/storage.ts` to point to your sample's template directory, or update the active sample configuration.

## Sample Requirements

Each sample must:
- Be self-contained with its own API, template, and schema
- Use the standard component scope (don't add custom imports to templates)
- Document its API endpoints and data types
- Include a README with modification examples
