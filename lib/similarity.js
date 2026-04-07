export function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function topK(queryVec, items, k = 5) {
  return items
    .map(it => ({ ...it, score: cosineSimilarity(queryVec, it.vector) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}