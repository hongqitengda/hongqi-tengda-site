'use strict';

const { processRequest, processBinaryUpload } = require('./app');

function parseBody(event) {
  if (!event) return {};
  if (event.body === undefined || event.body === null || event.body === '') return event.action ? event : {};
  let raw = event.body;
  if (event.isBase64Encoded && typeof raw === 'string') raw = Buffer.from(raw, 'base64').toString('utf8');
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (_) { return { rawBody: String(raw) }; }
}

function isBinaryUpload(event) {
  const queryAction = event && event.queryStringParameters && event.queryStringParameters.action;
  const path = String(event && (event.path || event.requestContext?.path) || '');
  const contentType = String(event && event.headers && (event.headers['content-type'] || event.headers['Content-Type']) || '');
  return queryAction === 'uploadAttachment' || /\/uploadAttachment\/?$/i.test(path) || /application\/octet-stream/i.test(contentType);
}

function binaryBody(event) {
  const raw = event && event.body;
  if (Buffer.isBuffer(raw)) return raw;
  if (typeof raw !== 'string') return Buffer.alloc(0);
  if (event.isBase64Encoded) return Buffer.from(raw, 'base64');
  return Buffer.from(raw, 'binary');
}

exports.main = async (event = {}, context = {}) => {
  if (isBinaryUpload(event)) {
    return processBinaryUpload({
      method: event.httpMethod || event.requestContext?.httpMethod || 'POST',
      path: event.path || event.requestContext?.path || '/api/webPortal',
      headers: event.headers || {},
      query: event.queryStringParameters || {},
      buffer: binaryBody(event),
      context
    });
  }
  return processRequest({
    method: event.httpMethod || event.requestContext?.httpMethod || 'POST',
    path: event.path || event.requestContext?.path || '/api/webPortal',
    headers: event.headers || {},
    query: event.queryStringParameters || {},
    body: parseBody(event),
    context
  });
};
