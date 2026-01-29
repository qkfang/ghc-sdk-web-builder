import { transform } from "sucrase";

export interface CompileResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * Strip import statements from source code
 * Since we provide all dependencies via scope, imports are not needed
 */
function stripImports(source: string): string {
  // Remove import statements (handles multi-line imports too)
  return source
    // Remove: import X from 'Y'
    .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?\s*$/gm, '')
    // Remove: import 'Y'
    .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '')
    // Remove: import { X } from 'Y'
    .replace(/^\s*import\s*\{[\s\S]*?\}\s*from\s+['"][^'"]+['"];?\s*$/gm, '')
    // Clean up multiple blank lines
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Compile TypeScript/JSX code to JavaScript
 * Uses Sucrase for fast, lightweight compilation
 */
export function compileCode(source: string): CompileResult {
  try {
    // Strip imports first since we provide everything via scope
    const strippedSource = stripImports(source);
    
    const result = transform(strippedSource, {
      transforms: ["typescript", "jsx", "imports"],
      // Use classic JSX runtime so it uses React.createElement from our scope
      jsxRuntime: "classic",
      production: true,
    });

    return {
      success: true,
      code: result.code,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown compilation error",
    };
  }
}

/**
 * Compile and create a React component from source code
 * Returns a function that can be called with scope to get the component
 */
export function compileToComponent(
  source: string,
  scope: Record<string, unknown>
): { success: boolean; Component?: React.ComponentType; error?: string } {
  const compiled = compileCode(source);

  if (!compiled.success || !compiled.code) {
    return { success: false, error: compiled.error };
  }

  try {
    // Filter out reserved names from scope to avoid duplicate parameters
    const reservedNames = new Set(["React", "exports", "module"]);
    const scopeEntries = Object.entries(scope).filter(
      ([key]) => !reservedNames.has(key)
    );
    const scopeKeys = scopeEntries.map(([key]) => key);
    const scopeValues = scopeEntries.map(([, value]) => value);

    // Wrap the code to capture the default export
    const wrappedCode = `
      ${compiled.code}
      return typeof exports !== 'undefined' && exports.default ? exports.default : 
             typeof module !== 'undefined' && module.exports ? module.exports : 
             null;
    `;

    // Create function with scope variables as parameters
    const factory = new Function(
      "React",
      "exports",
      "module",
      ...scopeKeys,
      wrappedCode
    );

    // Execute with scope
    const exports: Record<string, unknown> = {};
    // eslint-disable-next-line @next/next/no-assign-module-variable
    const module = { exports };
    const Component = factory(
      scope.React,
      exports,
      module,
      ...scopeValues
    );

    if (!Component) {
      return { success: false, error: "No default export found" };
    }

    return { success: true, Component };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Runtime error",
    };
  }
}
