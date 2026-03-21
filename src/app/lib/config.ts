/**
 * Application Configuration
 * 
 * Centralized configuration that can be customized via environment variables.
 */

/**
 * Get the active sample name from environment variable.
 * Defaults to "startup-app" if not specified.
 * 
 * Set via: SAMPLE_NAME=your-sample-name
 */
export function getActiveSampleName(): string {
  return process.env.SAMPLE_NAME || "startup-app";
}

/**
 * Get the path to the samples directory
 */
export function getSamplesDir(): string {
  return "samples";
}

/**
 * Configuration object for easy access
 */
export const config = {
  get sampleName() {
    return getActiveSampleName();
  },
  get samplesDir() {
    return getSamplesDir();
  },
};
