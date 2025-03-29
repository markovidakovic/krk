import http from 'node:http';

type ProcStatus = 'Processing' | 'Failed' | 'Successful';

export interface FileRecord {
  id: number;
  path: string;
  status: ProcStatus;
  processed_path: string | null;
  processing_error: string | null;
  created_at: Date;
}

export interface RequestContext {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  method: string;
  url: string;
  body: Record<string, any>;
  fileId?: string;
}

export interface Query {
  text: string;
  values?: string[];
}

export interface ProcessRequest {
  fileId: number;
  filePath: string;
}
