import { connect, NatsConnection, StringCodec } from 'nats';
import * as db from './db';
import { FileRecord, ProcessedFile, ProcessFileRequest, Query } from './types';

let natsConn: NatsConnection | null = null;
const codec = StringCodec();

export async function connectNats(): Promise<void> {
  try {
    natsConn = await connect({ servers: process.env.NATS_SERVER });
    subscribeNats();
  } catch (error) {
    console.error('failed to connect to nats:', error);
  }
}

export function subscribeNats() {
  if (natsConn !== null) {
    // wildcard subscription
    const sub = natsConn.subscribe('mp4.process.*');

    (async () => {
      for await (const m of sub) {
        const procFile: ProcessedFile = JSON.parse(codec.decode(m.data));
        const procStatus = procFile.processingError ? 'Failed' : 'Successful';
        console.log(`received a processing response for -> fileId: ${procFile.id}, processedFilePath: ${procFile.processedPath}`);

        try {
          if (procFile.processingError) {
            const sql: Query = {
              text: 'update files set status = $1, processing_error = $2 where id = $3',
              values: [procStatus, procFile.processingError, procFile.id.toString()],
            };
            await db.query<FileRecord>(sql);
          } else {
            const sql: Query = {
              text: 'update files set status = $1, processed_path = $2 where id = $3',
              values: [procStatus, procFile.processedPath!, procFile.id.toString()],
            };
            await db.query<FileRecord>(sql);
          }
        } catch (error) {
          console.log('failed to update file processing status:', error);
        }
      }
    })();
  }
}

export function publishMessage(fileId: number, filePath: string): boolean {
  if (natsConn === null) {
    return false;
  }

  const procReq: ProcessFileRequest = { id: fileId, path: filePath };

  natsConn.publish('mp4.process', codec.encode(JSON.stringify(procReq)));
  console.log(`published processing request for -> fileId: ${fileId}, filePath: ${filePath}`);
  return true;
}
