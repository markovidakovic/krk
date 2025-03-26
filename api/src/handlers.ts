import * as db from './db';
import { RequestContext, Query, FileRecord } from './types';

export async function handleBase(ctx: RequestContext) {
  const { res } = ctx;

  let result = {
    title: process.env.API_TITLE,
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

export async function handleGetFiles(ctx: RequestContext) {
  const { res } = ctx;

  const sql: Query = {
    text: 'select * from files',
  };

  const result = await db.query<FileRecord>(sql);

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(JSON.stringify(result.rows));
}

export async function handleGetFile(ctx: RequestContext) {
  const { res } = ctx;

  console.log(ctx.method);
  console.log(ctx.fileId);

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('handle get file');
}

export async function handleProcessFile(ctx: RequestContext) {
  const { res } = ctx;

  console.log(ctx.method);
  console.log(ctx.body);

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('handle process file');
}

export async function handleDeleteFile(ctx: RequestContext) {
  const { res } = ctx;

  console.log(ctx.method);
  console.log(ctx.fileId);

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('handle delete file');
}
