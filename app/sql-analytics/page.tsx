"use client";

import { useMemo, useState } from "react";

type ApiOk = {
  question: string;
  queryId: string;
  params: any[];
  sql: string;
  rowCount: number;
  rows: Record<string, any>[];
};

type ApiErr = { error: string; details?: any; llmRaw?: any };

async function post(question: string): Promise<ApiOk | ApiErr> {
  const r = await fetch("/api/sql-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const text = await r.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { error: "Non-JSON response", raw: text };
  }
  return json;
}

const EXAMPLES = [
  "Revenue by region for March 2026",
  "Total revenue for March 2026",
  "Top 5 vehicle models by revenue",
  "Average order amount by region",
  "How many paid orders by payment type?",
];

export default function SqlAnalyticsPage() {
  const [question, setQuestion] = useState(EXAMPLES[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiOk | ApiErr | null>(null);

  const rows = (data && "rows" in data && Array.isArray(data.rows)) ? data.rows : [];
  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Sales Analytics Chat (SQL)</h1>
        <p className="text-sm text-gray-600">
          Natural language → query catalog routing (Ollama) → Neon Postgres results.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700">Question</label>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            placeholder="e.g. Revenue by region for March 2026"
          />

          <button
            onClick={async () => {
              setLoading(true);
              try {
                const res = await post(question);
                setData(res);
              } finally {
                setLoading(false);
              }
            }}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Running…" : "Run"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setQuestion(ex)}
              className="rounded-full border px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              type="button"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Error */}
        {data && "error" in data && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <div className="font-medium">Error</div>
            <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}

        {/* Success */}
        {data && !("error" in data) && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">queryId</div>
                <div className="mt-1 font-mono text-sm">{data.queryId}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">params</div>
                <div className="mt-1 font-mono text-sm">{JSON.stringify(data.params)}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">rows</div>
                <div className="mt-1 font-mono text-sm">{data.rowCount}</div>
              </div>
            </div>

            <details className="rounded-xl border p-3">
              <summary className="cursor-pointer text-sm font-medium">Generated SQL</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs">
                {data.sql}
              </pre>
            </details>

            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="px-3 py-2 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} className="border-t">
                      {columns.map((c) => (
                        <td key={c} className="px-3 py-2">
                          {String(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td className="px-3 py-3 text-gray-500" colSpan={Math.max(columns.length, 1)}>
                        No rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-500">
              Tip: This PoC uses a query catalog for safe, reliable SQL execution (SELECT-only templates).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
