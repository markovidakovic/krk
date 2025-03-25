import http from 'node:http';

export function parseRequestBody(req: http.IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let bodyBuf: Buffer[] = [];
    req
      .on('data', (chunk) => {
        bodyBuf.push(chunk);
      })
      .on('end', () => {
        let bodyStr = Buffer.concat(bodyBuf).toString();
        resolve(JSON.parse(bodyStr));
      });
  });
}
