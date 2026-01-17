
// This service is disabled for the offline version.
export async function generateAInames(): Promise<any[]> {
  console.warn("AI Generation is disabled in offline mode.");
  return [];
}
