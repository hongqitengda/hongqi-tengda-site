'use strict';

const http = require('http');
const { processRequest, processBinaryUpload, VERSION } = require('./app');

const host = '0.0.0.0';
const port = Number(process.env.PORT || 9000);
const MAX_JSON_BODY = 2 * 1024 * 1024;
const MAX_FILE_BODY = 5 * 1024 * 1024;

function readBuffer(req, maxBody) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBody) {
        reject(Object.assign(new Error(`请求内容超过 ${Math.round(maxBody / 1024 / 1024)} MB`), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const query = Object.fromEntries(url.searchParams.entries());
    const isUpload = query.action === 'uploadAttachment' || /\/uploadAttachment\/?$/i.test(url.pathname) || /application\/octet-stream/i.test(String(req.headers['content-type'] || ''));
    const raw = await readBuffer(req, isUpload ? MAX_FILE_BODY : MAX_JSON_BODY);
    let result;
    if (isUpload) {
      result = await processBinaryUpload({ method: req.method, path: url.pathname, headers: req.headers, query, buffer: raw });
    } else {
      let body = {};
      if (raw.length) {
        try { body = JSON.parse(raw.toString('utf8')); } catch (_) { body = { rawBody: raw.toString('utf8') }; }
      }
      result = await processRequest({ method: req.method, path: url.pathname, headers: req.headers, query, body });
    }
    res.writeHead(result.statusCode, result.headers);
    res.end(result.statusCode === 204 ? '' : result.body);
  } catch (error) {
    console.error('[webPortal HTTP]', error && error.stack ? error.stack : error);
    const statusCode = Number(error.statusCode || 500);
    res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, code: 'HTTP_ERROR', message: error.message || 'HTTP server error' }));
  }
});

server.listen(port, host, () => {
  console.log(`HQTD webPortal v${VERSION} listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
