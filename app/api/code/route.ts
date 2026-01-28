import { NextRequest, NextResponse } from "next/server";
import { storage, CodeBundle } from "@/app/lib/storage";

/**
 * Code API
 * 
 * Manages user code bundles with file-system persistence.
 * Uses the storage abstraction layer for easy extension to Git, DB, etc.
 */

/**
 * GET /api/code - Get the current user's code
 * 
 * Query params:
 * - userId: string (required) - User identifier
 * - file: string (optional) - Get specific file, otherwise returns entrypoint
 * - all: boolean (optional) - Return all files in the bundle
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "default";
  const requestedFile = searchParams.get("file");
  const returnAll = searchParams.get("all") === "true";

  let bundle: CodeBundle;
  let isDefault = false;

  // Try to get user's saved code
  const userBundle = await storage.getCodeBundle(userId);
  
  if (userBundle && Object.keys(userBundle.files).length > 0) {
    bundle = userBundle;
  } else {
    // Fall back to default template
    bundle = await storage.getDefaultTemplate();
    isDefault = true;
  }

  // Return all files
  if (returnAll) {
    return NextResponse.json({
      files: bundle.files,
      entrypoint: bundle.entrypoint,
      version: bundle.version,
      updatedAt: bundle.updatedAt,
      isDefault,
    });
  }

  // Return specific file or entrypoint
  const filename = requestedFile || bundle.entrypoint;
  const code = bundle.files[filename];

  if (!code) {
    return NextResponse.json(
      { error: `File "${filename}" not found` },
      { status: 404 }
    );
  }

  // For backwards compatibility, also return as "code"
  return NextResponse.json({
    code,
    filename,
    files: Object.keys(bundle.files),
    entrypoint: bundle.entrypoint,
    version: bundle.version,
    updatedAt: bundle.updatedAt,
    isDefault,
  });
}

/**
 * POST /api/code - Save user's code
 * 
 * Body:
 * - code: string - Code content (saves to entrypoint or specified file)
 * - file: string (optional) - Filename to save to
 * - files: Record<string, string> (optional) - Save multiple files at once
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const body = await request.json();

    // Get existing bundle or create from default
    let bundle = await storage.getCodeBundle(userId);
    if (!bundle || Object.keys(bundle.files).length === 0) {
      const defaultTemplate = await storage.getDefaultTemplate();
      bundle = {
        ...defaultTemplate,
        files: { ...defaultTemplate.files },
        version: 0,
      };
    }

    // Handle multi-file save
    if (body.files && typeof body.files === "object") {
      for (const [filename, content] of Object.entries(body.files)) {
        if (typeof content === "string") {
          bundle.files[filename] = content;
        }
      }
      if (body.entrypoint) {
        bundle.entrypoint = body.entrypoint;
      }
    }
    // Handle single file save
    else if (body.code && typeof body.code === "string") {
      const filename = body.file || bundle.entrypoint;
      bundle.files[filename] = body.code;
    } else {
      return NextResponse.json(
        { error: "Either 'code' or 'files' is required" },
        { status: 400 }
      );
    }

    // Update metadata
    bundle.version += 1;
    bundle.updatedAt = new Date().toISOString();

    // Save to storage
    await storage.saveCodeBundle(userId, bundle);

    return NextResponse.json({
      success: true,
      version: bundle.version,
      updatedAt: bundle.updatedAt,
      files: Object.keys(bundle.files),
    });
  } catch (error) {
    console.error("Failed to save code:", error);
    return NextResponse.json(
      { error: "Failed to save code" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/code - Reset user's code to default
 * 
 * Query params:
 * - userId: string (required)
 * - file: string (optional) - Delete specific file only
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "default";
  const fileToDelete = searchParams.get("file");

  if (fileToDelete) {
    // Delete specific file
    const bundle = await storage.getCodeBundle(userId);
    if (bundle && bundle.files[fileToDelete]) {
      delete bundle.files[fileToDelete];
      bundle.version += 1;
      bundle.updatedAt = new Date().toISOString();
      await storage.saveCodeBundle(userId, bundle);
      return NextResponse.json({
        success: true,
        message: `File "${fileToDelete}" deleted`,
        version: bundle.version,
      });
    }
    return NextResponse.json(
      { error: `File "${fileToDelete}" not found` },
      { status: 404 }
    );
  }

  // Reset entire bundle to default
  await storage.deleteCodeBundle(userId);

  return NextResponse.json({
    success: true,
    message: "Code reset to default",
  });
}

/**
 * PUT /api/code - Create or rename a file
 * 
 * Body:
 * - oldName: string - Current filename (for rename)
 * - newName: string - New filename
 * - content: string (optional) - Content for new file
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const body = await request.json();
    const { oldName, newName, content } = body;

    if (!newName) {
      return NextResponse.json(
        { error: "'newName' is required" },
        { status: 400 }
      );
    }

    let bundle = await storage.getCodeBundle(userId);
    if (!bundle || Object.keys(bundle.files).length === 0) {
      const defaultTemplate = await storage.getDefaultTemplate();
      bundle = {
        ...defaultTemplate,
        files: { ...defaultTemplate.files },
        version: 0,
      };
    }

    if (oldName && bundle.files[oldName]) {
      // Rename: copy content to new name, delete old
      bundle.files[newName] = bundle.files[oldName];
      delete bundle.files[oldName];
      
      // Update entrypoint if renamed
      if (bundle.entrypoint === oldName) {
        bundle.entrypoint = newName;
      }
    } else {
      // Create new file
      bundle.files[newName] = content || "";
    }

    bundle.version += 1;
    bundle.updatedAt = new Date().toISOString();
    await storage.saveCodeBundle(userId, bundle);

    return NextResponse.json({
      success: true,
      version: bundle.version,
      files: Object.keys(bundle.files),
    });
  } catch (error) {
    console.error("Failed to update file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}
