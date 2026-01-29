import { NextRequest, NextResponse } from "next/server";
import { CopilotClient, CopilotSession } from "@github/copilot-sdk";
import { generateSchemaDocumentation } from "@/app/lib/schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
  }
  if (!session) {
    console.log("[Copilot SDK] Creating new session with model: claude-sonnet-4");
    session = await client.createSession({ 
      model: "claude-sonnet-4"
    });
    console.log("[Copilot SDK] Session created successfully");
  }
  return session;
}

export async function POST(request: NextRequest) {
  const requestId = Date.now().toString(36);
  console.log(`[Copilot API][${requestId}] Received chat request`);

  try {
    const { messages, dynamicMode, currentCode } = (await request.json()) as { 
      messages: ChatMessage[];
      dynamicMode?: boolean;
      currentCode?: string;
    };

    if (!messages || messages.length === 0) {
      console.log(`[Copilot API][${requestId}] Error: No messages provided`);
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    console.log(`[Copilot API][${requestId}] Messages count: ${messages.length}, Dynamic mode: ${dynamicMode}`);

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
    const response = await currentSession.sendAndWait({ prompt });
    
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
