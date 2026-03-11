import { NextRequest, NextResponse } from "next/server";
import { CopilotClient, CopilotSession, approveAll } from "@github/copilot-sdk";
import { generateSchemaDocumentation } from "@/app/lib/schema";
import { writeFile, unlink, readdir } from "fs/promises";
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
    } catch {
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

async function getSession(): Promise<CopilotSession> {
  if (!client) {
    console.log("[Copilot SDK] Initializing new CopilotClient...");
    client = new CopilotClient();
    console.log("[Copilot SDK] Starting client connection...");
    await client.start();
    console.log("[Copilot SDK] Client connected successfully");
    
    // Check authentication status before proceeding
    const authStatus = await client.getAuthStatus();
    console.log(`[Copilot SDK] Auth status: ${JSON.stringify(authStatus)}`);
    if (!authStatus.isAuthenticated) {
      client = null;
      throw new Error(
        authStatus.statusMessage || 
        "Not authenticated. Run 'copilot' and use /login, or set GH_TOKEN environment variable."
      );
    }
    console.log(`[Copilot SDK] Authenticated as: ${authStatus.login} via ${authStatus.authType}`);
  }
  if (!session) {
    console.log("[Copilot SDK] Creating new session with model: claude-sonnet-4");
    session = await client.createSession({ 
      model: "claude-sonnet-4",
      streaming: true,
      onPermissionRequest: approveAll,
    });
    console.log("[Copilot SDK] Session created successfully with streaming enabled");
    
    // Subscribe to session error events globally
    session.on((event) => {
      if (event.type === "session.error") {
        console.error(`[Copilot SDK] Session error [${event.data.errorType}]: ${event.data.message}`);
        if (event.data.stack) {
          console.error(`[Copilot SDK] Stack: ${event.data.stack}`);
        }
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

    // Build the prompt
    let prompt = lastUserMessage.content;
    
    if (dynamicMode) {
      const schemaDoc = generateSchemaDocumentation();
      const dynamicSystemContext = `
You are helping users customize a Todo application UI by generating React code.
The user will ask you to make UI changes. You should generate complete, working React component code.

CRITICAL: You MUST ALWAYS output the complete updated code wrapped in <dynamic-code> tags. 
DO NOT just describe changes - the code will not update unless you provide the actual code.

IMPORTANT RULES:
1. When the user asks for ANY UI change (styling, layout, spacing, colors, etc.), you MUST generate the COMPLETE updated component code
2. ALWAYS wrap your code in <dynamic-code> tags like this:
   <dynamic-code>
   // Your complete React component code here
   export default function TodoApp() { ... }
   </dynamic-code>
3. You can ONLY use the components and APIs listed below
4. The component must have a default export
5. You have access to React hooks: useState, useEffect, useCallback, useMemo
6. Use fetchAPI(url, options) to make API calls - it returns a Promise
7. If the user asks questions about APIs or schemas available, or anything related to code, only respond with content related to the current sample application, not the entire code base
8. For styling, use Tailwind CSS classes only, no other CSS-in-JS or styling methods
9. NEVER respond with just a description of changes. ALWAYS include the actual code.

${schemaDoc}

CURRENT CODE (modify this based on user request):
\`\`\`tsx
${currentCode || "// No current code"}
\`\`\`

Remember: You MUST provide the COMPLETE component code wrapped in <dynamic-code> tags for ANY change request.
After the code, briefly explain what you changed.
`;
      prompt = dynamicSystemContext + "\n\nUser request: " + lastUserMessage.content;
    }

    console.log(`[Copilot API][${requestId}] Sending prompt with streaming enabled`);

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let finalContent = "";
        let messageId = "";
        let streamClosed = false;
        
        // Safety timeout to prevent hanging forever (2 minutes)
        const timeoutId = setTimeout(() => {
          if (!streamClosed) {
            console.error(`[Copilot SDK] Timeout waiting for response`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "error",
              message: "Request timed out waiting for response",
            })}\n\n`));
            streamClosed = true;
            controller.close();
          }
        }, 120000);
        
        const closeStream = () => {
          if (!streamClosed) {
            streamClosed = true;
            clearTimeout(timeoutId);
            controller.close();
          }
        };
        
        // Subscribe to session events
        const unsubscribe = currentSession.on((event) => {
          if (streamClosed) return;
          
          try {
            // Log all events to help debug
            console.log(`[Copilot SDK] Event: ${event.type}`, event.data ? JSON.stringify(event.data).substring(0, 200) : '');
            
            switch (event.type) {
              case "tool.execution_start":
                console.log(`[Copilot SDK] Tool start: ${event.data?.toolName}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "tool.start",
                  toolId: event.data?.toolCallId || randomUUID(),
                  toolName: event.data?.toolName,
                  arguments: event.data?.arguments,
                })}\n\n`));
                break;
                
              case "tool.execution_complete":
                console.log(`[Copilot SDK] Tool complete: ${event.data?.toolCallId}`);
                const resultStr = typeof event.data?.result === 'string' 
                  ? event.data.result 
                  : JSON.stringify(event.data?.result);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "tool.complete",
                  toolId: event.data?.toolCallId,
                  success: event.data?.success,
                  result: resultStr?.substring(0, 500),
                })}\n\n`));
                break;

              case "assistant.reasoning_delta":
                // Stream reasoning deltas
                if (event.data?.deltaContent) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: "reasoning",
                    content: event.data.deltaContent,
                  })}\n\n`));
                }
                break;

              case "assistant.reasoning":
                // Final reasoning complete
                console.log(`[Copilot SDK] Final reasoning received`);
                break;
                
              case "assistant.message_delta":
                // First message delta signals we're now generating the response
                // Send a working event (only need to send once, but it's idempotent)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "working",
                })}\n\n`));
                break;
                
              case "assistant.message":
                // Final message
                finalContent = event.data?.content || "";
                messageId = event.data?.messageId || "";
                console.log(`[Copilot SDK] Final message: "${finalContent.substring(0, 100)}..."`);
                break;
                
              case "session.idle":
                console.log(`[Copilot SDK] Session idle, sending final message`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "done",
                  content: finalContent,
                  messageId: messageId,
                })}\n\n`));
                unsubscribe();
                closeStream();
                break;
                
              case "session.error":
                console.error(`[Copilot SDK] Session error: ${event.data?.message}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "error",
                  message: event.data?.message || "Unknown error",
                })}\n\n`));
                unsubscribe();
                closeStream();
                break;
            }
          } catch (err) {
            console.error(`[Copilot SDK] Error processing event:`, err);
          }
        });

        // Send the message
        try {
          await currentSession.send({ 
            prompt,
            attachments: attachments.length > 0 ? attachments : undefined,
          });
        } catch (err) {
          console.error(`[Copilot SDK] Error sending message:`, err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "error",
            message: err instanceof Error ? err.message : "Failed to send message",
          })}\n\n`));
          unsubscribe();
          closeStream();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
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
