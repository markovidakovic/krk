import 'dotenv/config';
import http from 'node:http';
import * as db from './db';
import { RequestContext } from './types';
import { parseRequestBody } from './req';
import { handleBase, handleGetFiles, handleGetFile, handleDeleteFile, handleProcessFile } from './handlers';

db.ping();

http
  .createServer(async (req, res) => {
    const { method, url } = req;
    if (!method || !url) {
      res.writeHead(400, {
        'Content-Type': 'text/plain',
      });
      res.end('method or url not provided');
      return;
    }

    let body: Record<string, any> = {};
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await parseRequestBody(req);
        console.log('parsed body:', body);
      } catch (error) {
        // console.log(error);
        res.writeHead(400, {
          'conten-type': 'application/json',
        });
        res.end(
          JSON.stringify({
            message: 'invalid request body',
          }),
        );
        return;
      }
    }

    const reqCtx: RequestContext = {
      req,
      res,
      method,
      url,
      body,
    };

    if (method === 'GET' && url === '/') {
      await handleBase(reqCtx);
      return;
    }

    if (method === 'GET' && url === '/files') {
      await handleGetFiles(reqCtx);
      return;
    }

    const regex = /^\/files\/(\d+)$/;
    // const regex = /^\/files\/([0-9a-fA-F-]{36})$/;

    const match = url.match(regex);

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
          break;
      }
      return;
    }

    if (method === 'POST' && url === '/files/process') {
      await handleProcessFile(reqCtx);
      return;
    }

    console.log('url or method not supported');
    res.end('hello');
  })
  .listen(process.env.API_PORT);
