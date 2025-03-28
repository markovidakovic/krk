import path from 'node:path';
import { promises as fsPromises } from 'node:fs';
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
  try {
    const sql: Query = {
      text: 'select * from files',
    };
    const result = await db.query<FileRecord>(sql);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result.rows));
  } catch (error) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'internal server error' }));
  }
}

export async function handleGetFile(ctx: RequestContext) {
  const { res, fileId } = ctx;

  if (!fileId) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'invalid file id' }));
    return;
  }

  try {
    const sql: Query = {
      text: 'select * from files where id = $1',
      values: [fileId],
    };

    const result = await db.query<FileRecord>(sql);

    if (result.rowCount === 0) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'file not found' }));
      return;
    }

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result.rows[0]));
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'internal server error' }));
  }
}

export async function handleProcessFile(ctx: RequestContext) {
  const { res, body } = ctx;

  if (!body.file_path) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'file_path is required' }));
    return;
  }

  const absFilePath = path.resolve(body.file_path);

  try {
    await fsPromises.access(absFilePath, fsPromises.constants.F_OK);
  } catch (error) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'file not found' }));
    return;
  }

  try {
    const sql: Query = {
      text: 'insert into files (path, status) values ($1, $2) returning *',
      values: [absFilePath, 'Processing'],
    };

    const result = await db.query<FileRecord>(sql);

    // publish message for processing

    res.writeHead(202, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result.rows[0]));
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'internal server error' }));
  }
}

export async function handleDeleteFile(ctx: RequestContext) {
  const { res, fileId } = ctx;

  if (!fileId) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'invalid file id' }));
    return;
  }

  try {
    const findSql: Query = {
      text: 'select * from files where id = $1',
      values: [fileId],
    };
    const result = await db.query<FileRecord>(findSql);
    if (result.rowCount === 0) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'file not found' }));
      return;
    }

    const filePath = result.rows[0].path;
    const fileProcessedPath = result.rows[0].processed_path;

    const deletionPromises: Promise<void>[] = [];

    // check if original file exists and add to deletion promises
    try {
      await fsPromises.access(filePath);
      deletionPromises.push(fsPromises.unlink(filePath));
    } catch (error) {
      console.warn(`original file not found or not accessible: ${filePath}`);
    }

    // only handle processed file if it is not null
    if (fileProcessedPath !== null) {
      try {
        await fsPromises.access(fileProcessedPath);
        deletionPromises.push(fsPromises.unlink(fileProcessedPath));
      } catch (error) {
        console.warn(`processed file not found or not accessible: ${fileProcessedPath}`);
      }
    }

    // delete all accessible files
    if (deletionPromises.length > 0) {
      await Promise.all(deletionPromises);
    }

    // only delete the database record if we've gotten this far
    const deleteSql: Query = {
      text: 'delete from files where id = $1',
      values: [fileId],
    };

    await db.query(deleteSql);

    res.statusCode = 204;
    res.end();
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'internal server error' }));
  }
}
