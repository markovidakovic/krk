import pg from 'pg';
import { Query } from './types';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT!),
  user: process.env.PG_USERNAME,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
});

// export const query = async (text: string, params: any): Promise<pg.QueryResult<any>> => {
//   const start = Date.now();
//   const res = await pool.query(text, params);
//   const duration = Date.now() - start;
//   console.log('executed query', { text, duration, rows: res.rowCount });
//   return res;
// };

export const query = async <T extends pg.QueryResultRow = pg.QueryResultRow>(params: Query): Promise<pg.QueryResult<T>> => {
  return await pool.query(params);
};

export const getClient = async () => await pool.connect();

export const ping = async (): Promise<void> => {
  const result = await pool.query('select now()');
  console.log(result.rows[0]);
};
