import { dbSource, getPglite } from "@/lib/db";
import { toSql, type Sql } from "./sql.ts";

let poolPromise: Promise<import("pg").Pool> | null = null;

async function neonPool() {
  poolPromise ??= (async () => {
    const { Pool, types } = await import("pg");
    types.setTypeParser(20, (value) => Number(value));
    types.setTypeParser(1082, (value) => value);
    types.setTypeParser(1186, (value) => value);
    return new Pool({ connectionString: process.env.DATABASE_URL });
  })();
  return poolPromise;
}

/** One transaction on PGLite (preview) or a dedicated Neon client (deployed). */
export async function withTransaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  if (dbSource === "pglite") {
    const pg = await getPglite();
    return pg.transaction(async (tx) =>
      fn(
        toSql(async (text, params) => {
          const result = await tx.query(text, params);
          return result.rows;
        }),
      ),
    );
  }
  const pool = await neonPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(
      toSql(async (text, params) => {
        const res = await client.query(text, params);
        return res.rows;
      }),
    );
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* already aborted */
    }
    throw error;
  } finally {
    client.release();
  }
}
