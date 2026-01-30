import { NextRequest, NextResponse } from "next/server";
import { CopilotClient, CopilotSession } from "@github/copilot-sdk";
import { generateSchemaDocumentation } from "@/app/lib/schema";
import { writeFile, unlink, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ImageData {
  base64: string;
  mimeType: string;
}

// Track temp files for cleanup
const TEMP_PREFIX = "copilot-img-";
let tempImagePaths: string[] = [];

/**
 * Save base64 image to temp file and return the path
 */
async function saveImageToTemp(image: ImageData): Promise<string> {
  // Determine file extension from mime type
  const ext = image.mimeType.split("/")[1] || "png";
  const filename = `${TEMP_PREFIX}${randomUUID()}.${ext}`;
  const tempPath = join(tmpdir(), filename);
  
  await writeFile(tempPath, Buffer.from(image.base64, "base64"));
  tempImagePaths.push(tempPath);
  
  console.log(`[Copilot API] Saved temp image: ${tempPath}`);
  return tempPath;
}

/**
 * Clean up all tracked temp image files
 */
async function cleanupTempImages(): Promise<void> {
  console.log(`[Copilot API] Cleaning up ${tempImagePaths.length} temp images`);
  
  for (const path of tempImagePaths) {
    try {
      await unlink(path);
      console.log(`[Copilot API] Deleted temp image: ${path}`);
    } catch (error) {
      // File may already be deleted, ignore
    }
  }
  tempImagePaths = [];
  
  // Also clean up any orphaned temp files from previous sessions
  try {
    const tempDir = tmpdir();
    const files = await readdir(tempDir);
    for (const file of files) {
      if (file.startsWith(TEMP_PREFIX)) {
        try {
          await unlink(join(tempDir, file));
          console.log(`[Copilot API] Cleaned up orphaned temp file: ${file}`);
        } catch {
          // Ignore errors
        }
      }
    }
  } catch {
    // Ignore errors reading temp dir
  }
}

let client: CopilotClient | null = null;
let session: CopilotSession | null = null;
let eventUnsubscribe: (() => void) | null = null;

async function getSession(): Promise<CopilotSession> {
  if (!client) {
    console.log("[Copilot SDK] Initializing new CopilotClient...");
    client = new CopilotClient();
    console.log("[Copilot SDK] Starting client connection...");
    await client.start();
    console.log("[Copilot SDK] Client connected successfully");
  }
  if (!session) {
    console.log("[Copilot SDK] Creating new session with model: claude-sonnet-4");
    session = await client.createSession({ 
      model: "claude-sonnet-4"
    });
    console.log("[Copilot SDK] Session created successfully");
    
    // Subscribe to session events for logging
    eventUnsubscribe = session.on((event) => {
      switch (event.type) {
        case "user.message":
          console.log(`[Copilot SDK] Event: user.message`);
          break;
        case "assistant.message":
          const content = event.data?.content || "";
          console.log(`[Copilot SDK] Event: assistant.message - "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
          break;
        case "assistant.message_delta":
          // Log deltas less verbosely
          console.log(`[Copilot SDK] Event: assistant.message_delta (streaming)`);
          break;
        case "assistant.turn_start":
          console.log(`[Copilot SDK] Event: assistant.turn_start`);
          break;
        case "assistant.turn_end":
          console.log(`[Copilot SDK] Event: assistant.turn_end`);
          break;
        case "assistant.intent":
          console.log(`[Copilot SDK] Event: assistant.intent - ${event.data?.intent}`);
          break;
        case "tool.execution_start":
          console.log(`[Copilot SDK] Event: tool.execution_start - ${event.data?.toolName}`);
          break;
        case "tool.execution_complete":
          console.log(`[Copilot SDK] Event: tool.execution_complete - ${event.data?.toolCallId} (success: ${event.data?.success})`);
          break;
        case "session.idle":
          console.log(`[Copilot SDK] Event: session.idle`);
          break;
        case "session.error":
          console.log(`[Copilot SDK] Event: session.error - ${event.data?.message}`);
          break;
        default:
          console.log(`[Copilot SDK] Event: ${event.type}`);
      }
    });
  }
  return session;
}

export async function POST(request: NextRequest) {
  const requestId = Date.now().toString(36);
  console.log(`[Copilot API][${requestId}] Received chat request`);

  try {
    const { messages, dynamicMode, currentCode, images } = (await request.json()) as { 
      messages: ChatMessage[];
      dynamicMode?: boolean;
      currentCode?: string;
      images?: ImageData[];
    };

    if (!messages || messages.length === 0) {
      console.log(`[Copilot API][${requestId}] Error: No messages provided`);
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    console.log(`[Copilot API][${requestId}] Messages count: ${messages.length}, Dynamic mode: ${dynamicMode}, Images: ${images?.length || 0}`);

    const currentSession = await getSession();

    // Get the last user message as the prompt
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (!lastUserMessage) {
      console.log(`[Copilot API][${requestId}] Error: No user message found`);
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    // Save images to temp files if provided
    const attachments: Array<{ type: "file"; path: string }> = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const tempPath = await saveImageToTemp(image);
        attachments.push({ type: "file", path: tempPath });
      }
      console.log(`[Copilot API][${requestId}] Saved ${attachments.length} images to temp files`);
    }

    // Build the prompt - add schema context for dynamic UI mode
    let prompt = lastUserMessage.content;
    
    if (dynamicMode) {
      const schemaDoc = generateSchemaDocumentation();
      const dynamicSystemContext = `
You are helping users customize a Todo application UI by generating React code.
The user will ask you to make UI changes. You should generate complete, working React component code.

IMPORTANT RULES:
1. When the user asks for a UI change, generate the COMPLETE updated component code
2. Wrap your code in <dynamic-code> tags like this:
   <dynamic-code>
   // Your complete React component code here
   export default function TodoApp() { ... }
   </dynamic-code>
3. You can ONLY use the components and APIs listed below
4. The component must have a default export
5. You have access to React hooks: useState, useEffect, useCallback, useMemo
6. Use fetchAPI(url, options) to make API calls - it returns a Promise
7. If the user asks questions about APIs or schemas available, or anything related to code, only respond with content related to the current sample application, not the entire code base
8  For styling, use Tailwind CSS classes only, no other CSS-in-JS or styling methods

${schemaDoc}

CURRENT CODE (modify this based on user request):
\`\`\`tsx
${currentCode || "// No current code"}
\`\`\`

Remember: Always provide the COMPLETE component code wrapped in <dynamic-code> tags.
After the code, briefly explain what you changed.
`;
      prompt = dynamicSystemContext + "\n\nUser request: " + lastUserMessage.content;
    }

    console.log(`[Copilot API][${requestId}] Sending prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);;

    // Use sendAndWait for a simple request/response flow
    // Include attachments if we have images
    const response = await currentSession.sendAndWait({ 
      prompt,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    
    // Extract content from the response - sendAndWait returns an event with data.content
    const content = response?.data?.content || "";
    const messageId = response?.data?.messageId || "";
    
    console.log(`[Copilot API][${requestId}] Got response: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);

    return NextResponse.json({
      content,
      messageId,
    });
  } catch (error) {
    console.error(`[Copilot API][${requestId}] Error:`, error);
    session = null;
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get response from Copilot",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  console.log("[Copilot API] Resetting session");
  
  // Clean up temp image files
  await cleanupTempImages();
  
  // Unsubscribe from events
  if (eventUnsubscribe) {
    eventUnsubscribe();
    eventUnsubscribe = null;
  }
  
  try {
    if (session) {
      await session.destroy();
    }
  } catch (error) {
    console.error("[Copilot API] Error destroying session:", error);
  }
  
  session = null;
  
  return NextResponse.json({ success: true });
}
