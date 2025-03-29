import { connect, NatsConnection } from 'nats';

let natsConn: NatsConnection | null = null;
// const codec = StringCodec();

export async function connectNats(): Promise<NatsConnection | null> {
  try {
    return await connect({ servers: process.env.NATS_SERVER });
  } catch (error) {
    console.error('failed to connect to  nats:', error);
    return null;
  }
}

export function publishMessage() {
  if (natsConn === null) {
    console.log('nats not connected');
  }
}

export function subscribeNats() {
  if (natsConn === null) {
    console.log('nats not connected');
  }
}
