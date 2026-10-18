import { i as getPglite, t as dbSource } from "./db-zNj4X4Ml.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tx.server-D4HQ4LZv.js
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0] ?? "";
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
var poolPromise = null;
async function neonPool() {
	poolPromise ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.n);
		types.setTypeParser(20, (value) => Number(value));
		types.setTypeParser(1082, (value) => value);
		types.setTypeParser(1186, (value) => value);
		return new Pool({ connectionString: process.env.DATABASE_URL });
	})();
	return poolPromise;
}
/** One transaction on PGLite (preview) or a dedicated Neon client (deployed). */
async function withTransaction(fn) {
	if (dbSource === "pglite") return (await getPglite()).transaction(async (tx) => fn(toSql(async (text, params) => {
		return (await tx.query(text, params)).rows;
	})));
	const client = await (await neonPool()).connect();
	try {
		await client.query("BEGIN");
		const result = await fn(toSql(async (text, params) => {
			return (await client.query(text, params)).rows;
		}));
		await client.query("COMMIT");
		return result;
	} catch (error) {
		try {
			await client.query("ROLLBACK");
		} catch {}
		throw error;
	} finally {
		client.release();
	}
}
//#endregion
export { withTransaction };
