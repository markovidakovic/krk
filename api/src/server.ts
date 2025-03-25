import 'dotenv/config';
import http from 'node:http';
import * as db from './db';

db.ping();

http
  .createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(
      JSON.stringify({
        version: process.env.API_VERSION,
        title: process.env.API_TITLE,
      }),
    );
  })
  .listen(process.env.API_PORT);
