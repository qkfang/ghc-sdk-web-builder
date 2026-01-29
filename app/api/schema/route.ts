import { NextResponse } from "next/server";
import { componentDefinitions, generateSchemaDocumentation } from "@/app/lib/schema";
import { getActiveSchema, getActiveSampleName, getAvailableSamples } from "@/app/lib/schema-registry";

/**
 * GET /api/schema
 * Returns the schema of available components and APIs for Copilot context
 * 
 * Core components come from app/lib/schema.ts
 * Sample-specific APIs come from the active sample via the schema registry
 */
export async function GET() {
  // Get the active sample's schema from the registry
  const sampleName = getActiveSampleName();
  const sampleSchema = getActiveSchema();
  
  // Generate combined documentation
  const apiDoc = sampleSchema.generateApiDocumentation();
  const fullDocumentation = generateSchemaDocumentation(apiDoc, sampleSchema.dataTypes);

  return NextResponse.json({
    // Core components (always available)
    components: componentDefinitions,
    
    // Sample-specific APIs
    apis: sampleSchema.apiEndpoints,
    
    // Sample-specific data types
    types: {
      dataTypes: sampleSchema.dataTypes,
    },
    
    // Full documentation for Copilot context
    documentation: fullDocumentation,
    
    // Available React hooks
    hooks: ["useState", "useEffect", "useCallback", "useMemo"],
    
    // Available utilities
    utilities: ["fetchAPI", "console.log", "console.error"],
    
    // Meta info - active sample and available samples
    sample: sampleName,
    sampleDescription: sampleSchema.sampleDescription,
    availableSamples: getAvailableSamples(),
  });
}
