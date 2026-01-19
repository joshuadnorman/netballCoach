import { app } from "../server/_core/app";

// Export the Express `app` directly. Vercel's Node builder will use it as the handler.
export default app as any;
