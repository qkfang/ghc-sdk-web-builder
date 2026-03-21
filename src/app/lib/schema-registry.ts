/**
 * Schema Registry
 * 
 * Dynamically loads and provides sample schemas based on the active sample.
 * Each sample must export: apiEndpoints, dataTypes, generateApiDocumentation
 */

import { APIEndpoint } from "@/app/lib/schema";

// Import all sample schemas
// Add new samples here as they are created
import * as todoAppSchema from "@/samples/startup-app/schema";

/**
 * Schema module interface - what each sample schema must export
 */
export interface SampleSchema {
  sampleName: string;
  sampleDescription: string;
  apiEndpoints: APIEndpoint[];
  dataTypes: string;
  generateApiDocumentation: () => string;
}

/**
 * Registry of all available sample schemas
 * Key is the folder name under samples/
 */
const schemaRegistry: Record<string, SampleSchema> = {
  "startup-app": todoAppSchema,
  // Add new samples here:
  // "my-sample": myAppSchema,
};

/**
 * Get the active sample name from environment
 */
export function getActiveSampleName(): string {
  return process.env.SAMPLE_NAME || "startup-app";
}

/**
 * Get the schema for the active sample
 * Falls back to startup-app if the specified sample doesn't exist
 */
export function getActiveSchema(): SampleSchema {
  const sampleName = getActiveSampleName();
  const schema = schemaRegistry[sampleName];
  
  if (!schema) {
    console.warn(`[Schema Registry] Sample "${sampleName}" not found, falling back to startup-app`);
    return schemaRegistry["startup-app"];
  }
  
  return schema;
}

/**
 * Get all available sample names
 */
export function getAvailableSamples(): string[] {
  return Object.keys(schemaRegistry);
}

/**
 * Check if a sample exists in the registry
 */
export function hasSample(sampleName: string): boolean {
  return sampleName in schemaRegistry;
}

/**
 * Get a specific sample's schema
 */
export function getSampleSchema(sampleName: string): SampleSchema | undefined {
  return schemaRegistry[sampleName];
}
