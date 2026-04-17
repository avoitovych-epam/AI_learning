"use client";

import { useMemo, useState } from "react";
import OllamaStatus from "./components/OllamaStatus";

type TabId = "lab1" | "lab2" | "lab3" | "agent";

async function post(path: string, body: unknown) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await r.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!r.ok) {
    return { error: `HTTP ${r.status}`, details: json };
  }
  return json;
}

const styles = {
  page: {
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    maxWidth: 980,
    margin: "24px auto",
    padding: 16,
  } as const,
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap" as const,
    marginBottom: 12,
  },
  title: { margin: 0, fontSize: 22 } as const,
  subtitle: { margin: "6px 0 0", color: "#555", fontSize: 13 } as const,
  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 14,
    padding: 14,
    background: "white",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  } as const,
  tabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    margin: "12px 0 16px",
  } as const,
  tabBtn: (active: boolean) =>
    ({
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid",
      borderColor: active ? "#111" : "#d0d0d0",
      background: active ? "#111" : "#fff",
      color: active ? "#fff" : "#111",
      cursor: "pointer",
      fontSize: 13,
    } as const),
  label: { display: "block", fontSize: 12, color: "#555", marginBottom: 6 } as const,
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    outline: "none",
    fontSize: 14,
  } as const,
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    outline: "none",
    fontSize: 14,
    resize: "vertical" as const,
  } as const,
  btnRow: { display: "flex", gap: 10, alignItems: "center", marginTop: 10 } as const,
  btn: (variant: "primary" | "secondary" = "primary", disabled?: boolean) =>
    ({
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid",
      borderColor: variant === "primary" ? "#111" : "#d0d0d0",
      background: variant === "primary" ? "#111" : "#fff",
      color: variant === "primary" ? "#fff" : "#111",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.65 : 1,
      fontSize: 14,
    } as const),
  hint: { fontSize: 12, color: "#666", marginTop: 8 } as const,
  out: {
    whiteSpace: "pre-wrap" as const,
    background: "#fafafa",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #eee",
    marginTop: 12,
    maxHeight: 420,
    overflow: "auto" as const,
    fontSize: 12.5,
  } as const,
};

const TAB_LABELS: Record<TabId, string> = {
  lab1: "Lab 01 — Prompting",
  lab2: "Lab 02 — Embeddings",
  lab3: "Lab 03 — RAG",
  agent: "Lab 04 — Agent",
};

export default function Page() {
  const [tab, setTab] = useState<TabId>("lab1");

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>AI Onboarding Labs (Next.js + Ollama)</h2>
          <div style={styles.subtitle}>
            Prompting, embeddings, RAG, and a simple tool-using agent — running fully locally.
          </div>
        </div>
        <div style={{ minWidth: 260 }}>
          <OllamaStatus />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          {(Object.keys(TAB_LABELS) as TabId[]).map((id) => (
            <button key={id} onClick={() => setTab(id)} style={styles.tabBtn(tab === id)}>
              {TAB_LABELS[id]}
            </button>
          ))}
        </div>

        {tab === "lab1" && <Lab1 />}
        {tab === "lab2" && <Lab2 />}
        {tab === "lab3" && <Lab3 />}
        {tab === "agent" && <Agent />}
      </div>

      <div style={styles.hint}>
        Tip: if responses are slow on CPU, consider <code>OLLAMA_CHAT_MODEL=llama3.2:3b</code>.
      </div>

      {/* Separate section for SQL Analytics Demo */}
      <div style={{ marginTop: 24, padding: 16, border: '1px solid #e6e6e6', borderRadius: 12, background: '#f9f9f9' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 18, color: '#333' }}>Explore SQL Analytics</h4>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#555' }}>
          Dive into the SQL Analytics Demo to explore data insights and analytics capabilities.
        </p>
        <a
          href="/sql-analytics"
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            borderRadius: 8,
            background: '#0070f3',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
          className="hover:bg-blue-600"
        >
          Open SQL Analytics Demo →
        </a>
      </div>
    </div>
  );
}

