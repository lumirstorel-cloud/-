import type { Request, Response } from 'express';
import app from '../src/serverApp';

// Vercel Serverless Function entry point
// Normalizes request path if Vercel rewrites strip the '/api' prefix
export default function handler(req: Request, res: Response) {
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}
