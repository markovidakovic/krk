import http from 'node:http';
import { RequestContext } from './types';
import { parseRequestBody } from './req';
import { handleResourceNotFound, handleMethodNotAllowed } from './res';
import { handleBase, handleGetFiles, handleGetFile, handleDeleteFile, handleProcessFile } from './handlers';

export const create = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
  const { method, url } = req;
  if (!method || !url) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'method or url not provided' }));
    return;
  }

  let body: Record<string, any> = {};
  if (method === 'POST' || method === 'PUT') {
    try {
      body = await parseRequestBody(req);
    } catch (error) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'invalid request body' }));
      return;
    }
  }

  const reqCtx: RequestContext = { req, res, method, url, body };

  if (url === '/') {
    switch (method) {
      case 'GET':
        await handleBase(reqCtx);
        break;

      default:
        handleMethodNotAllowed(reqCtx);
        break;
    }
    return;
  }

  if (url === '/files') {
    switch (method) {
      case 'GET':
        await handleGetFiles(reqCtx);
        break;
      default:
        handleMethodNotAllowed(reqCtx);
        break;
    }
    return;
  }

  const match = url.match(/^\/files\/(\d+)$/);

  if (match) {
    reqCtx.fileId = match[1];
    switch (method) {
      case 'GET':
        await handleGetFile(reqCtx);
        break;
      case 'DELETE':
        await handleDeleteFile(reqCtx);
        break;
      default:
        handleMethodNotAllowed(reqCtx);
        break;
    }
    return;
  }

  if (url === '/files/process') {
    switch (method) {
      case 'POST':
        await handleProcessFile(reqCtx);
        break;

      default:
        handleMethodNotAllowed(reqCtx);
        break;
    }
    return;
  }

  handleResourceNotFound(reqCtx);
  return;
};