function Output({ data }: { data: unknown }) {
  return <pre style={styles.out}>{data ? JSON.stringify(data, null, 2) : "—"}</pre>;
}

function Lab1() {
  const [text, setText] = useState(
    "We need to complete AI onboarding. Scope: review AI fundamentals (agents, tools, reasoning loops), set up local environment, configure IDE, create a Git repository, and complete labs for prompting, embeddings, RAG, and a simple agent/chatbot."
  );
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h3 style={{ margin: "0 0 10px" }}>Prompt engineering</h3>

      <label style={styles.label}>Input text</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        style={styles.textarea}
      />

      <div style={styles.btnRow}>
        <button
          style={styles.btn("primary", loading)}
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              setOut(await post("/api/lab1", { text }));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Running…" : "Run"}
        </button>
        <button
          style={styles.btn("secondary", loading)}
          disabled={loading}
          onClick={() => setOut(null)}
        >
          Clear
        </button>
      </div>

      <Output data={out} />
      
    </div>
  );
}

function Lab2() {
  const [query, setQuery] = useState("grounding with context");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h3 style={{ margin: "0 0 10px" }}>Embeddings similarity search</h3>

      <label style={styles.label}>Query</label>
      <input value={query} onChange={(e) => setQuery(e.target.value)} style={styles.input} />

      <div style={styles.btnRow}>
        <button
          style={styles.btn("primary", loading)}
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              setOut(await post("/api/lab2", { query }));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Running…" : "Run"}
        </button>
        <button
          style={styles.btn("secondary", loading)}
          disabled={loading}
          onClick={() => setOut(null)}
        >
          Clear
        </button>
      </div>

      <Output data={out} />
    </div>
  );
}

function Lab3() {
  const [question, setQuestion] = useState(
    "What is RAG and what should the model do when the answer is missing?"
  );
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h3 style={{ margin: "0 0 10px" }}>RAG grounded Q&A</h3>

      <label style={styles.label}>Question</label>
      <input value={question} onChange={(e) => setQuestion(e.target.value)} style={styles.input} />

      <div style={styles.btnRow}>
        <button
          style={styles.btn("primary", loading)}
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              setOut(await post("/api/lab3", { question }));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Running…" : "Run"}
        </button>
        <button
          style={styles.btn("secondary", loading)}
          disabled={loading}
          onClick={() => setOut(null)}
        >
          Clear
        </button>
      </div>

      <div style={styles.hint}>
        Try also: <code>What is the capital of France?</code> (should answer “I don’t know…”)
      </div>

      <Output data={out} />
    </div>
  );
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

function Agent() {
  const [input, setInput] = useState("Compute (12.5*4)/3");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "system", content: "You are helpful. Use tools when useful." },
  ]);

  const preview = useMemo(
    () => messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n"),
    [messages]
  );

  return (
    <div>
      <h3 style={{ margin: "0 0 10px" }}>Simple agent (tool routing)</h3>

      <label style={styles.label}>Message</label>
      <input value={input} onChange={(e) => setInput(e.target.value)} style={styles.input} />

      <div style={styles.btnRow}>
        <button
          style={styles.btn("primary", loading)}
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const next = [...messages, { role: "user" as const, content: input }];
              const res = await post("/api/agent", { messages: next });

              setOut(res);

              const replyText = (res && !res.error && res.reply) ? String(res.reply) : JSON.stringify(res);
              setMessages([...next, { role: "assistant", content: replyText }]);
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Sending…" : "Send"}
        </button>
        <button
          style={styles.btn("secondary", loading)}
          disabled={loading}
          onClick={() => {
            setOut(null);
            setMessages([{ role: "system", content: "You are helpful. Use tools when useful." }]);
          }}
        >
          Reset chat
        </button>
      </div>

      <div style={styles.hint}>
        Try: <code>Explain chunking using our onboarding notes.</code>
      </div>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer" }}>Conversation preview</summary>
        <pre style={styles.out}>{preview || "—"}</pre>
      </details>

      <Output data={out} />
    </div>
  );
}