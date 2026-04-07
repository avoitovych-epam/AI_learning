"use client";

import { useEffect, useState } from "react";

export default function OllamaStatus() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const r = await fetch("/api/health-ollama", { cache: "no-store" });
        const data = await r.json().catch(() => ({}));
        if (!cancelled) setState({ loading: false, ok: r.ok && data.ok, data });
      } catch (e) {
        if (!cancelled) setState({ loading: false, ok: false, error: String(e) });
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) return <div style={{ marginBottom: 12 }}>Ollama: checking…</div>;

  if (!state.ok) {
    return (
      <div style={{ marginBottom: 12, color: "crimson" }}>
        Ollama: NOT OK
        <details style={{ marginTop: 6 }}>
          <summary>details</summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(state.data ?? { error: state.error }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12, color: "green" }}>
      Ollama: OK (chat: {state.data.chatModel}, embed: {state.data.embedModel})
    </div>
  );
}