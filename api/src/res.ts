import { RequestContext } from './types';

export function handleResourceNotFound(ctx: RequestContext) {
  const { res } = ctx;
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ message: 'the requested resource was not found' }));
}

export function handleMethodNotAllowed(ctx: RequestContext) {
  const { res } = ctx;
  res.writeHead(405, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ message: 'the requested method is not supported' }));
}
