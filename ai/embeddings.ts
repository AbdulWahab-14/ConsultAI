// Shared by the Worker and Node indexing script; no framework dependencies.
export type EmbeddingConfig = {
  EMBEDDING_PROVIDER?: string;
  EMBEDDING_MODEL?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
};
export type EmbeddingTask = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT';
export function createEmbeddingProvider(config: EmbeddingConfig) {
  const vendor = (config.EMBEDDING_PROVIDER || 'gemini').trim().toLowerCase();
  if (vendor !== 'gemini' && vendor !== 'openai') return null;
  const key =
    vendor === 'gemini' ? config.GEMINI_API_KEY : config.OPENAI_API_KEY;
  if (!key) return null;
  const model = (
    config.EMBEDDING_MODEL ||
    (vendor === 'gemini' ? 'gemini-embedding-001' : 'text-embedding-3-small')
  ).replace(/^models\//, '');
  return {
    profile: `${vendor}:${model}:1536`,
    async embed(texts: string[], task: EmbeddingTask): Promise<number[][]> {
      if (!texts.length) return [];
      if (texts.length > 32) throw new Error('Embedding batch too large');
      const gemini = vendor === 'gemini';
      const response = await fetch(
        gemini
          ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:batchEmbedContents`
          : 'https://api.openai.com/v1/embeddings',
        {
          method: 'POST',
          signal: AbortSignal.timeout(30000),
          headers: {
            'Content-Type': 'application/json',
            ...(gemini
              ? { 'x-goog-api-key': key }
              : { Authorization: `Bearer ${key}` }),
          },
          body: JSON.stringify(
            gemini
              ? {
                  requests: texts.map((text) => ({
                    model: `models/${model}`,
                    content: { parts: [{ text }] },
                    taskType: task,
                    outputDimensionality: 1536,
                  })),
                }
              : { model, input: texts, dimensions: 1536 },
          ),
        },
      );
      if (!response.ok) throw new Error('Embeddings unavailable');
      const data = (await response.json()) as {
        embeddings?: { values: number[] }[];
        data?: { index: number; embedding: number[] }[];
      };
      const rows = data.data?.sort((a, b) => a.index - b.index);
      if (!gemini && rows?.some((r, i) => r.index !== i))
        throw new Error('Invalid embedding order');
      const vectors = gemini
        ? data.embeddings?.map((e) => e.values)
        : rows?.map((e) => e.embedding);
      if (
        !vectors ||
        vectors.length !== texts.length ||
        vectors.some(
          (v) =>
            !Array.isArray(v) ||
            v.length !== 1536 ||
            v.some((n) => !Number.isFinite(n)),
        )
      )
        throw new Error('Invalid embeddings');
      return vectors.map((v) => {
        const norm = Math.hypot(...v);
        if (!norm || !Number.isFinite(norm))
          throw new Error('Invalid embedding norm');
        return v.map((n) => n / norm);
      });
    },
  };
}
