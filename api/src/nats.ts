import { connect, NatsConnection, StringCodec } from 'nats';
import { ProcessRequest } from './types';

let natsConn: NatsConnection | null = null;
const codec = StringCodec();

export async function connectNats(): Promise<void> {
  try {
    natsConn = await connect({ servers: process.env.NATS_SERVER });
  } catch (error) {
    console.error('failed to connect to nats:', error);
  }
}

export function subscribeNats() {
  if (natsConn === null) {
    console.log('nats not connected');
  }
}

export function publishMessage(fileId: number, filePath: string): boolean {
  if (natsConn === null) {
    return false;
  }

  const procReq: ProcessRequest = { fileId, filePath };

  natsConn.publish('mp4.process', codec.encode(JSON.stringify(procReq)));
  console.log(`published processing request for -> fileId: ${procReq.fileId}, filePath: ${procReq.filePath}`);
  return true;
}
