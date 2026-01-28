/**
 * Schema definitions for the dynamic UI system
 * This tells Copilot what components and APIs are available
 */

export interface ComponentDefinition {
  name: string;
  description: string;
  props: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

export interface APIEndpoint {
  path: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  description: string;
  parameters?: {
    name: string;
    type: string;
    in: "query" | "body";
    required: boolean;
    description: string;
  }[];
  response: {
    type: string;
    description: string;
  };
}

export const componentDefinitions: ComponentDefinition[] = [
  {
    name: "Button",
    description: "A clickable button component",
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Button content" },
      { name: "onClick", type: "() => void", required: false, description: "Click handler" },
      { name: "variant", type: "'primary' | 'secondary' | 'danger' | 'success'", required: false, description: "Button style variant" },
      { name: "size", type: "'sm' | 'md' | 'lg'", required: false, description: "Button size" },
      { name: "disabled", type: "boolean", required: false, description: "Disable the button" },
    ],
  },
  {
    name: "Card",
    description: "A container card with optional title",
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Card content" },
      { name: "title", type: "string", required: false, description: "Card title" },
    ],
  },
  {
    name: "Input",
    description: "Text input field",
    props: [
      { name: "value", type: "string", required: true, description: "Input value" },
      { name: "onChange", type: "(value: string) => void", required: true, description: "Change handler" },
      { name: "placeholder", type: "string", required: false, description: "Placeholder text" },
      { name: "type", type: "'text' | 'date' | 'email' | 'password'", required: false, description: "Input type" },
    ],
  },
  {
    name: "Select",
    description: "Dropdown select component",
    props: [
      { name: "value", type: "string", required: true, description: "Selected value" },
      { name: "onChange", type: "(value: string) => void", required: true, description: "Change handler" },
      { name: "options", type: "{ value: string; label: string }[]", required: true, description: "Options array" },
      { name: "placeholder", type: "string", required: false, description: "Placeholder text" },
    ],
  },
  {
    name: "Badge",
    description: "Small status badge/tag",
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Badge content" },
      { name: "color", type: "'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple'", required: false, description: "Badge color" },
    ],
  },
  {
    name: "Checkbox",
    description: "Checkbox input with optional label",
    props: [
      { name: "checked", type: "boolean", required: true, description: "Checked state" },
      { name: "onChange", type: "(checked: boolean) => void", required: true, description: "Change handler" },
      { name: "label", type: "string", required: false, description: "Label text" },
    ],
  },
  {
    name: "List",
    description: "Unordered list container",
    props: [
      { name: "children", type: "ReactNode", required: true, description: "List items" },
    ],
  },
  {
    name: "ListItem",
    description: "List item with background styling",
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Item content" },
    ],
  },
  {
    name: "Header",
    description: "Heading component (h1, h2, h3)",
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Header text" },
      { name: "level", type: "1 | 2 | 3", required: false, description: "Heading level (default: 1)" },
    ],
  },
  {
    name: "Spinner",
    description: "Loading spinner animation",
    props: [
      { name: "size", type: "'sm' | 'md' | 'lg'", required: false, description: "Spinner size" },
    ],
  },
  {
    name: "Flex",
    description: "Flexbox container for layout",
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Flex children" },
      { name: "direction", type: "'row' | 'col'", required: false, description: "Flex direction" },
      { name: "gap", type: "number", required: false, description: "Gap between items" },
      { name: "align", type: "'start' | 'center' | 'end' | 'stretch'", required: false, description: "Align items" },
      { name: "justify", type: "'start' | 'center' | 'end' | 'between' | 'around'", required: false, description: "Justify content" },
    ],
  },
];

export const apiEndpoints: APIEndpoint[] = [
  {
    path: "/api/todos",
    method: "GET",
    description: "Get all todos, optionally filtered by category or due date",
    parameters: [
      { name: "category", type: "string", in: "query", required: false, description: "Filter by category (e.g., 'work', 'personal')" },
      { name: "dueDate", type: "string (ISO date)", in: "query", required: false, description: "Filter by due date" },
    ],
    response: {
      type: "{ todos: Todo[], count: number, categories: string[] }",
      description: "List of todos with count and available categories",
    },
  },
  {
    path: "/api/todos",
    method: "POST",
    description: "Create a new todo item",
    parameters: [
      { name: "title", type: "string", in: "body", required: true, description: "Todo title" },
      { name: "category", type: "string", in: "body", required: true, description: "Todo category" },
      { name: "dueDate", type: "string (ISO date)", in: "body", required: false, description: "Due date" },
    ],
    response: {
      type: "{ todo: Todo, message: string }",
      description: "Created todo item",
    },
  },
  {
    path: "/api/todos",
    method: "PATCH",
    description: "Update a todo item (e.g., mark complete, change title)",
    parameters: [
      { name: "id", type: "string", in: "body", required: true, description: "Todo ID" },
      { name: "title", type: "string", in: "body", required: false, description: "New title" },
      { name: "completed", type: "boolean", in: "body", required: false, description: "Completion status" },
      { name: "category", type: "string", in: "body", required: false, description: "New category" },
    ],
    response: {
      type: "{ todo: Todo, message: string }",
      description: "Updated todo item",
    },
  },
  {
    path: "/api/todos",
    method: "DELETE",
    description: "Delete a todo by ID or all todos in a category",
    parameters: [
      { name: "id", type: "string", in: "query", required: false, description: "Todo ID to delete" },
      { name: "category", type: "string", in: "query", required: false, description: "Delete all in category" },
    ],
    response: {
      type: "{ message: string, deletedCount?: number }",
      description: "Deletion confirmation",
    },
  },
];

export const todoInterface = `
interface Todo {
  id: string;
  title: string;
  category: string;
  dueDate: string; // ISO date string
  completed: boolean;
  createdAt: string;
}
`;

/**
 * Generate the schema documentation for Copilot context
 */
export function generateSchemaDocumentation(): string {
  let doc = "## Available Components\n\n";

  for (const comp of componentDefinitions) {
    doc += `### ${comp.name}\n`;
    doc += `${comp.description}\n\n`;
    doc += "Props:\n";
    for (const prop of comp.props) {
      doc += `- \`${prop.name}\`: ${prop.type}${prop.required ? " (required)" : ""} - ${prop.description}\n`;
    }
    doc += "\n";
  }

  doc += "## Available API Endpoints\n\n";

  for (const api of apiEndpoints) {
    doc += `### ${api.method} ${api.path}\n`;
    doc += `${api.description}\n\n`;
    if (api.parameters && api.parameters.length > 0) {
      doc += "Parameters:\n";
      for (const param of api.parameters) {
        doc += `- \`${param.name}\` (${param.in}): ${param.type}${param.required ? " (required)" : ""} - ${param.description}\n`;
      }
    }
    doc += `\nResponse: ${api.response.type}\n\n`;
  }

  doc += "## Data Types\n\n```typescript\n" + todoInterface + "```\n";

  return doc;
}
