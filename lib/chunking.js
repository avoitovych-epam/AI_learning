export function chunkText(text, { maxChars = 850 } = {}) {
  const paras = text.split(/\n\s*\n/g).map(s => s.trim()).filter(Boolean);

  const chunks = [];
  let buf = "";
  for (const p of paras) {
    if (!buf) { buf = p; continue; }
    if (buf.length + 2 + p.length <= maxChars) buf = `${buf}\n\n${p}`;
    else { chunks.push(buf); buf = p; }
  }
  if (buf) chunks.push(buf);

  return chunks.map((t, i) => ({ id: `chunk_${String(i + 1).padStart(3, "0")}`, text: t }));
}