import mysql from 'mysql2/promise';
import { createOpenAI } from "@ai-sdk/openai";
import { createJina } from 'jina-ai-provider';

export const openRouterClient = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  headers: {
    "HTTP-Referer": process.env.OPENROUTER_REFERER || "",
    "X-Title": process.env.OPENROUTER_TITLE || "Khroma",
  },
  baseURL: "https://openrouter.ai/api/v1",
});

// New, correctly configured OpenAI provider for embeddings
export const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const jina = createJina({
    apiKey: process.env.JINA_API_KEY,
});


type Pool = mysql.Pool;

let pool: Pool | undefined;

function hasDbEnv() {
  const { TIDB_HOST, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE } = process.env;
  return Boolean(TIDB_HOST && TIDB_USER && TIDB_PASSWORD && TIDB_DATABASE);
}

function getConfig() {
  const {
    TIDB_HOST,
    TIDB_PORT = '4000',
    TIDB_USER,
    TIDB_PASSWORD,
    TIDB_DATABASE,
    TIDB_ENABLE_SSL = 'true',
    TIDB_TLS_REJECT_UNAUTHORIZED = 'true',
    TIDB_SSL_CA,
  } = process.env;

  let ssl: any = undefined;
  if (TIDB_ENABLE_SSL === 'true') {
    ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: TIDB_TLS_REJECT_UNAUTHORIZED === 'true',
      ca: TIDB_SSL_CA || undefined,
    };
  }

  return {
    host: TIDB_HOST,
    port: Number(TIDB_PORT),
    user: TIDB_USER,
    password: TIDB_PASSWORD,
    database: TIDB_DATABASE,
    ssl,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
  };
}

function createPool(): Pool {
  const cfg = getConfig();
  return mysql.createPool(cfg);
}

export async function getDb(): Promise<Pool> {
  if (!hasDbEnv()) {
    throw new Error("Database environment variables are not configured");
  }
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function runQuery<T extends mysql.RowDataPacket[][] | mysql.RowDataPacket[] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader>(sql: string, params?: any[]): Promise<[T, mysql.FieldPacket[]]> {
  const db = await getDb();
  return db.query<T>(sql, params);
}
