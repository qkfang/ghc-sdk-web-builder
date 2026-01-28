import { NextResponse } from "next/server";
import { componentDefinitions, apiEndpoints, todoInterface, generateSchemaDocumentation } from "@/app/lib/schema";

/**
 * GET /api/schema
 * Returns the schema of available components and APIs for Copilot context
 */
export async function GET() {
  return NextResponse.json({
    components: componentDefinitions,
    apis: apiEndpoints,
    types: {
      Todo: todoInterface,
    },
    documentation: generateSchemaDocumentation(),
    hooks: ["useState", "useEffect", "useCallback", "useMemo"],
    utilities: ["fetchAPI", "console.log", "console.error"],
  });
}
