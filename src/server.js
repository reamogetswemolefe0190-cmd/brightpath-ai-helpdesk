import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { askHelpDesk } from './llmClient.js';
import { DOCUMENTS } from './ragEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

// Auto-load .env file if present
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (err) {
  console.warn('Note: Could not parse local .env file:', err.message);
}

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // API Route: Health check
  if (url.pathname === '/api/health' && req.method === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
    return sendJson(res, 200, {
      ok: true,
      status: 'healthy',
      modelMode: hasKey ? 'online-api' : 'offline-mock',
      provider: process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'local-mock',
    });
  }

  // API Route: Get reference documents
  if (url.pathname === '/api/docs' && req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      docs: DOCUMENTS,
    });
  }

  // API Route: Chat Q&A
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const question = body.question?.trim();
      const simulateFailure = Boolean(body.simulateFailure);

      if (!question && !simulateFailure) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Question cannot be empty.',
        });
      }

      const result = await askHelpDesk(question || 'Test failure trigger', { simulateFailure });

      return sendJson(res, 200, {
        ok: true,
        data: result,
      });
    } catch (err) {
      const statusCode = err.status || 500;
      return sendJson(res, statusCode, {
        ok: false,
        error: err.message || 'Internal server error while processing question.',
        code: err.code || 'API_ERROR',
        suggestion: 'If the LLM endpoint is experiencing issues, verify network connection or toggle off failure simulation.',
      });
    }
  }

  // Static File Serving
  if (req.method === 'GET') {
    let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);

    // Prevent path traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);

      res.writeHead(200, { 'Content-Type': mime });
      return res.end(content);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`BrightPath AI Help Desk server running at: http://localhost:${PORT}`);
  console.log(`Palletism Taste Pack: Graphite Sketch`);
  const activeMode = process.env.OPENROUTER_API_KEY
    ? `OpenRouter (${process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'})`
    : process.env.GEMINI_API_KEY
    ? 'Gemini 1.5 Flash'
    : process.env.OPENAI_API_KEY
    ? 'OpenAI'
    : 'Deterministic Offline Mock';
  console.log(`LLM Mode: ${activeMode}`);
});

export { server };
