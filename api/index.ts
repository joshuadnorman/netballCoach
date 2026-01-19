import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../server/_core/app";

// Reuse the Express app for Vercel serverless function.
// The app is created at module scope so middleware/registers run once per lambda instance.

export default function handler(req: VercelRequest, res: VercelResponse) {
  // @ts-ignore - Express request handler is compatible with Vercel's req/res shape
  return (app as any)(req, res);
}
