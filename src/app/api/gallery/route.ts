import { NextResponse } from "next/server";
import { storage } from "@/app/lib/storage";

/**
 * Gallery API
 *
 * Returns all users that have saved designs, along with their code bundles.
 */
export async function GET() {
  const users = await storage.listUsers();

  const entries = await Promise.all(
    users.map(async (user) => {
      const bundle = await storage.getCodeBundle(user.id);
      if (!bundle || Object.keys(bundle.files).length === 0) return null;

      const entrypointCode = bundle.files[bundle.entrypoint] || "";
      return {
        userId: user.id,
        userName: user.name,
        createdAt: user.createdAt,
        updatedAt: bundle.updatedAt,
        version: bundle.version,
        entrypoint: bundle.entrypoint,
        code: entrypointCode,
      };
    })
  );

  // Filter out users with no saved designs
  const gallery = entries.filter(Boolean);

  return NextResponse.json({ gallery });
}
