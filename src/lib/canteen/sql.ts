/** Minimal SQL surface shared by server transactions and tests. */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

export function toSql(
  run: (text: string, params: unknown[]) => Promise<unknown[]>,
): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    return run(text, values) as Promise<T[]>;
  }) as Sql;
  sql.query = (text, params = []) => run(text, params) as Promise<never>;
  return sql;
}
