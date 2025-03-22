import http from 'node:http';
import 'dotenv/config';

http
  .createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(
      JSON.stringify({
        version: process.env.VERSION,
        title: process.env.TITLE,
      }),
    );
  })
  .listen(process.env.PORT);
