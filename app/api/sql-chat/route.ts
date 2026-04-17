import { NextResponse } from "next/server";
import { Pool } from "pg";
import { chat } from "@/lib/ollama";

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

type QueryId =
  | "revenue_by_region_month"
  | "total_revenue_month"
  | "top_models_by_revenue"
  | "avg_order_amount_by_region"
  | "orders_by_payment_type";

const CATALOG: Record<QueryId, { description: string; sql: string; params: string[] }> = {
  revenue_by_region_month: {
    description: "Revenue and orders by region for a given month/year",
    params: ["year", "month"],
    sql: `
      SELECT s.region, COUNT(*) AS orders, SUM(s.amount) AS revenue
      FROM sales_orders s
      WHERE s.status = 'paid'
        AND EXTRACT(YEAR FROM s.order_date) = $1
        AND EXTRACT(MONTH FROM s.order_date) = $2
      GROUP BY s.region
      ORDER BY revenue DESC
    `,
  },
  total_revenue_month: {
    description: "Total revenue for a given month/year",
    params: ["year", "month"],
    sql: `
      SELECT SUM(s.amount) AS total_revenue
      FROM sales_orders s
      WHERE s.status = 'paid'
        AND EXTRACT(YEAR FROM s.order_date) = $1
        AND EXTRACT(MONTH FROM s.order_date) = $2
    `,
  },
  top_models_by_revenue: {
    description: "Top N vehicle models by revenue (paid orders)",
    params: ["limit"],
    sql: `
      SELECT i.make, i.model, COUNT(*) AS orders, SUM(s.amount) AS revenue
      FROM sales_orders s
      JOIN inventory i ON i.vehicle_id = s.vehicle_id
      WHERE s.status = 'paid'
      GROUP BY i.make, i.model
      ORDER BY revenue DESC
      LIMIT $1
    `,
  },
  avg_order_amount_by_region: {
    description: "Average order amount by region (paid orders)",
    params: [],
    sql: `
      SELECT s.region, AVG(s.amount) AS avg_amount
      FROM sales_orders s
      WHERE s.status = 'paid'
      GROUP BY s.region
      ORDER BY avg_amount DESC
    `,
  },
  orders_by_payment_type: {
    description: "Orders count by payment type (paid orders)",
    params: [],
    sql: `
      SELECT s.payment_type, COUNT(*) AS orders
      FROM sales_orders s
      WHERE s.status = 'paid'
      GROUP BY s.payment_type
      ORDER BY orders DESC
    `,
  },
};

function extractJson(text: string) {
  const cleaned = (text || "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function clampInt(x: any, { min, max, def }: { min: number; max: number; def: number }) {
  const n = Number.parseInt(String(x), 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const q = String(question ?? "").trim();
    const qLower = q.toLowerCase();

    if (qLower.includes("payment type")) {
        const queryId = "orders_by_payment_type" as const;
        const sql = CATALOG[queryId].sql.trim();
        const result = await pool.query(sql);
        return NextResponse.json({
            question: q,
            queryId,
            params: [],
            sql,
            rowCount: result.rowCount,
            rows: result.rows,
            routedBy: "keyword"
        });
    }
    
    if (!q) return NextResponse.json({ error: "Missing question" }, { status: 400 });

    const llm = await chat({
      messages: [
        {
          role: "system",
          content:
            "You are a routing assistant for sales analytics.\n" +
            "Choose the best queryId from the catalog and fill parameters.\n" +
            "Return ONLY JSON: {\"queryId\":\"...\",\"params\":{...}}.\n" +
            "Do NOT return SQL.",
        },
        {
          role: "user",
          content:
            `Catalog:\n` +
            Object.entries(CATALOG)
              .map(([id, v]) => `- ${id}: ${v.description} (params: ${v.params.join(", ") || "none"})`)
              .join("\n") +
            `\n\nQuestion: ${q}\n\n` +
            `Examples:\n` +
            `Q: "Revenue by region for March 2026" -> {"queryId":"revenue_by_region_month","params":{"year":2026,"month":3}}\n` +
            `Q: "Top 5 models by revenue" -> {"queryId":"top_models_by_revenue","params":{"limit":5}}\n`,
        },
      ],
      temperature: 0,
    });


    const jsonStr = extractJson(llm);
    let parsed: any;
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            return NextResponse.json(
                { error: "LLM returned invalid JSON", llmRaw: llm, extracted: jsonStr },
                { status: 400 }
            );
        }

    const queryId = parsed.queryId as QueryId;
    if (!queryId || !(queryId in CATALOG)) {
      return NextResponse.json(
        { error: "LLM did not select a valid queryId", llmRaw: llm },
        { status: 400 }
      );
    }

    const paramsObj = parsed.params ?? {};
    let values: any[] = [];

    if (queryId === "revenue_by_region_month" || queryId === "total_revenue_month") {
      const year = clampInt(paramsObj.year, { min: 2000, max: 2100, def: 2026 });
      const month = clampInt(paramsObj.month, { min: 1, max: 12, def: 3 });
      values = [year, month];
    } else if (queryId === "top_models_by_revenue") {
      const limit = clampInt(paramsObj.limit, { min: 1, max: 50, def: 5 });
      values = [limit];
    } else {
      values = [];
    }

    const sql = CATALOG[queryId].sql.trim();
    const result = await pool.query(sql, values);

    return NextResponse.json({
      question: q,
      queryId,
      params: values,
      sql,
      rowCount: result.rowCount,
      rows: result.rows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e), details: String(e) }, { status: 500 });
  }
}
