import http from 'node:http';
import 'dotenv/config';

http
  .createServer((req, res) => {
    const { headers, method, url } = req;
    console.log(headers);
    console.log(method);
    console.log(url);

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
