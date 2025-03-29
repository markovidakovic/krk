import 'dotenv/config';
import http from 'node:http';
import { create } from './http';
// import { connectNats } from './nats';

const run = async () => {
  console.log('starting node service');
  http.createServer(create).listen(process.env.API_PORT);
};

run();
