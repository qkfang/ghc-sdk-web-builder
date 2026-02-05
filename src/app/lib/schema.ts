/**
 * Core Schema Definitions for the Dynamic UI System
 * 
 * This file contains the CORE component definitions that are always available.
 * Sample-specific API schemas are loaded dynamically from the samples folder.
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

/**
 * Core UI Components available to dynamic code
 */
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

/**
 * Generate the core component documentation for Copilot context
 */
export function generateComponentDocumentation(): string {
  let doc = "## Available UI Components\n\n";

  for (const comp of componentDefinitions) {
    doc += `### ${comp.name}\n`;
    doc += `${comp.description}\n\n`;
    doc += "Props:\n";
    for (const prop of comp.props) {
      doc += `- \`${prop.name}\`: ${prop.type}${prop.required ? " (required)" : ""} - ${prop.description}\n`;
    }
    doc += "\n";
  }

  return doc;
}

/**
 * Generate combined schema documentation (components + sample APIs)
 * @param sampleApiDoc - API documentation from the active sample
 * @param sampleDataTypes - Data type definitions from the active sample
 */
export function generateSchemaDocumentation(
  sampleApiDoc?: string,
  sampleDataTypes?: string
): string {
  let doc = generateComponentDocumentation();

  if (sampleApiDoc) {
    doc += sampleApiDoc;
  }

  if (sampleDataTypes) {
    doc += "\n## Data Types\n\n```typescript\n" + sampleDataTypes + "```\n";
  }

  return doc;
}
