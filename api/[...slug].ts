import app from './_serverApp.bundle.js';

// Vercel Serverless Function entry point for catch-all /api/* routes
// Vercel Node runtime natively recognizes and wraps Express app instances
export default app;

