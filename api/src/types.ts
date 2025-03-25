type ProcStatus = 'Processing' | 'Failed' | 'Successful';

export interface FileRecord {
  id: number;
  path: string;
  status: ProcStatus;
  processed_path: string | null;
  processing_error: string | null;
  created_at: Date;
}
