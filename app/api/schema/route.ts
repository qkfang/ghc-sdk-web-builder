import { NextResponse } from "next/server";
import { componentDefinitions, generateSchemaDocumentation } from "@/app/lib/schema";
import { apiEndpoints, dataTypes, generateApiDocumentation } from "@/samples/todo-app/schema";

/**
 * GET /api/schema
 * Returns the schema of available components and APIs for Copilot context
 * 
 * Core components come from app/lib/schema.ts
 * Sample-specific APIs come from the active sample's schema.ts
 */
export async function GET() {
  // Generate combined documentation
  const apiDoc = generateApiDocumentation();
  const fullDocumentation = generateSchemaDocumentation(apiDoc, dataTypes);

  return NextResponse.json({
    // Core components (always available)
    components: componentDefinitions,
    
    // Sample-specific APIs
    apis: apiEndpoints,
    
    // Sample-specific data types
    types: {
      dataTypes,
    },
    
    // Full documentation for Copilot context
    documentation: fullDocumentation,
    
    // Available React hooks
    hooks: ["useState", "useEffect", "useCallback", "useMemo"],
    
    // Available utilities
    utilities: ["fetchAPI", "console.log", "console.error"],
    
    // Meta info
    sample: "todo-app",
  });
}
