import 'dotenv/config';
import http from 'node:http';
import * as db from './db';
import { RequestContext } from './types';
import { parseRequestBody } from './req';

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
      // just for testing body extraction
      body = await parseRequestBody(req);
    }

    const reqCtx: RequestContext = {
      req,
      res,
      method,
      path: url,
      body,
    };

    console.log(reqCtx);

    if (method === 'GET' && url === '/') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
      });
      res.end(
        JSON.stringify({
          title: process.env.API_TITLE,
        }),
      );
      return;
    }

    if (method === 'GET' && url === '/files') {
      // handle get all files
      console.log('get all files');
    }

    const regex = /^\/files\/(\d+)$/;
    // const regex = /^\/files\/([0-9a-fA-F-]{36})$/

    const match = url?.match(regex);

    if (match) {
      reqCtx.fileId = match[1];
      switch (method) {
        case 'GET':
          console.log('get file by id');
          break;

        case 'DELETE':
          console.log('delete file');

        default:
          break;
      }
    }

    if (method === 'POST' && url === '/files/process') {
      // extract the body
      // handle start process
      console.log('start processing file');
    }

    res.end('hello');
  })
  .listen(process.env.API_PORT);
