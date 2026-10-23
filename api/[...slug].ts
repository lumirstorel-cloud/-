import type { Request, Response } from 'express';
import app from '../src/serverApp';

// Vercel Serverless Function entry point for catch-all /api/* routes
export default function handler(req: Request, res: Response) {
  const matchedPath = req.headers['x-matched-path'];
  if (typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
    req.url = matchedPath;
  } else if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}
